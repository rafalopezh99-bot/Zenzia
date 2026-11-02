-- Sustituye al paso a Gratis: la prueba acaba en bloqueo y los planes de pago
-- los activa Zenzia. Aplicada en Supabase como plans_trial_blocks_signup_trial_only.
select cron.unschedule('zenzia-trial-downgrade');
drop function if exists public.downgrade_expired_trials();
alter table appointments drop column if exists paid_at;

create or replace function public.create_signup_company(p_user uuid, p_email text, p_full_name text, p_business text, p_vertical text, p_plan text, p_modules text[], p_sector_other text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company uuid;
begin
  if not exists (select 1 from auth.users where id = p_user and lower(email) = lower(p_email) and created_at > now() - interval '30 minutes') then
    raise exception 'Usuario no válido';
  end if;
  if exists (select 1 from company_users where user_id = p_user) then raise exception 'Ya tiene negocio'; end if;
  insert into companies (name, vertical, sector_other, business_type, plan, email, onboarded, activated, trial_ends_at)
  values (trim(p_business), p_vertical, nullif(trim(coalesce(p_sector_other, '')), ''), 'autonomo', 'smart', lower(p_email), true, true, now() + interval '14 days')
  returning id into v_company;
  insert into company_users (company_id, user_id, role, full_name) values (v_company, p_user, 'owner', trim(p_full_name));
  insert into company_modules (company_id, module_key, enabled) select v_company, unnest(p_modules), true;
  insert into notifications (company_id, source, kind, full_name, email, message, status)
  values ('5a279e59-d107-4341-80a2-f33bb5f71b24', 'registro', 'alta', trim(p_full_name), lower(p_email),
          'Nueva cuenta en prueba gratuita (14 días): ' || trim(p_business) || '. Gestiónala en Cuentas.', 'nueva');
  return v_company;
end $function$;
