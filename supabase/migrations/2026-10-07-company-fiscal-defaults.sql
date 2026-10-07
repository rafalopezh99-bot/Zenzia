-- Datos fiscales completos del emisor (CP y ciudad para el PDF) y valores
-- por defecto de IVA / IRPF al crear facturas (p. ej. psicólogos: exento = -1).
alter table public.companies
  add column postal_code text,
  add column city text,
  add column default_vat numeric not null default 21,
  add column default_irpf numeric not null default 0;
