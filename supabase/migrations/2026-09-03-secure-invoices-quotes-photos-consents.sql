-- Migración: aislamiento por empresa (RLS) para invoices, quotes, photos y consents.
-- Ejecutar una sola vez en Supabase → SQL Editor.
--
-- POR QUÉ: estas 4 tablas se usan desde el código (lib/actions/invoices.ts,
-- quotes.ts, photos.ts, consents.ts y sus páginas en app/(dashboard)/...)
-- pero no aparecían creadas ni protegidas en schema.sql ni en ninguna otra
-- migración de este repositorio. Si ya existen en la base de datos real
-- pero se crearon a mano desde el panel de Supabase, es muy probable que
-- no tengan Row Level Security activado — lo que significaría que
-- cualquier empresa dada de alta en Zenzia podría leer o modificar las
-- facturas, presupuestos, fotos y consentimientos firmados de TODAS las
-- demás empresas, no solo los suyos.
--
-- Este script es seguro de ejecutar tanto si el problema existe ya como si
-- no: crea las tablas solo si faltan (IF NOT EXISTS, sin tocar datos si ya
-- existen) y, sobre todo, (re)aplica las políticas de aislamiento en
-- cualquier caso.

-- ============================================================
-- 1) Crear las tablas si no existen (mismas columnas que usa el código)
-- ============================================================
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  concept text not null,
  amount numeric not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagada')),
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  amount numeric not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'completado', 'rechazado')),
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  kind text not null check (kind in ('antes', 'despues')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  signed boolean not null default false,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invoices_contact_idx on invoices (contact_id);
create index if not exists quotes_contact_idx on quotes (contact_id);
create index if not exists photos_contact_idx on photos (contact_id);
create index if not exists consents_contact_idx on consents (contact_id);

-- ============================================================
-- 2) Activar RLS (si ya estaba activado, esto no hace nada raro)
-- ============================================================
alter table invoices enable row level security;
alter table quotes enable row level security;
alter table photos enable row level security;
alter table consents enable row level security;

-- ============================================================
-- 3) Políticas de aislamiento por empresa — mismo patrón que ya usan
--    "assets" y "packages" en schema.sql (vía contact_id -> contacts.company_id,
--    porque estas tablas no tienen columna company_id propia).
--    Se borran antes por si ya existían con otro nombre/definición.
-- ============================================================
drop policy if exists "member full access invoices" on invoices;
create policy "member full access invoices" on invoices
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

drop policy if exists "member full access quotes" on quotes;
create policy "member full access quotes" on quotes
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

drop policy if exists "member full access photos" on photos;
create policy "member full access photos" on photos
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

drop policy if exists "member full access consents" on consents;
create policy "member full access consents" on consents
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

-- ============================================================
-- 4) IMPORTANTE — revisar también el bucket de Storage "photos" a mano en
--    Supabase (Storage → photos → Policies): las fotos "antes/después" se
--    sirven con signed URLs desde el código, lo cual ya es una buena
--    práctica, pero conviene confirmar que el bucket NO está marcado como
--    público. Esto no se puede fijar por SQL, hay que revisarlo en el
--    panel.
-- ============================================================
