-- Aviso por email a RL Digital Studios cada vez que llega una solicitud
-- nueva por /registro (tabla signup_requests). Ejecutar una sola vez en
-- Supabase -> SQL Editor.
--
-- Requiere que la función Edge "notify-signup-request" ya esté desplegada
-- (ver supabase/functions/notify-signup-request/index.ts) y que tenga
-- configurados sus dos secretos en el Dashboard:
--   Supabase Dashboard -> Edge Functions -> notify-signup-request -> Secrets
--   - RESEND_API_KEY: tu API key de https://resend.com
--   - WEBHOOK_SECRET: el MISMO valor que pongas abajo en 'x-webhook-secret'
--     (genera uno random, p. ej. con `openssl rand -hex 24`)
--
-- El WEBHOOK_SECRET es necesario porque la función exige un JWT válido
-- (verify_jwt=true) pero la anon key es pública — sin este segundo
-- candado, cualquiera que la conozca podría invocar la función y hacer
-- que se mande spam a nuestro correo.

create extension if not exists pg_net;

create or replace function notify_signup_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://fztomfxebxovgqahkqsy.supabase.co/functions/v1/notify-signup-request',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY_AQUI>',
      'x-webhook-secret', '<WEBHOOK_SECRET_AQUI>'
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists on_signup_request_created on signup_requests;
create trigger on_signup_request_created
  after insert on signup_requests
  for each row execute function notify_signup_request();
