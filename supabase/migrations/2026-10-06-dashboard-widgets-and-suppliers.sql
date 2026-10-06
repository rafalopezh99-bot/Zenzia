-- Preferencia de widgets visibles en el dashboard, por empresa. null = "todavía
-- no ha tocado nada, enséñale el set por defecto" (ver lib/widgets.ts);
-- un array (aunque esté vacío) es la selección explícita del cliente.
alter table public.companies
  add column dashboard_widgets jsonb;

-- Proveedores: mismo patrón que contacts pero mucho más simple (no hay
-- citas/historial/bonos para un proveedor, solo ficha de contacto).
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name text not null,
  contact_person text,
  phone text,
  email text,
  tax_id text,
  category text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create policy "member full access suppliers"
  on public.suppliers
  for all
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));
