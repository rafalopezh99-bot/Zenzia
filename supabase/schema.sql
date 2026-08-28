-- CRM Interno — RL Digital Studios
-- Esquema base multi-tenant con sistema de módulos activables por cliente.
-- Pensado para Supabase (Postgres + Auth + RLS).

create extension if not exists "pgcrypto";

-- ============================================================
-- TENANTS (empresas cliente: la clínica, el taller, etc.)
-- ============================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vertical text not null check (vertical in ('fisio','nutricion','taller','dental','estetica')),
  created_at timestamptz not null default now()
);

-- Usuarios (empleados/profesionales) de cada empresa. auth.users es de Supabase Auth.
create table company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- ============================================================
-- MÓDULOS: catálogo fijo + activación por empresa
-- ============================================================
create table modules (
  key text primary key,
  name text not null,
  description text
);

insert into modules (key, name, description) values
  ('agenda',              'Agenda y recordatorios',        'Citas, calendario y recordatorios automáticos'),
  ('historial_clinico',   'Historial por sesión',          'Ficha clínica / notas de cada sesión'),
  ('seguimiento',         'Seguimiento de progreso',       'Gráficas de evolución (peso, dolor, medidas...)'),
  ('ficha_vehiculo',      'Ficha de vehículo',             'Datos y unidad asociada al contacto (talleres)'),
  ('presupuestos',        'Presupuestos / OT',             'Presupuestos y órdenes de trabajo'),
  ('bonos',               'Bonos / paquetes de sesiones',  'Paquetes de sesiones prepagadas'),
  ('fotos',               'Fotos antes/después',           'Galería asociada al contacto'),
  ('consentimientos',     'Consentimientos',               'Documentos firmados por el paciente'),
  ('facturacion',         'Facturación',                   'Emisión de facturas simples');

create table company_modules (
  company_id uuid not null references companies(id) on delete cascade,
  module_key text not null references modules(key),
  enabled boolean not null default true,
  primary key (company_id, module_key)
);

-- ============================================================
-- CONTACTOS (pacientes / clientes)
-- ============================================================
create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}',   -- campos específicos del módulo/vertical
  status text not null default 'active' check (status in ('lead','active','inactive')),
  created_at timestamptz not null default now()
);
create index on contacts (company_id);

-- Activo opcional colgado del contacto (p. ej. vehículo en talleres)
create table assets (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  type text not null,                          -- 'vehicle', etc.
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- CITAS
-- ============================================================
create table appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  staff_user_id uuid references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  reminder_sent boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index on appointments (company_id, starts_at);

-- ============================================================
-- HISTORIAL / NOTAS / SESIONES
-- ============================================================
create table activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  type text not null check (type in ('note','session','call','progress')),
  content text,
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on activities (contact_id, created_at);

-- ============================================================
-- TAREAS INTERNAS
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BONOS / PAQUETES DE SESIONES
-- ============================================================
create table packages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  name text not null,
  total_sessions int not null,
  used_sessions int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS: aislamiento estricto por empresa
-- ============================================================
alter table companies enable row level security;
alter table company_users enable row level security;
alter table company_modules enable row level security;
alter table contacts enable row level security;
alter table assets enable row level security;
alter table appointments enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table packages enable row level security;

-- helper: empresas a las que pertenece el usuario autenticado
create or replace function auth_company_ids()
returns setof uuid
language sql stable
as $$
  select company_id from company_users where user_id = auth.uid()
$$;

create policy "member sees own company" on companies
  for select using (id in (select auth_company_ids()));

create policy "member sees own company_users" on company_users
  for select using (company_id in (select auth_company_ids()));

create policy "member sees own company_modules" on company_modules
  for select using (company_id in (select auth_company_ids()));

create policy "member full access contacts" on contacts
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access assets" on assets
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

create policy "member full access appointments" on appointments
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access activities" on activities
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access tasks" on tasks
  for all using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access packages" on packages
  for all using (contact_id in (select id from contacts where company_id in (select auth_company_ids())))
  with check (contact_id in (select id from contacts where company_id in (select auth_company_ids())));

-- ============================================================
-- SEED de ejemplo: una empresa de fisioterapia con sus módulos
-- ============================================================
-- insert into companies (name, vertical) values ('Clínica Demo Fisio', 'fisio');
-- (activar módulos correspondientes en company_modules tras crear la empresa y el usuario)
