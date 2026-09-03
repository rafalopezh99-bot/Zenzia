-- CRM Interno — RL Digital Studios
-- Esquema base multi-tenant con sistema de módulos activables por cliente.
-- Pensado para Supabase (Postgres + Auth + RLS).

create extension if not exists "pgcrypto";

-- ============================================================
-- TENANTS (empresas cliente: la clínica, el taller, etc.)
-- ============================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vertical text not null check (vertical in (
    'fisio','osteopatia','nutricion','psicologia','podologia','entrenador_personal','dental','veterinaria',
    'estetica','peluqueria','barberia','manicura','tatuajes','spa',
    'taller',
    'reformas','parquet','pintura','electricista','fontaneria','cerrajeria','jardineria','limpieza',
    'agencia','asesoria','fotografia','academia'
  )),
  -- Autónomo o empresa — se pregunta en el asistente de configuración inicial.
  business_type text check (business_type in ('autonomo','empresa')),
  -- Si ya pasó por el asistente de configuración inicial (nombre, tipo de
  -- negocio, módulos por defecto). Mientras sea false, el panel redirige a
  -- /onboarding en lugar de mostrar el dashboard.
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Usuarios (empleados/profesionales) de cada empresa. auth.users es de Supabase Auth.
create table company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','staff')),
  -- Nombre de la persona que gestiona la cuenta, recogido en el asistente
  -- de configuración inicial. Se usa para el saludo del dashboard.
  full_name text,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- ============================================================
-- MÓDULOS: catálogo fijo + activación por empresa
-- ============================================================
create table modules (
  key text primary key,
  name text not null,
  description text
);

insert into modules (key, name, description) values
  ('agenda',              'Agenda y recordatorios',        'Citas, calendario y recordatorios automáticos'),
  ('historial_clinico',   'Historial por sesión',          'Ficha clínica / notas de cada sesión'),
  ('seguimiento',         'Seguimiento de progreso',       'Gráficas de evolución (peso, dolor, medidas...)'),
  ('ficha_vehiculo',      'Ficha de vehículo',             'Datos y unidad asociada al contacto (talleres)'),
  ('presupuestos',        'Presupuestos / OT',             'Presupuestos y órdenes de trabajo'),
  ('bonos',               'Bonos / paquetes de sesiones',  'Paquetes de sesiones prepagadas'),
  ('fotos',               'Fotos antes/después',           'Galería asociada al contacto'),
  ('consentimientos',     'Consentimientos',               'Documentos firmados por el paciente'),
  ('facturacion',         'Facturación',                   'Emisión de facturas simples');

create table company_modules (
  company_id uuid not null references companies(id) on delete cascade,
  module_key text not null references modules(key),
  enabled boolean not null default true,
  primary key (company_id, module_key)
);

-- ============================================================
-- CONTACTOS (pacientes / clientes)
-- ============================================================
create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}',   -- campos específicos del módulo/vertical
  status text not null default 'active' check (status in ('lead','active','inactive')),
  created_at timestamptz not null default now()
);
create index on contacts (company_id);

-- Activo opcional colgado del contacto (p. ej. vehículo en talleres)
create table assets (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  type text not null,                          -- 'vehicle', etc.
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- CITAS
-- ============================================================
create table appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  staff_user_id uuid references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  reminder_sent boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index on appointments (company_id, starts_at);

-- ============================================================
-- HISTORIAL / NOTAS / SESIONES
-- ============================================================
create table activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  type text not null check (type in ('note','session','call','progress')),
  content text,
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on activities (contact_id, created_at);

-- ============================================================
-- TAREAS INTERNAS
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BONOS / PAQUETES DE SESIONES
-- ============================================================
create table packages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  name text not null,
  total_sessions int not null,
  used_sessions int not null default 0,
  created_at timestamptz not null default now()
);

-- Tarifario por empresa (usado por el vertical academia): nivel + nombre +
-- cantidad (horas o clases, a elegir) + precio + periodo de cobro (semanal
-- o mensual). Al dar de alta un alumno eligiendo uno de estos, se crea ya
-- el bono activo en `packages` con esa cantidad lista para consumir, y
-- entra en el cobro recurrente según su periodo.
create table bono_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  nivel text not null,
  name text not null,
  unit text not null default 'horas' check (unit in ('horas', 'clases')),
  periodo text not null default 'mensual' check (periodo in ('semanal', 'mensual')),
  sessions int not null,
  price_eur numeric(10, 2) not null,
  created_at timestamptz not null default now()
);
create index on bono_types (company_id);

-- Si el bono de `packages` viene de una tarifa del tarifario, queda
-- enlazado aquí para poder refacturarlo solo: ver
-- generate_recurring_invoices() más abajo. "active" da de baja el cobro
-- recurrente sin borrar el historial de sesiones ya consumidas.
alter table packages
  add column bono_type_id uuid references bono_types(id) on delete set null,
  add column active boolean not null default true;
create index on packages (bono_type_id) where bono_type_id is not null;

-- Lista de asignaturas que imparte la empresa (vertical academia): controla
-- las casillas del formulario de alta de alumno para evitar variaciones del
-- mismo nombre escritas de forma distinta.
create table subjects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on subjects (company_id);
create unique index subjects_company_name_key on subjects (company_id, name);

-- ============================================================
-- RLS: aislamiento estricto por empresa
-- ============================================================
alter table companies enable row level security;
alter table company_users enable row level security;
alter table company_modules enable row level security;
alter table contacts enable row level security;
alter table assets enable row level security;
alter table appointments enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table packages enable row level security;
alter table bono_types enable row level security;
alter table subjects enable row level security;

-- helper: empresas a las que pertenece el usuario autenticado
-- security definer: evita la recursión infinita que se produciría si esta
-- función (usada dentro de la política RLS de company_users) volviera a
-- disparar esa misma política al consultar company_users.
create or replace function auth_company_ids()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select company_id from company_users where user_id = auth.uid()
$$;

create policy "member sees own company" on companies
  for select using (id in (select auth_company_ids()));

-- Necesaria para que el asistente de configuración inicial (onboarding)
-- pueda guardar el nombre real, el tipo de negocio y marcar la empresa
-- como configurada.
create policy "member updates own company" on companies
  for update using (id in (select auth_company_ids()))
  with check (id in (select auth_company_ids()));

create policy "member sees own company_users" on company_users
  for select using (company_id in (select auth_company_ids()));

-- Cada usuario solo puede editar su propia fila (p. ej. su nombre desde el
-- onboarding), nunca la de un compañero de la misma empresa.
create policy "member updates own profile" on company_users
  for update using (user_id = auth.uid() and company_id in (select auth_company_ids()))
  with check (user_id = auth.uid() and company_id in (select auth_company_ids()));

create policy "member sees own company_modules" on company_modules
  for select using (company_id in (select auth_company_ids()));

-- Faltaban estas dos: sin ellas, el asistente de configuración inicial
-- (completeOnboarding, que hace upsert en company_modules) fallaba con
-- 403 la primera vez que alguien distinto de RL Digital Studios pasaba
-- por /onboarding — ver migración 2026-09-03-company-modules-write-policy.sql.
create policy "member inserts own company_modules" on company_modules
  for insert
  to authenticated
  with check (company_id in (select auth_company_ids()));

create policy "member updates own company_modules" on company_modules
  for update
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access contacts" on contacts
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access assets" on assets
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

create policy "member full access appointments" on appointments
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access activities" on activities
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access tasks" on tasks
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access packages" on packages
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

create policy "member full access bono_types" on bono_types
  for all
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access subjects" on subjects
  for all
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

-- ============================================================
-- PRESUPUESTOS / ÓRDENES DE TRABAJO
-- ============================================================
create table quotes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  amount numeric(10,2) not null default 0,
  status text not null default 'pendiente' check (status in ('pendiente','aprobado','rechazado','completado')),
  notes text,
  created_at timestamptz not null default now()
);
create index on quotes (contact_id);

alter table quotes enable row level security;
create policy "member full access quotes" on quotes
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

-- ============================================================
-- FOTOS ANTES/DESPUÉS
-- ============================================================
create table photos (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  kind text not null check (kind in ('antes','despues')),
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index on photos (contact_id);

alter table photos enable row level security;
create policy "member full access photos" on photos
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

-- Storage: bucket privado para las fotos. Solo miembros de la empresa del
-- contacto pueden leer/escribir, comprobando el primer segmento de la ruta
-- del archivo (debe ser el contact_id) contra sus empresas.
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', false)
  on conflict (id) do nothing;

create policy "member access photos storage" on storage.objects
  for all using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1]::uuid in (
      select id from contacts where company_id in (select auth_company_ids())
    )
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1]::uuid in (
      select id from contacts where company_id in (select auth_company_ids())
    )
  );

-- ============================================================
-- CONSENTIMIENTOS
-- ============================================================
create table consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  signed boolean not null default false,
  signed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index on consents (contact_id);

alter table consents enable row level security;
create policy "member full access consents" on consents
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

-- ============================================================
-- FACTURACIÓN
-- ============================================================
create table invoices (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  concept text not null,
  amount numeric(10,2) not null default 0,
  status text not null default 'pendiente' check (status in ('pendiente','pagada','anulada')),
  -- Solo rellenos en facturas generadas por el cobro recurrente de un bono
  -- (ver más abajo); las facturas manuales (botón "Crear factura") los
  -- dejan a null.
  package_id uuid references packages(id) on delete set null,
  billing_period text,
  due_date date,
  created_at timestamptz not null default now()
);
create index on invoices (contact_id);
-- Evita duplicar la factura del mismo bono en el mismo periodo.
create unique index invoices_package_period_key
  on invoices (package_id, billing_period)
  where package_id is not null and billing_period is not null;

alter table invoices enable row level security;
create policy "member full access invoices" on invoices
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

-- ============================================================
-- COBRO RECURRENTE DE BONOS (vertical academia)
-- ============================================================
-- Al elegir un bono al dar de alta un alumno se genera ya la primera
-- factura pendiente (ver lib/actions/contacts.ts, que llama a
-- generate_invoice_for_package). Un cron diario (programado aparte con
-- cron.schedule, ver migración 2026-09-03-bono-recurring-billing.sql)
-- ejecuta run_billing_cycle(): genera la factura del periodo que toque
-- para cada bono activo, y avisa en `notifications` de las que llevan más
-- de 5 días vencidas sin pagar.

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

-- Programado aparte (requiere la extensión pg_cron, ya activada en el
-- proyecto): select cron.schedule('zenzia-billing-cycle', '0 5 * * *',
-- $$select run_billing_cycle();$$);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
-- Bandeja de dos tipos de aviso, distinguidos por "kind":
-- - 'lead' (por defecto): leads que TODAVÍA no son contactos — hoy el
--   formulario de zenzia.es/rldigitalstudios.com ('source' admite también
--   'instagram_dm'/'tiktok_dm' para cuando se conecten esos canales). Al
--   pulsar "Contactar" se crea el contacto de verdad.
-- - 'cobro_pendiente' (vertical academia): la genera solo
--   notify_unpaid_invoices() de más arriba, cuando un bono lleva más de 5
--   días vencido sin pagar. El alumno ya existe (contact_id), así que aquí
--   no hay "Contactar".
create table notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null default 'lead' check (kind in ('lead', 'cobro_pendiente')),
  source text not null check (source in ('formulario_web', 'instagram_dm', 'tiktok_dm', 'facturacion')),
  full_name text,
  email text,
  phone text,
  handle text,           -- @usuario de Instagram/TikTok, cuando no hay email/teléfono
  message text,
  status text not null default 'nueva' check (status in ('nueva', 'contactada', 'descartada')),
  contact_id uuid references contacts(id) on delete set null,
  invoice_id uuid references invoices(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on notifications (company_id, created_at desc);
create unique index notifications_invoice_unique on notifications (invoice_id) where invoice_id is not null;

alter table notifications enable row level security;

create policy "member full access notifications" on notifications
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

-- El formulario de la landing (zenzia.es y rldigitalstudios.com) no tiene
-- sesión, así que inserta como "anon".
create policy "public landing notification form" on notifications
  for insert
  to anon
  with check (company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24');

-- ============================================================
-- SEED de ejemplo: una empresa de fisioterapia con sus módulos
-- ============================================================
-- insert into companies (name, vertical) values ('Clínica Demo Fisio', 'fisio');
-- (activar módulos correspondientes en company_modules tras crear la empresa y el usuario)
