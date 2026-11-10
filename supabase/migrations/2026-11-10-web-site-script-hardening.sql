-- Script público de las webs de clientes (public/zz/site.js): el navegador del
-- visitante ya no habla con Supabase. Los textos se leen con
-- GET /api/site/<id>/texts y las métricas (solo con consentimiento) se mandan a
-- POST /api/site/<id>/events; ambos usan service_role en el servidor.
--
-- APLICAR DESPUÉS DE DESPLEGAR el código nuevo: con el site.js antiguo en caché
-- en los navegadores, las webs dejarían de ver sus textos guardados.

-- web_texts: el rol anon ya no puede leer (ni listar) nada. Los miembros de la
-- empresa siguen leyendo y escribiendo con "member writes web_texts" (for all).
drop policy if exists "public reads web_texts" on public.web_texts;
revoke all on public.web_texts from anon;

-- web_events: el rol anon ya no puede insertar. Solo el servidor, con límite.
drop policy if exists "anyone inserts web_events" on public.web_events;
revoke all on public.web_events from anon;
revoke execute on function public.company_has_site(uuid) from public, anon;

-- Inserción de eventos con límite por empresa (600 por minuto) y recorte de
-- campos. La llama app/api/site/[companyId]/events/route.ts con service_role.
create or replace function public.record_web_event(
  p_company uuid, p_type text, p_label text, p_href text, p_path text,
  p_referrer text, p_device text, p_session text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('view', 'click') or not public.company_has_site(p_company) then
    return;
  end if;
  if (select count(*) from web_events
      where company_id = p_company and created_at > now() - interval '1 minute') >= 600 then
    return;
  end if;
  insert into web_events (company_id, type, label, href, path, referrer, device, session_id)
  values (p_company, p_type, left(p_label, 190), left(p_href, 490), left(p_path, 290),
          left(p_referrer, 490), case when p_device = 'movil' then 'movil' else 'ordenador' end, left(p_session, 40));
end;
$$;
revoke execute on function public.record_web_event(uuid, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_web_event(uuid, text, text, text, text, text, text, text) to service_role;
