-- Estas funciones son SECURITY DEFINER: corren con permisos elevados y por
-- eso saltan las políticas RLS a propósito (para poder tocar citas/facturas
-- de varias empresas cuando hace falta — el cron diario necesita barrer
-- TODAS las empresas de una sentada, no solo una). El problema: Postgres
-- concede EXECUTE a "PUBLIC" por defecto al crear una función, y PUBLIC no
-- es un rol — es un permiso que hereda CUALQUIER rol, "anon" (sin sesión)
-- incluido. Estaban todas llamables desde fuera vía /rest/v1/rpc/<nombre>,
-- alguna incluso sin haber iniciado sesión, y como saltan RLS, un uso
-- malicioso podía tocar datos de OTRA empresa (generar citas o facturas
-- ajenas con generate_appointments_for_schedule / generate_invoice_for_
-- package, que reciben un id sin comprobar de quién es).

revoke execute on function public.auth_company_ids() from public;
revoke execute on function public.is_zenzia_admin() from public, anon;
revoke execute on function public.complete_finished_academia_appointments() from public;
revoke execute on function public.generate_appointments_for_schedule(uuid) from public;
revoke execute on function public.generate_invoice_for_package(uuid) from public;
revoke execute on function public.generate_recurring_appointments() from public;
revoke execute on function public.generate_recurring_invoices() from public;
revoke execute on function public.notify_academia_hour_overages() from public;
revoke execute on function public.notify_signup_request() from public;
revoke execute on function public.notify_unpaid_invoices() from public;
revoke execute on function public.run_billing_cycle() from public;
revoke execute on function public.run_daily_maintenance() from public;

-- auth_company_ids()/is_zenzia_admin() las usan las propias políticas RLS
-- en cada consulta de un usuario logueado (no filtran nada ajeno, solo
-- devuelven lo del que pregunta); las otras 4 las llama el panel ya
-- logueado (dashboard, citas, seguimiento, alta de alumno con bono — ver
-- lib/actions/appointments.ts, lib/actions/contacts.ts). Todas necesitan
-- seguir siendo ejecutables por "authenticated".
grant execute on function public.auth_company_ids() to authenticated;
grant execute on function public.is_zenzia_admin() to authenticated;
grant execute on function public.complete_finished_academia_appointments() to authenticated;
grant execute on function public.generate_appointments_for_schedule(uuid) to authenticated;
grant execute on function public.generate_invoice_for_package(uuid) to authenticated;
grant execute on function public.notify_academia_hour_overages() to authenticated;

-- Las otras 6 (generate_recurring_appointments, generate_recurring_invoices,
-- notify_signup_request, notify_unpaid_invoices, run_billing_cycle,
-- run_daily_maintenance) se quedan sin nadie con permiso explícito: solo
-- las sigue pudiendo llamar "postgres" (dueño de las funciones, con quien
-- corre el cron diario), que conserva el privilegio por ser el dueño aunque
-- no aparezca en ningún grant.

-- Las 4 que se quedan ejecutables por "authenticated" (complete_finished_
-- academia_appointments, generate_appointments_for_schedule, generate_
-- invoice_for_package, notify_academia_hour_overages) no comprobaban de
-- quién era el horario/bono/empresa que se les pasaba — un cliente
-- cualquiera podía apuntar a datos de otra empresa. Se les añade: si quien
-- llama es un usuario logueado (auth.uid() no es null), el horario/bono/
-- empresa tiene que ser suyo. Cuando llama el cron, auth.uid() es null (no
-- hay sesión) y sigue barriendo todas las empresas como siempre.

create or replace function public.generate_appointments_for_schedule(p_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule class_schedules%rowtype;
  v_date date;
  v_end date;
begin
  select * into v_schedule from class_schedules where id = p_schedule_id and active;
  if not found then
    return;
  end if;

  if auth.uid() is not null and v_schedule.company_id not in (select auth_company_ids()) then
    return;
  end if;

  v_date := current_date;
  v_end := current_date + 56; -- ventana móvil de 8 semanas

  while v_date <= v_end loop
    if extract(isodow from v_date) = v_schedule.weekday then
      insert into appointments (company_id, contact_id, starts_at, ends_at, schedule_id)
      values (
        v_schedule.company_id,
        v_schedule.contact_id,
        (v_date + v_schedule.start_time) at time zone 'Europe/Madrid',
        (v_date + v_schedule.end_time) at time zone 'Europe/Madrid',
        v_schedule.id
      )
      on conflict (schedule_id, starts_at) where schedule_id is not null
      do nothing;
    end if;
    v_date := v_date + 1;
  end loop;
end;
$$;

create or replace function public.generate_invoice_for_package(p_package_id uuid)
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

  if auth.uid() is not null and v_contact.company_id not in (select auth_company_ids()) then
    return;
  end if;

  if v_bono.periodo = 'semanal' then
    v_period_start := date_trunc('week', current_date)::date;
    v_period_key := 'S' || to_char(v_period_start, 'IYYY-IW');
  else
    v_period_start := date_trunc('month', current_date)::date;
    v_period_key := 'M' || to_char(v_period_start, 'YYYY-MM');
  end if;
  v_due_date := v_period_start + 4;

  insert into invoices (contact_id, concept, amount, status, package_id, billing_period, due_date)
  values (v_contact.id, v_bono.name, v_bono.price_eur, 'pendiente', v_package.id, v_period_key, v_due_date)
  on conflict (package_id, billing_period) where package_id is not null and billing_period is not null
  do nothing;
end;
$$;

create or replace function public.complete_finished_academia_appointments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  v_hours numeric;
  v_package_id uuid;
begin
  for a in
    select ap.id, ap.contact_id, ap.starts_at, ap.ends_at
    from appointments ap
    join contacts c on c.id = ap.contact_id
    join companies co on co.id = c.company_id
    where ap.status = 'scheduled'
      and ap.ends_at < now()
      and co.vertical = 'academia'
      and (auth.uid() is null or co.id in (select auth_company_ids()))
  loop
    update appointments set status = 'completed' where id = a.id;

    v_hours := extract(epoch from (a.ends_at - a.starts_at)) / 3600.0;

    select id into v_package_id
    from packages
    where contact_id = a.contact_id and active and bono_type_id is not null
    order by created_at desc
    limit 1;

    if v_package_id is not null then
      update packages set used_sessions = used_sessions + v_hours where id = v_package_id;
    end if;
  end loop;
end;
$$;

create or replace function public.notify_academia_hour_overages()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_month_start timestamptz;
  v_hours_used numeric;
begin
  v_month_start := date_trunc('month', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid';

  for r in
    select
      c.id as contact_id,
      c.full_name,
      c.email,
      c.phone,
      c.company_id,
      p.id as package_id,
      p.total_sessions
    from packages p
    join contacts c on c.id = p.contact_id
    join companies co on co.id = c.company_id
    join bono_types bt on bt.id = p.bono_type_id
    where p.active
      and co.vertical = 'academia'
      and bt.unit = 'horas'
      and (auth.uid() is null or co.id in (select auth_company_ids()))
      and p.id = (
        select p2.id from packages p2
        where p2.contact_id = c.id and p2.active and p2.bono_type_id is not null
        order by p2.created_at desc
        limit 1
      )
  loop
    select coalesce(sum(extract(epoch from (a.ends_at - a.starts_at)) / 3600.0), 0)
    into v_hours_used
    from appointments a
    where a.contact_id = r.contact_id
      and a.status = 'completed'
      and a.starts_at >= v_month_start;

    if v_hours_used > r.total_sessions
       and not exists (
         select 1 from notifications n
         where n.contact_id = r.contact_id
           and n.kind = 'horas_excedidas'
           and n.created_at >= v_month_start
       )
    then
      insert into notifications (company_id, source, kind, full_name, email, phone, message, status, contact_id)
      values (
        r.company_id,
        'academia',
        'horas_excedidas',
        r.full_name,
        r.email,
        r.phone,
        r.full_name || ' se ha pasado de horas este mes: lleva ' || to_char(v_hours_used, 'FM999990.99') ||
          'h de un bono de ' || to_char(r.total_sessions, 'FM999990.99') || 'h.',
        'nueva',
        r.contact_id
      );
    end if;
  end loop;
end;
$$;

-- Aviso aparte del linter: función con search_path mutable. Trigger
-- interno, sin relación con lo de arriba, se aprovecha para cerrarlo.
create or replace function public.assign_contact_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.contact_number is null then
    select coalesce(max(contact_number), 0) + 1 into new.contact_number
    from contacts
    where company_id = new.company_id;
  end if;
  return new;
end;
$$;
