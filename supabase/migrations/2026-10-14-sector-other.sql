-- Sector libre cuando se elige «Otros».
alter table public.companies add column sector_other text;

-- Los sectores se validan en la app (lib/verticals.ts), no en la base de datos.
alter table public.companies drop constraint if exists companies_vertical_check;
