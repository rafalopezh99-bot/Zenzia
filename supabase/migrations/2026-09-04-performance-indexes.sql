-- company_users(user_id): auth_company_ids() la consulta en CADA fila
-- protegida por RLS, es decir, en prácticamente todas las consultas de la
-- app. Sin este índice era un escaneo completo de la tabla en cada
-- petición. El índice único existente (company_id, user_id) no sirve para
-- filtrar por user_id solo, porque no es la primera columna.
create index if not exists company_users_user_id_idx on company_users (user_id);

-- packages(contact_id): complete_finished_academia_appointments() la
-- consulta por cada clase de academia recién terminada, y esa función se
-- llama en cada carga de dashboard/citas/seguimiento del vertical academia.
create index if not exists packages_contact_id_idx on packages (contact_id);
