-- Módulo "Mi Web": permite que una empresa autogestione el contenido de su
-- propia web (plantilla ya entregada por RL Digital Studios) sin tocar el
-- CRM. Pensado para venderse suelto, sin el resto de módulos — por eso NO
-- se añade a ningún VERTICAL_PACKS por defecto (ver lib/modules.ts): se
-- activa a mano, empresa por empresa, igual que cualquier otro módulo.

insert into modules (key, name, description) values
  ('sitio_web', 'Mi Web', 'Edición del contenido de la web entregada (textos, fotos, servicios)')
on conflict (key) do nothing;

create table site_content (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  -- Qué plantilla se le entregó a este cliente (mismo criterio de nombres
  -- que las carpetas de demos: 'pizzeria', 'burger', 'estetica'...). Decide
  -- qué campos tienen sentido enseñar en el editor y cómo se renderiza la
  -- vista pública — cada plantilla mantiene su propio diseño.
  template_key text not null default 'generico',
  accent_color text not null default '#2E6D83',
  -- Todo el contenido editable en un único jsonb: título/subtítulo del
  -- hero, lista de servicios, texto de "nosotros", contacto, redes... Se
  -- deja sin columnas fijas a propósito porque cada plantilla trae sus
  -- propios campos y así no hay que migrar el esquema cada vez que se suma
  -- una plantilla nueva.
  data jsonb not null default '{}',
  -- Mientras esté en false, solo lo ve el propio cliente en el editor; la
  -- vista pública (sin sesión) solo lee filas publicadas.
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (company_id)
);
create index on site_content (company_id);

alter table site_content enable row level security;

create policy "member full access site_content" on site_content
  for all
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

-- La web pública de cada cliente no tiene sesión: necesita poder leer el
-- contenido de SU empresa sin estar autenticada, pero solo lo publicado
-- (mismo criterio que "public landing notification form" en el schema
-- base, que también abre una rendija puntual para el rol anon).
create policy "public reads published site_content" on site_content
  for select
  to anon
  using (published = true);

-- Empresa de RL Digital Studios: activa el módulo ya, para poder probarlo
-- con la cuenta propia antes de ofrecerlo a clientes.
insert into company_modules (company_id, module_key, enabled)
values ('5a279e59-d107-4341-80a2-f33bb5f71b24', 'sitio_web', true)
on conflict (company_id, module_key) do update set enabled = true;
