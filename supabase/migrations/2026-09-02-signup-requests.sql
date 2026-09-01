-- Migración: solicitudes de registro (gente que quiere probar/contratar
-- Zenzia). Ejecutar una sola vez en Supabase → SQL Editor.
--
-- Esto NO crea ninguna cuenta ni empresa automáticamente. Es solo un
-- formulario ("/registro" en la app) que cualquiera puede rellenar sin
-- sesión; queda guardado aquí como "pendiente" y tú decides desde
-- /solicitudes (dentro del panel, solo visible para RL Digital Studios)
-- si lo apruebas o lo denegas. Aprobar solo cambia el estado de la
-- solicitud a "aprobada" — la cuenta real (usuario + empresa) la sigues
-- dando de alta tú a mano en Supabase, como haces ahora con cada cliente.

create table if not exists signup_requests (
  id uuid primary key default gen_random_uuid(),
  manager_name text not null,        -- nombre del gestor del negocio
  business_name text not null,       -- nombre del negocio
  service_offered text not null,     -- servicio que ofrece
  vertical text,                     -- sector (mismo catálogo que el onboarding), opcional
  plan text not null check (plan in ('mensual', 'anual')),
  usage_type text not null check (usage_type in ('negocio', 'personal')),
  email text not null,
  phone text not null,
  message text,                      -- comentarios adicionales, opcional
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'denegada')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists signup_requests_created_idx on signup_requests (created_at desc);

alter table signup_requests enable row level security;

-- Solo la empresa de RL Digital Studios (tú, el dueño de Zenzia) puede ver
-- y gestionar las solicitudes — el resto de empresas que usen el CRM ni
-- siquiera saben que esta tabla existe.
create or replace function is_zenzia_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from company_users
    where user_id = auth.uid()
    and company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24'
  )
$$;

create policy "admin sees signup requests" on signup_requests
  for select using (is_zenzia_admin());

create policy "admin updates signup requests" on signup_requests
  for update using (is_zenzia_admin())
  with check (is_zenzia_admin());

-- El formulario público de /registro no tiene sesión, así que inserta
-- como "anon" — igual que el formulario de contacto de la landing.
create policy "public creates signup requests" on signup_requests
  for insert
  to anon
  with check (true);
