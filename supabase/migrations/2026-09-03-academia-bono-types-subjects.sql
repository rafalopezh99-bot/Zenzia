-- Nuevo alumno (vertical academia): además de nombre/teléfono/email, ahora
-- se elige un "Curso" (guardado en contacts.custom_fields, igual que ya se
-- hacía con business_type/demo_url para el vertical agencia — sin tocar el
-- esquema de contacts) y hasta 7 "Asignaturas", más un "Bono" inicial.
--
-- Curso y Asignaturas van en custom_fields; Bono y Asignaturas necesitan
-- catálogos propios porque son listas que cada empresa "da de alta" y
-- reutiliza en varios alumnos (no son texto libre por alumno):
--
--   bono_types: tarifario de la empresa (nivel + nombre + horas + precio).
--   Al dar de alta un alumno con un bono_type elegido, se crea ya el bono
--   activo en `packages` con esas horas listas para consumir (mismo efecto
--   que crearlo a mano desde /bonos).
--
--   subjects: lista de asignaturas que imparte la empresa: controla las
--   casillas del formulario de alta para evitar variaciones del mismo
--   nombre escritas de forma distinta ("Fisica" vs "Física").

create table bono_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  nivel text not null,
  name text not null,
  sessions int not null,
  price_eur numeric(10, 2) not null,
  created_at timestamptz not null default now()
);
create index on bono_types (company_id);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on subjects (company_id);
create unique index subjects_company_name_key on subjects (company_id, name);

alter table bono_types enable row level security;
alter table subjects enable row level security;

create policy "member full access bono_types" on bono_types
  for all
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));

create policy "member full access subjects" on subjects
  for all
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));
