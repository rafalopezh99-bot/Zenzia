-- Plan contratado por empresa (ver lib/plans.ts). Por defecto "start".
alter table public.companies
  add column plan text not null default 'start'
  check (plan in ('start', 'smart', 'pro'));

-- Un cliente no puede subirse de plan él mismo editando su empresa: solo
-- el admin de Zenzia (o service_role / SQL Editor) puede cambiar "plan".
create or replace function public.guard_company_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.plan is distinct from old.plan
     and auth.uid() is not null
     and not exists (
       select 1 from company_users
       where user_id = auth.uid() and company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24'
     ) then
    raise exception 'No autorizado a cambiar el plan';
  end if;
  return new;
end $$;

create trigger guard_company_plan before update on public.companies
  for each row execute function public.guard_company_plan();
