-- Horarios recurrentes de clase (vertical academia): en vez de crear cada
-- clase a mano, se define el día de la semana + franja horaria una vez y
-- un ciclo diario (mismo patrón que el cobro recurrente de bonos) va
-- materializando las próximas 8 semanas de "appointments" automáticamente.

create table class_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1=lunes … 7=domingo
  start_time time not null,
  end_time time not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on class_schedules (company_id);
create index on class_schedules (contact_id) where active;

alter table class_schedules enable row level security;
create policy "member full access class_schedules" on class_schedules
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

-- Qué horario generó cada cita recurrente, para no duplicarla cuando el
-- ciclo diario vuelve a pasar por la misma semana.
alter table appointments add column schedule_id uuid references class_schedules(id) on delete cascade;
create unique index appointments_schedule_start_key
  on appointments (schedule_id, starts_at)
  where schedule_id is not null;

-- Genera (si no existen ya) las próximas 8 semanas de clases de un horario
-- recurrente concreto. La llama tanto el alta del horario (una vez, para
-- el horario recién creado) como el ciclo diario (para todos los activos).
create or replace function generate_appointments_for_schedule(p_schedule_id uuid)
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

-- Recorre todos los horarios activos y va rellenando su ventana de 8
-- semanas (no hace nada si ya está generada, gracias al índice único).
create or replace function generate_recurring_appointments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in select id from class_schedules where active loop
    perform generate_appointments_for_schedule(r.id);
  end loop;
end;
$$;

-- Envuelve el cobro recurrente de bonos y la generación de clases
-- recurrentes en un único punto de entrada para el cron diario.
create or replace function run_daily_maintenance()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform run_billing_cycle();
  perform generate_recurring_appointments();
end;
$$;

-- Sustituye el cron anterior (llamaba solo a run_billing_cycle) por uno
-- que llama a run_daily_maintenance, que hace ambas cosas.
select cron.unschedule('zenzia-billing-cycle');
select cron.schedule('zenzia-daily-maintenance', '0 5 * * *', $$select run_daily_maintenance();$$);
