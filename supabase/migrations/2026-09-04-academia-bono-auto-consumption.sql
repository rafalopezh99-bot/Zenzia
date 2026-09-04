alter table packages
  alter column total_sessions type numeric(6,2),
  alter column used_sessions type numeric(6,2);

create or replace function complete_finished_academia_appointments()
returns void
language plpgsql
security definer
set search_path = public
as $function$
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
$function$;

create or replace function run_daily_maintenance()
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform run_billing_cycle();
  perform generate_recurring_appointments();
  perform complete_finished_academia_appointments();
end;
$function$;
