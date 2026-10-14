-- Webs de clientes: editor en vivo, plan interno "web" y métricas (aplicado en Supabase el 14/10/2026).
alter table public.companies add column site_url text;
create table public.web_texts (
  company_id uuid not null references public.companies(id) on delete cascade,
  key text not null, value text not null default '', updated_at timestamptz not null default now(),
  primary key (company_id, key)
);
alter table public.web_texts enable row level security;
create policy "public reads web_texts" on public.web_texts for select to anon, authenticated using (true);
create policy "member writes web_texts" on public.web_texts for all to authenticated
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));

alter table public.companies drop constraint if exists companies_plan_check;
alter table public.companies add constraint companies_plan_check check (plan in ('start', 'smart', 'pro', 'web'));

create table public.web_events (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('view', 'click')),
  label text, href text, path text, referrer text, device text, session_id text,
  created_at timestamptz not null default now()
);
create index web_events_company_created_idx on public.web_events (company_id, created_at desc);
alter table public.web_events enable row level security;
create or replace function public.company_has_site(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where id = p_company and site_url is not null);
$$;
grant execute on function public.company_has_site(uuid) to anon, authenticated;
create policy "anyone inserts web_events" on public.web_events for insert to anon, authenticated
  with check (public.company_has_site(company_id)
              and length(coalesce(label,'')) < 200 and length(coalesce(href,'')) < 500 and length(coalesce(path,'')) < 300 and length(coalesce(referrer,'')) < 500);
create policy "member reads web_events" on public.web_events for select to authenticated using (company_id in (select auth_company_ids()));
grant insert on public.web_events to anon;
