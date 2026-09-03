-- Facturación recurrente de bonos (vertical academia): cada bono de la
-- tarifa tiene un periodo (semanal/mensual); al asignarlo a un alumno se
-- genera ya la primera factura "pendiente", y cada día se comprueba si toca
-- generar la del siguiente periodo y si alguna lleva más de 5 días vencida
-- sin pagar, para avisar en Notificaciones.

-- 1) Periodo de cobro del bono (semanal o mensual).
alter table bono_types
  add column periodo text not null default 'mensual' check (periodo in ('semanal', 'mensual'));

-- 2) Qué tarifa generó cada bono activo del alumno, para poder refacturarlo
-- solo mientras siga activo. "active" permite dar de baja un bono sin
-- borrar el historial de sesiones ya consumidas.
alter table packages
  add column bono_type_id uuid references bono_types(id) on delete set null,
  add column active boolean not null default true;
create index on packages (bono_type_id) where bono_type_id is not null;

-- 3) A qué bono pertenece cada factura recurrente, de qué periodo es (para
-- no duplicarla) y cuándo vence (para saber cuándo avisar de que no se ha
-- pagado). Las facturas manuales (botón "Crear factura") no usan estos
-- campos.
alter table invoices
  add column package_id uuid references packages(id) on delete set null,
  add column billing_period text,
  add column due_date date;
create unique index invoices_package_period_key
  on invoices (package_id, billing_period)
  where package_id is not null and billing_period is not null;

-- 4) Notificaciones de cobro pendiente, además de las de lead de siempre.
-- "source" se amplía con 'facturacion'; el resto de campos de lead (source
-- formulario_web/instagram_dm/tiktok_dm, status contactada) no aplican a
-- este tipo, así que se distingue con "kind".
alter table notifications
  add column kind text not null default 'lead' check (kind in ('lead', 'cobro_pendiente')),
  add column invoice_id uuid references invoices(id) on delete cascade;
alter table notifications drop constraint notifications_source_check;
alter table notifications add constraint notifications_source_check
  check (source = ANY (ARRAY['formulario_web', 'instagram_dm', 'tiktok_dm', 'facturacion']));
create unique index notifications_invoice_unique on notifications (invoice_id) where invoice_id is not null;

-- 5) Genera (si no existe ya) la factura del periodo actual de un bono
-- concreto. La llama tanto el alta de un alumno (una vez, para el bono
-- recién elegido) como el ciclo diario (para todos los bonos activos).
create or replace function generate_invoice_for_package(p_package_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package packages%rowtype;
  v_bono bono_types%rowtype;
  v_contact contacts%rowtype;
  v_period_start date;
  v_period_key text;
  v_due_date date;
begin
  select * into v_package from packages where id = p_package_id and active and bono_type_id is not null;
  if not found then
    return;
  end if;

  select * into v_bono from bono_types where id = v_package.bono_type_id;
  if not found then
    return;
  end if;

  select * into v_contact from contacts where id = v_package.contact_id;
  if not found then
    return;
  end if;

  if v_bono.periodo = 'semanal' then
    v_period_start := date_trunc('week', current_date)::date;
    v_period_key := 'S' || to_char(v_period_start, 'IYYY-IW');
  else
    v_period_start := date_trunc('month', current_date)::date;
    v_period_key := 'M' || to_char(v_period_start, 'YYYY-MM');
  end if;
  -- Ventana de cobro de 5 días desde el inicio del periodo (para el bono
  -- mensual: del 1 al 5); vencida a partir del día siguiente.
  v_due_date := v_period_start + 4;

  insert into invoices (contact_id, concept, amount, status, package_id, billing_period, due_date)
  values (v_contact.id, v_bono.name, v_bono.price_eur, 'pendiente', v_package.id, v_period_key, v_due_date)
  on conflict (package_id, billing_period) where package_id is not null and billing_period is not null
  do nothing;
end;
$$;

-- 6) Recorre todos los bonos activos y genera la factura del periodo que
-- corresponda a cada uno (no hace nada si ya existe, gracias al índice
-- único anterior).
create or replace function generate_recurring_invoices()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in select id from packages where active and bono_type_id is not null loop
    perform generate_invoice_for_package(r.id);
  end loop;
end;
$$;

-- 7) Avisa en Notificaciones de las facturas de bono vencidas (más de 5
-- días desde el inicio del periodo) que sigan pendientes de pago, una vez
-- por factura.
create or replace function notify_unpaid_invoices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (company_id, source, kind, full_name, email, phone, message, status, contact_id, invoice_id)
  select
    c.company_id,
    'facturacion',
    'cobro_pendiente',
    c.full_name,
    c.email,
    c.phone,
    'Bono "' || i.concept || '" pendiente de cobro (' || to_char(i.amount, 'FM999999990.00') || ' €), vencido el ' || to_char(i.due_date, 'DD/MM/YYYY') || '.',
    'nueva',
    c.id,
    i.id
  from invoices i
  join contacts c on c.id = i.contact_id
  where i.status = 'pendiente'
    and i.due_date is not null
    and i.due_date < current_date
    and not exists (select 1 from notifications n where n.invoice_id = i.id);
end;
$$;

-- 8) Ciclo diario: primero genera las facturas del periodo que toque,
-- luego avisa de las que hayan quedado vencidas sin pagar.
create or replace function run_billing_cycle()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform generate_recurring_invoices();
  perform notify_unpaid_invoices();
end;
$$;

-- 9) Cron diario a las 05:00 UTC (~06:00-07:00 hora de España según horario
-- de verano/invierno).
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'zenzia-billing-cycle',
  '0 5 * * *',
  $$select run_billing_cycle();$$
);
