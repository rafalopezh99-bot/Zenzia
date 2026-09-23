-- Aviso cuando un alumno se pasa de las horas de su bono este mes. Antes
-- /seguimiento sumaba las horas completadas del mes sin compararlas con
-- nada; ahora esa misma cuenta (mismo criterio: citas "completed" del mes
-- en curso, hora de Madrid) se compara contra el bono activo del alumno
-- (packages.total_sessions, solo cuando viene del tarifario y ese tarifario
-- es "horas" — un bono de "clases" no se puede comparar contra horas) y, si
-- se pasa, se genera un aviso en notifications. Se dedupe por mes: si ya
-- hay un aviso de este tipo para ese alumno creado este mes, no se repite
-- cada vez que corre el ciclo diario.

alter table notifications drop constraint notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('lead', 'cobro_pendiente', 'horas_excedidas'));

alter table notifications drop constraint notifications_source_check;
alter table notifications add constraint notifications_source_check
  check (source in ('formulario_web', 'instagram_dm', 'tiktok_dm', 'facturacion', 'academia'));

create or replace function notify_academia_hour_overages()
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
      and p.id = (
        -- mismo criterio que complete_finished_academia_appointments: el
        -- bono activo más reciente del alumno, no uno viejo ya sustituido.
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

-- Se cuelga del mismo ciclo diario que ya procesa clases y facturación de
-- academia, para que avise solo aunque nadie abra /seguimiento ese día.
create or replace function run_daily_maintenance()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform run_billing_cycle();
  perform generate_recurring_appointments();
  perform notify_academia_hour_overages();
end;
$$;
