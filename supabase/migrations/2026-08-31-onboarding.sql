-- Migración: asistente de configuración inicial (onboarding)
-- Ejecutar una sola vez en Supabase → SQL Editor, sobre el proyecto ya vivo.
-- (El esquema base en supabase/schema.sql ya incluye estos cambios para
-- cualquier instalación nueva desde cero; esto es solo para poner al día
-- la base de datos que ya existe.)

-- 1) Columnas nuevas en companies y company_users
alter table companies add column if not exists business_type text check (business_type in ('autonomo','empresa'));
alter table companies add column if not exists onboarded boolean not null default false;
alter table company_users add column if not exists full_name text;

-- 2) Ampliar el catálogo de verticales admitidos. El nombre del constraint
-- se busca dinámicamente porque Postgres lo autogenera y puede no
-- llamarse igual que en el esquema base.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'companies'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%vertical%';

  if constraint_name is not null then
    execute format('alter table companies drop constraint %I', constraint_name);
  end if;

  alter table companies add constraint companies_vertical_check check (
    vertical in (
      'fisio','osteopatia','nutricion','psicologia','podologia','entrenador_personal','dental','veterinaria',
      'estetica','peluqueria','barberia','manicura','tatuajes','spa',
      'taller',
      'reformas','parquet','pintura','electricista','fontaneria','cerrajeria','jardineria','limpieza',
      'agencia','asesoria','fotografia','academia'
    )
  );
end $$;

-- 3) Permitir que cada empresa edite sus propios datos y cada usuario su
-- propia ficha (lo necesita el formulario de onboarding para guardar).
drop policy if exists "member updates own company" on companies;
create policy "member updates own company" on companies
  for update using (id in (select auth_company_ids()))
  with check (id in (select auth_company_ids()));

drop policy if exists "member updates own profile" on company_users;
create policy "member updates own profile" on company_users
  for update using (user_id = auth.uid() and company_id in (select auth_company_ids()))
  with check (user_id = auth.uid() and company_id in (select auth_company_ids()));

-- 4) Cuenta de RL Digital Studios (Rafa): ya está configurada, así que se
-- marca como "onboarded" para que no le salga el asistente, y se le pone
-- el nombre para el saludo del dashboard.
update companies
  set onboarded = true,
      business_type = coalesce(business_type, 'autonomo')
  where id = '5a279e59-d107-4341-80a2-f33bb5f71b24';

update company_users
  set full_name = coalesce(full_name, 'Rafa')
  where company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24';
