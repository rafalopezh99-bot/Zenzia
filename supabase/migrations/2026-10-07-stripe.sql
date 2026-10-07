-- Suscripciones con Stripe: el webhook (/api/stripe/webhook) actualiza el
-- plan y el estado de la suscripción de cada empresa.
alter table public.companies
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_status text;
