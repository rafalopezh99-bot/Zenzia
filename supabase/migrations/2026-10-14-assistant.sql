-- Uso del asistente virtual (límite mensual y coste).
create table public.assistant_usage (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_at timestamptz not null default now()
);
create index assistant_usage_company_idx on public.assistant_usage (company_id, created_at desc);
alter table public.assistant_usage enable row level security;
create policy "member reads assistant_usage" on public.assistant_usage for select to authenticated using (company_id in (select auth_company_ids()));
create policy "member inserts assistant_usage" on public.assistant_usage for insert to authenticated with check (company_id in (select auth_company_ids()));
