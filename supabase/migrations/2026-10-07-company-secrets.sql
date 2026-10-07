-- Claves por empresa (p. ej. la API key de Verifacti de su NIF). Sin
-- políticas RLS: solo accesible con service_role desde el servidor.
create table public.company_secrets (
  company_id uuid primary key references public.companies(id) on delete cascade,
  verifactu_nif text,
  verifactu_env text,
  verifactu_api_key text,
  updated_at timestamptz not null default now()
);
alter table public.company_secrets enable row level security;
-- Estado visible de VeriFactu para el panel (NIF dado de alta, representación...).
alter table public.companies add column verifactu_state jsonb;
