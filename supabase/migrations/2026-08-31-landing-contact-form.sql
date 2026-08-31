-- Migración: formulario de contacto de la landing (zenzia.es)
-- Ejecutar una sola vez en Supabase → SQL Editor.
--
-- Quien rellena el formulario de la landing no tiene sesión (es un
-- visitante cualquiera), así que el insert lo hace con el rol "anon".
-- En vez de montar una tabla nueva solo para leads, el formulario mete
-- directamente un contacto nuevo (etapa "nuevo_lead") en la propia cuenta
-- de RL Digital Studios — así los leads de la web aparecen ya en tu
-- Zenzia, sin pantalla adicional. Esta política es específica de tu
-- company_id (no de un vertical ni de un patrón general), por eso vive
-- solo aquí y no en supabase/schema.sql: solo permite INSERT, nunca
-- lectura, modificación o borrado, y solo en esta empresa.
drop policy if exists "public landing contact form" on contacts;
create policy "public landing contact form" on contacts
  for insert
  to anon
  with check (company_id = '5a279e59-d107-4341-80a2-f33bb5f71b24');
