-- Altas nuevas pendientes de activación manual (mientras no hay cobro con Stripe).
alter table public.companies add column activated boolean not null default true;
alter table public.notifications drop constraint notifications_kind_check,
  add constraint notifications_kind_check check (kind = any (array['lead','cobro_pendiente','horas_excedidas','reserva','alta']));
alter table public.notifications drop constraint notifications_source_check,
  add constraint notifications_source_check check (source = any (array['formulario_web','instagram_dm','tiktok_dm','facturacion','academia','reserva_online','registro']));
create or replace function public.is_zenzia_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from company_users where user_id = auth.uid() and company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24');
$$;
create or replace function public.admin_companies()
returns table (id uuid, name text, vertical text, sector_other text, plan text, activated boolean, created_at timestamptz,
               owner_name text, owner_email text, phone text)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.vertical, c.sector_other, c.plan, c.activated, c.created_at, cu.full_name, u.email::text, c.phone
  from companies c
  left join lateral (select * from company_users x where x.company_id = c.id order by x.created_at limit 1) cu on true
  left join auth.users u on u.id = cu.user_id
  where public.is_zenzia_admin()
  order by c.activated, c.created_at desc;
$$;
create or replace function public.admin_update_company(p_company uuid, p_plan text, p_activated boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_zenzia_admin() then raise exception 'No autorizado'; end if;
  update companies set plan = p_plan, activated = p_activated where id = p_company;
end $$;
grant execute on function public.admin_companies() to authenticated;
grant execute on function public.admin_update_company(uuid, text, boolean) to authenticated;
