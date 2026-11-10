-- Webs de clientes: «Editar y publicar» (aplicado en Supabase el 10/11/2026).
--
-- Antes, la web pública cargaba public/zz/site.js, que leía web_texts y escribía
-- web_events directamente en Supabase desde el navegador de cada visitante y
-- llevaba dentro el editor (?zz_edit=1). Una inspección lo señaló (editor
-- expuesto, base de datos y clave a la vista, rastreo sin consentimiento).
--
-- Ahora:
--   - La plantilla de cada web (HTML, CSS, fuentes...) vive en el repo, en
--     web-sites/<company_id>/ (ver lib/web-publish/source.ts).
--   - «Mi web» edita sobre una vista previa que genera Zenzia (con sesión).
--   - «Publicar» genera el HTML final en el servidor y lo sube a Netlify
--     (companies.netlify_site_id). La web pública no llama a Supabase.
--   - Se dejan de registrar visitas/clics desde el navegador (web_events).

alter table public.companies add column if not exists netlify_site_id text;
alter table public.companies add column if not exists web_published_at timestamptz;

-- Fin del rastreo desde el navegador: nadie anónimo puede insertar eventos.
drop policy if exists "anyone inserts web_events" on public.web_events;
revoke insert on public.web_events from anon;

-- La Placita pasa al sistema nuevo.
update public.companies set netlify_site_id = '3a31e504-dbfc-496e-9eab-6f5a69ebc59b'
  where id = '37bd4804-c198-4f6b-bde6-4411d9872bfa';

-- NOTA: la lectura anónima de web_texts ("public reads web_texts") se mantiene
-- mientras queden webs con el script antiguo (3DLAB). Cuando todas pasen a
-- «Editar y publicar», quitarla:
--   drop policy "public reads web_texts" on public.web_texts;

-- Solo RL Digital Studios puede cambiar a qué sitio de Netlify publica cada
-- empresa (el token de Netlify da acceso a todas nuestras webs). Mismo patrón
-- que guard_company_plan.
create or replace function public.guard_company_netlify_site() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.netlify_site_id is distinct from old.netlify_site_id
     and auth.uid() is not null
     and not exists (
       select 1 from company_users
       where user_id = auth.uid() and company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24'
     ) then
    raise exception 'No autorizado a cambiar el sitio de Netlify';
  end if;
  return new;
end $$;
create trigger guard_company_netlify_site before update on public.companies
  for each row execute function public.guard_company_netlify_site();
