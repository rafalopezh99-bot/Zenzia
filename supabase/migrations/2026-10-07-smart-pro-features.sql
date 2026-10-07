-- Funciones de Smart y Pro: reservas online, recordatorios, reseñas de
-- Google, aviso a clientes inactivos y portal del cliente.

-- Ajustes de reservas online del negocio:
-- { enabled, duration (min), days [1..7, 1=lunes], start "09:00", end "19:00" }
alter table public.companies
  add column booking jsonb not null default '{"enabled": false, "duration": 60, "days": [1,2,3,4,5], "start": "09:00", "end": "19:00"}'::jsonb,
  add column google_review_url text;

alter table public.appointments add column review_requested boolean not null default false;

alter table public.contacts
  add column portal_token uuid not null default gen_random_uuid(),
  add column last_winback_at timestamptz;
create unique index contacts_portal_token_idx on public.contacts (portal_token);

-- ---------- Reservas online (página pública /reservar/[companyId]) ----------

-- Datos públicos del negocio para la página de reservas (solo Smart/Pro con
-- reservas activadas).
create or replace function public.public_booking_info(p_company uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'logo_path', logo_path, 'booking', booking)
  from companies
  where id = p_company and plan in ('smart', 'pro') and (booking->>'enabled')::boolean;
$$;

-- Huecos ocupados (sin datos de clientes) entre dos fechas.
create or replace function public.public_busy_slots(p_company uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at
  from appointments a
  where a.company_id = p_company
    and a.status <> 'cancelled'
    and a.starts_at < p_to and a.ends_at > p_from;
$$;

-- Reserva: valida que el hueco siga libre, reutiliza el cliente si ya
-- existe con ese teléfono, crea la cita y deja aviso en Notificaciones.
create or replace function public.public_book(
  p_company uuid, p_name text, p_phone text, p_email text, p_starts_at timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_booking jsonb;
  v_end timestamptz;
  v_contact uuid;
  v_appt uuid;
begin
  select booking into v_booking from companies
  where id = p_company and plan in ('smart', 'pro') and (booking->>'enabled')::boolean;
  if v_booking is null then raise exception 'Reservas no disponibles'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'Nombre y teléfono son obligatorios';
  end if;
  if p_starts_at < now() then raise exception 'Esa hora ya ha pasado'; end if;

  v_end := p_starts_at + make_interval(mins => (v_booking->>'duration')::int);
  if exists (
    select 1 from appointments
    where company_id = p_company and status <> 'cancelled'
      and starts_at < v_end and ends_at > p_starts_at
  ) then
    raise exception 'Ese hueco ya está ocupado';
  end if;

  select id into v_contact from contacts
  where company_id = p_company and status = 'active'
    and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;
  if v_contact is null then
    insert into contacts (company_id, full_name, phone, email, status)
    values (p_company, trim(p_name), trim(p_phone), nullif(trim(p_email), ''), 'active')
    returning id into v_contact;
  end if;

  insert into appointments (company_id, contact_id, starts_at, ends_at, status, notes)
  values (p_company, v_contact, p_starts_at, v_end, 'scheduled', 'Reserva online')
  returning id into v_appt;

  insert into notifications (company_id, source, kind, full_name, phone, email, message, status, contact_id)
  values (p_company, 'reserva_online', 'reserva', trim(p_name), trim(p_phone), nullif(trim(p_email), ''),
          'Nueva reserva online para el ' || to_char(p_starts_at at time zone 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'),
          'nueva', v_contact);
  return v_appt;
end $$;

-- ---------- Portal del cliente (Pro, página pública /portal/[token]) ----------

create or replace function public.public_portal(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'contact', jsonb_build_object('name', c.full_name),
    'company', jsonb_build_object('name', co.name, 'logo_path', co.logo_path, 'phone', co.phone, 'id', co.id),
    'appointments', coalesce((
      select jsonb_agg(jsonb_build_object('starts_at', a.starts_at, 'status', a.status) order by a.starts_at desc)
      from (select * from appointments where contact_id = c.id order by starts_at desc limit 20) a
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'doc_number', i.doc_number, 'issue_date', i.issue_date,
                                          'amount', i.amount, 'status', i.status) order by i.created_at desc)
      from invoices i where i.contact_id = c.id
    ), '[]'::jsonb),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object('created_at', ac.created_at, 'data', ac.custom_fields) order by ac.created_at desc)
      from activities ac where ac.contact_id = c.id and ac.type = 'progress'
    ), '[]'::jsonb)
  )
  from contacts c join companies co on co.id = c.company_id
  where c.portal_token = p_token and co.plan = 'pro';
$$;

-- Una factura del portal (para su PDF), solo si pertenece a ese cliente.
create or replace function public.public_portal_invoice(p_token uuid, p_invoice uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(i) || jsonb_build_object('company_logo_path', co.logo_path)
  from invoices i
  join contacts c on c.id = i.contact_id
  join companies co on co.id = c.company_id
  where c.portal_token = p_token and i.id = p_invoice and co.plan = 'pro';
$$;

grant execute on function public.public_booking_info(uuid) to anon, authenticated;
grant execute on function public.public_busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.public_book(uuid, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.public_portal(uuid) to anon, authenticated;
grant execute on function public.public_portal_invoice(uuid, uuid) to anon, authenticated;

-- Clientes de empresas Pro que llevan p_days días sin venir (para el email
-- de "te echamos de menos"). Solo service_role: devuelve datos de todas las empresas.
create or replace function public.winback_candidates(p_days int default 60)
returns table (contact_id uuid, full_name text, email text, phone text, company_id uuid, company_name text, last_visit timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.full_name, c.email, c.phone, co.id, co.name, max(a.starts_at)
  from contacts c
  join companies co on co.id = c.company_id and co.plan = 'pro'
  join appointments a on a.contact_id = c.id and a.status in ('completed', 'scheduled')
  where c.status = 'active'
    and (c.last_winback_at is null or c.last_winback_at < now() - interval '90 days')
  group by c.id, co.id
  having max(a.starts_at) < now() - make_interval(days => p_days);
$$;
revoke execute on function public.winback_candidates(int) from public, anon, authenticated;
grant execute on function public.winback_candidates(int) to service_role;

-- PROGRAMAR LAS AUTOMATIZACIONES (ejecutar a mano tras desplegar, con la URL
-- real y el mismo CRON_SECRET que en las variables de entorno de Netlify):
-- select cron.schedule('zenzia-automations', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://app.zenzia.es/api/cron/automations',
--     headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--   );
-- $$);
