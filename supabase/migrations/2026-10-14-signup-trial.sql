-- Alta sin service_role (create_signup_company) y prueba gratuita de 14 días.
-- (Aplicado en Supabase el 14/10/2026: ver funciones create_signup_company,
--  admin_companies y admin_update_company(p_company, p_plan, p_status, p_trial_ends).)
alter table public.companies add column trial_ends_at timestamptz;
