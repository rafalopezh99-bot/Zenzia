-- Facturas rectificativas (serie R): anular una factura ya enviada a
-- VeriFactu no la borra, emite una rectificativa que la compensa.
alter table public.invoices add column rectifies_id uuid references public.invoices(id) on delete set null;

-- assign_doc_number(): misma función que en 2026-10-07-billing-documents.sql,
-- con la serie R para las rectificativas.
create or replace function public.assign_doc_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_series text; v_year int; v_n int;
begin
  if new.doc_number is not null then return new; end if;
  select company_id into v_company from contacts where id = new.contact_id;
  if tg_table_name = 'invoices' then
    v_series := case when new.rectifies_id is not null then 'R' else 'F' end;
  elsif new.kind = 'proforma' then v_series := 'PRO';
  else v_series := 'P'; end if;
  v_year := extract(year from new.issue_date)::int;
  insert into doc_counters (company_id, series, year, last) values (v_company, v_series, v_year, 1)
  on conflict (company_id, series, year) do update set last = doc_counters.last + 1
  returning last into v_n;
  new.series := v_series; new.number := v_n;
  new.doc_number := v_series || '-' || v_year || '-' || lpad(v_n::text, 3, '0');
  return new;
end $$;
