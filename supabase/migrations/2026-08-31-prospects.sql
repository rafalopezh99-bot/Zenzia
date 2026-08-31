-- Migración: pestaña "Clientes" — posibles clientes que TÚ añades a mano
-- (no llegan solos, a diferencia de Notificaciones) para hacer
-- prospección/outreach. Ejecutar una sola vez en Supabase → SQL Editor.
--
-- Al pulsar "Contactar" en la pantalla de Clientes NO se envía ningún
-- email de verdad (no hay integración con ningún proveedor de correo):
-- solo se genera una plantilla de asunto + mensaje con estos datos, para
-- que la copies y la pegues en tu propio cliente de correo. Esa plantilla
-- se genera en el navegador (lib/emailTemplate.ts), no necesita tabla ni
-- llamada a ningún sitio.

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_name text not null,
  email text,
  instagram_handle text,
  business_type text,
  business_name text,
  service_offer text,
  status text not null default 'nuevo' check (status in ('nuevo', 'contactado')),
  created_at timestamptz not null default now()
);
create index if not exists prospects_company_created_idx on prospects (company_id, created_at desc);

alter table prospects enable row level security;

create policy "member full access prospects" on prospects
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));
