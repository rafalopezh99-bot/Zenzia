-- Migración: bandeja de "Notificaciones" (leads del formulario web, y en el
-- futuro DMs de Instagram/TikTok), separada de Contactos.
-- Ejecutar una sola vez en Supabase → SQL Editor.
--
-- Antes, un lead del formulario se guardaba directo como un contacto
-- (etapa "nuevo_lead"). Ahora entra aquí, en `notifications`, y solo pasa
-- a ser un contacto de verdad cuando le das a "Contactar" desde la
-- pantalla de Notificaciones — así "Contactos" son solo las personas con
-- las que ya has hablado, no cualquiera que rellena un formulario.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  source text not null check (source in ('formulario_web', 'instagram_dm', 'tiktok_dm')),
  full_name text,
  email text,
  phone text,
  handle text,           -- @usuario de Instagram/TikTok, cuando no hay email/teléfono
  message text,
  status text not null default 'nueva' check (status in ('nueva', 'contactada', 'descartada')),
  contact_id uuid references contacts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists notifications_company_created_idx on notifications (company_id, created_at desc);

alter table notifications enable row level security;

create policy "member full access notifications" on notifications
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

-- El formulario de la landing (zenzia.es y rldigitalstudios.com) no tiene
-- sesión, así que inserta como "anon". Reemplaza a la política anterior,
-- que insertaba directo en `contacts` (ver
-- 2026-08-31-landing-contact-form.sql): ya no hace falta, los leads del
-- formulario ahora entran en notifications.
drop policy if exists "public landing contact form" on contacts;

create policy "public landing notification form" on notifications
  for insert
  to anon
  with check (company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24');

-- Opcional: si quieres mover a esta bandeja los leads que ya tenías
-- guardados como contactos en etapa "nuevo_lead" (los que llegaron con el
-- sistema antiguo, antes de este cambio), descomenta y ejecuta esto UNA
-- sola vez:
--
-- insert into notifications (company_id, source, full_name, email, message, status, created_at)
-- select company_id, 'formulario_web', full_name, email, custom_fields->>'mensaje', 'nueva', created_at
-- from contacts
-- where custom_fields->>'pipeline_stage' = 'nuevo_lead';
--
-- delete from contacts where custom_fields->>'pipeline_stage' = 'nuevo_lead';
