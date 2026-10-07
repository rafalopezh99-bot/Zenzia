-- Facturación completa: facturas, presupuestos y proformas con numeración
-- correlativa por serie y año, líneas con IVA, retención de IRPF y copia
-- de los datos de emisor/cliente en el momento de emitir (para que el
-- documento no cambie si luego se edita la ficha). Preparado para VeriFactu
-- (verifactu_status / verifactu) cuando se conecte un proveedor.

alter table public.invoices
  add column series text,
  add column number int,
  add column doc_number text,
  add column issue_date date not null default current_date,
  add column lines jsonb not null default '[]'::jsonb,
  add column subtotal numeric,
  add column vat_total numeric,
  add column irpf_rate numeric not null default 0,
  add column irpf_amount numeric not null default 0,
  add column notes text,
  add column issuer_snapshot jsonb,
  add column client_snapshot jsonb,
  add column from_quote_id uuid references public.quotes(id) on delete set null,
  add column verifactu_status text not null default 'no_enviada',
  add column verifactu jsonb;

alter table public.quotes
  add column kind text not null default 'presupuesto' check (kind in ('presupuesto', 'proforma')),
  add column series text,
  add column number int,
  add column doc_number text,
  add column issue_date date not null default current_date,
  add column lines jsonb not null default '[]'::jsonb,
  add column subtotal numeric,
  add column vat_total numeric,
  add column irpf_rate numeric not null default 0,
  add column irpf_amount numeric not null default 0,
  add column issuer_snapshot jsonb,
  add column client_snapshot jsonb,
  add column from_quote_id uuid references public.quotes(id) on delete set null;

-- Contador por empresa + serie + año (F = facturas, P = presupuestos,
-- PRO = proformas). Solo lo toca el trigger (security definer).
create table public.doc_counters (
  company_id uuid not null references public.companies(id) on delete cascade,
  series text not null,
  year int not null,
  last int not null default 0,
  primary key (company_id, series, year)
);
alter table public.doc_counters enable row level security;

create or replace function public.assign_doc_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
  v_series text;
  v_year int;
  v_n int;
begin
  if new.doc_number is not null then
    return new;
  end if;
  select company_id into v_company from contacts where id = new.contact_id;
  if tg_table_name = 'invoices' then
    v_series := 'F';
  elsif new.kind = 'proforma' then
    v_series := 'PRO';
  else
    v_series := 'P';
  end if;
  v_year := extract(year from new.issue_date)::int;

  insert into doc_counters (company_id, series, year, last)
  values (v_company, v_series, v_year, 1)
  on conflict (company_id, series, year) do update set last = doc_counters.last + 1
  returning last into v_n;

  new.series := v_series;
  new.number := v_n;
  new.doc_number := v_series || '-' || v_year || '-' || lpad(v_n::text, 3, '0');
  return new;
end $$;

create trigger assign_doc_number before insert on public.invoices
  for each row execute function public.assign_doc_number();
create trigger assign_doc_number before insert on public.quotes
  for each row execute function public.assign_doc_number();
