-- Plan Gratis (clave "start"): sin prueba. Al acabar la prueba de Smart o Pro,
-- la cuenta pasa a Gratis. Aplicada en Supabase como plans_free_trial_downgrade.
alter table appointments add column if not exists paid_at timestamptz;

create or replace function public.create_signup_company(p_user uuid, p_email text, p_full_name text, p_business text, p_vertical text, p_plan text, p_modules text[], p_sector_other text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company uuid;
begin
  if not exists (select 1 from auth.users where id = p_user and lower(email) = lower(p_email) and created_at > now() - interval '30 minutes') then
    raise exception 'Usuario no válido';
  end if;
  if exists (select 1 from company_users where user_id = p_user) then raise exception 'Ya tiene negocio'; end if;
  if p_plan not in ('start', 'smart', 'pro') then raise exception 'Plan no válido'; end if;
  insert into companies (name, vertical, sector_other, business_type, plan, email, onboarded, activated, trial_ends_at)
  values (trim(p_business), p_vertical, nullif(trim(coalesce(p_sector_other, '')), ''), 'autonomo', p_plan, lower(p_email), true, true,
          case when p_plan = 'start' then null else now() + interval '14 days' end)
  returning id into v_company;
  insert into company_users (company_id, user_id, role, full_name) values (v_company, p_user, 'owner', trim(p_full_name));
  insert into company_modules (company_id, module_key, enabled) select v_company, unnest(p_modules), true;
  insert into notifications (company_id, source, kind, full_name, email, message, status)
  values ('5a279e59-d107-4341-80a2-f33bb5f71b24', 'registro', 'alta', trim(p_full_name), lower(p_email),
          case when p_plan = 'start' then 'Nueva cuenta en plan Gratis: ' || trim(p_business) || '. Gestiónala en Cuentas.'
               else 'Nueva cuenta en prueba gratuita (14 días): ' || trim(p_business) || ' · plan ' || initcap(p_plan) || '. Gestiónala en Cuentas.' end, 'nueva');
  return v_company;
end $function$;

create or replace function public.downgrade_expired_trials()
returns void language sql security definer set search_path to 'public' as $function$
  update companies set plan = 'start', trial_ends_at = null
  where plan in ('smart', 'pro') and trial_ends_at is not null and trial_ends_at < now();
$function$;
revoke execute on function public.downgrade_expired_trials() from public, anon, authenticated;

select cron.schedule('zenzia-trial-downgrade', '5 * * * *', 'select public.downgrade_expired_trials()');
