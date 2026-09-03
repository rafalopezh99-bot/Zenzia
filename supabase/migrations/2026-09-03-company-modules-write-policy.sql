-- Faltaba el permiso de escritura en company_modules. Solo existía la
-- política de lectura ("member sees own company_modules"), así que
-- cualquier cliente que pasara por /onboarding (completeOnboarding hace
-- un upsert en company_modules para activar el pack de módulos de su
-- vertical) recibía un 403 al llegar a ese paso — el resto del asistente
-- (companies, company_users) sí se guardaba bien, solo fallaba aquí.
--
-- Nunca se había detectado porque los módulos de RL Digital Studios se
-- configuraron directamente en la base de datos al montar la app, sin
-- pasar por este formulario. Ejecutar una sola vez en Supabase -> SQL
-- Editor.

create policy "member inserts own company_modules" on company_modules
  for insert
  to authenticated
  with check (company_id in (select auth_company_ids()));

create policy "member updates own company_modules" on company_modules
  for update
  to authenticated
  using (company_id in (select auth_company_ids()))
  with check (company_id in (select auth_company_ids()));
