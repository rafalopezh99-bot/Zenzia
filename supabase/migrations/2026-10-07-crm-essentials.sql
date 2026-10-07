-- Básicos de CRM de consulta: catálogo de servicios, cobro/facturación de
-- citas, cancelación por enlace, consentimientos firmados online, registro
-- de accesos y calendario suscribible (ICS).

-- Catálogo de servicios (nombre, duración, precio, IVA).
create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  duration_min int not null default 60,
  price numeric not null default 0,
  vat numeric not null default 21,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
create policy "member full access services" on public.services for all
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));
grant select on public.services to anon;
create policy "public read active services" on public.services for select to anon using (active);

-- Citas: servicio, precio, cobro y enlace de cancelación.
alter table public.appointments
  add column service_id uuid references public.services(id) on delete set null,
  add column price numeric,
  add column invoice_id uuid references public.invoices(id) on delete set null,
  add column package_id uuid references public.packages(id) on delete set null,
  add column paid_method text,
  add column cancel_token uuid not null default gen_random_uuid();
create unique index appointments_cancel_token_idx on public.appointments (cancel_token);

-- Consentimientos: texto, firma (imagen) y enlace público para firmar.
alter table public.consents
  add column body text,
  add column signature text,
  add column signer_name text,
  add column sign_token uuid not null default gen_random_uuid();
create unique index consents_sign_token_idx on public.consents (sign_token);

-- Calendario ICS (suscripción desde Google Calendar / iPhone).
alter table public.companies add column calendar_token uuid not null default gen_random_uuid();

-- Registro de accesos a fichas (datos de salud, RGPD).
create table public.access_log (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  contact_id uuid references public.contacts(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.access_log enable row level security;
create policy "member read access_log" on public.access_log for select using (company_id in (select auth_company_ids()));
create policy "member insert access_log" on public.access_log for insert with check (company_id in (select auth_company_ids()));

-- ---------- Funciones públicas (sin sesión) ----------

-- Página /cita/[token]: ver y cancelar una cita desde el email.
create or replace function public.public_appointment(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('starts_at', a.starts_at, 'status', a.status, 'company', co.name, 'company_id', co.id,
                            'contact', c.full_name, 'service', s.name)
  from appointments a join companies co on co.id = a.company_id join contacts c on c.id = a.contact_id
  left join services s on s.id = a.service_id
  where a.cancel_token = p_token;
$$;

create or replace function public.public_cancel_appointment(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select * into a from appointments where cancel_token = p_token;
  if a is null then raise exception 'Cita no encontrada'; end if;
  if a.status <> 'scheduled' then raise exception 'Esta cita ya no se puede cancelar'; end if;
  if a.starts_at < now() + interval '2 hours' then raise exception 'Solo se puede cancelar con al menos 2 horas de antelación'; end if;
  update appointments set status = 'cancelled' where id = a.id;
  insert into notifications (company_id, source, kind, full_name, message, status, contact_id)
  select a.company_id, 'reserva_online', 'reserva', c.full_name,
         'Cita cancelada por el cliente: ' || to_char(a.starts_at at time zone 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), 'nueva', c.id
  from contacts c where c.id = a.contact_id;
end $$;

-- Página /consentimiento/[token]: firmar online.
create or replace function public.public_consent(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('title', cs.title, 'body', cs.body, 'signed', cs.signed, 'signed_at', cs.signed_at,
                            'contact', c.full_name, 'company', co.name)
  from consents cs join contacts c on c.id = cs.contact_id join companies co on co.id = c.company_id
  where cs.sign_token = p_token;
$$;

create or replace function public.public_sign_consent(p_token uuid, p_name text, p_signature text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_name), '') = '' or coalesce(p_signature, '') not like 'data:image/png;base64,%' then
    raise exception 'Falta el nombre o la firma';
  end if;
  update consents set signed = true, signed_at = now(), signer_name = trim(p_name), signature = p_signature
  where sign_token = p_token and not signed;
  if not found then raise exception 'Consentimiento no encontrado o ya firmado'; end if;
end $$;

-- Calendario ICS: citas próximas y recientes del negocio.
create or replace function public.public_calendar(p_token uuid)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz, status text, contact text, service text, company text)
language sql stable security definer set search_path = public as $$
  select a.id, a.starts_at, a.ends_at, a.status, c.full_name, s.name, co.name
  from companies co join appointments a on a.company_id = co.id join contacts c on c.id = a.contact_id
  left join services s on s.id = a.service_id
  where co.calendar_token = p_token and a.starts_at > now() - interval '30 days' and a.status <> 'cancelled';
$$;

grant execute on function public.public_appointment(uuid) to anon, authenticated;
grant execute on function public.public_cancel_appointment(uuid) to anon, authenticated;
grant execute on function public.public_consent(uuid) to anon, authenticated;
grant execute on function public.public_sign_consent(uuid, text, text) to anon, authenticated;
grant execute on function public.public_calendar(uuid) to anon, authenticated;

-- public_book con servicio opcional (duración del servicio en vez de la general).
create or replace function public.public_book(
  p_company uuid, p_name text, p_phone text, p_email text, p_starts_at timestamptz, p_service uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_booking jsonb; v_end timestamptz; v_contact uuid; v_appt uuid; v_dur int; v_price numeric;
begin
  select booking into v_booking from companies
  where id = p_company and plan in ('smart', 'pro') and (booking->>'enabled')::boolean;
  if v_booking is null then raise exception 'Reservas no disponibles'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if p_starts_at < now() then raise exception 'Esa hora ya ha pasado'; end if;
  v_dur := (v_booking->>'duration')::int;
  if p_service is not null then
    select duration_min, price into v_dur, v_price from services where id = p_service and company_id = p_company and active;
    if v_dur is null then raise exception 'Servicio no válido'; end if;
  end if;
  v_end := p_starts_at + make_interval(mins => v_dur);
  if exists (select 1 from appointments where company_id = p_company and status <> 'cancelled' and starts_at < v_end and ends_at > p_starts_at) then
    raise exception 'Ese hueco ya está ocupado';
  end if;
  select id into v_contact from contacts
  where company_id = p_company and status = 'active'
    and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g') limit 1;
  if v_contact is null then
    insert into contacts (company_id, full_name, phone, email, status)
    values (p_company, trim(p_name), trim(p_phone), nullif(trim(p_email), ''), 'active') returning id into v_contact;
  end if;
  insert into appointments (company_id, contact_id, starts_at, ends_at, status, notes, service_id, price)
  values (p_company, v_contact, p_starts_at, v_end, 'scheduled', 'Reserva online', p_service, v_price) returning id into v_appt;
  insert into notifications (company_id, source, kind, full_name, phone, email, message, status, contact_id)
  values (p_company, 'reserva_online', 'reserva', trim(p_name), trim(p_phone), nullif(trim(p_email), ''),
          'Nueva reserva online para el ' || to_char(p_starts_at at time zone 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), 'nueva', v_contact);
  return v_appt;
end $$;
drop function if exists public.public_book(uuid, text, text, text, timestamptz);
grant execute on function public.public_book(uuid, text, text, text, timestamptz, uuid) to anon, authenticated;

-- Portal: incluir el enlace de cancelación de las próximas citas.
create or replace function public.public_portal(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'contact', jsonb_build_object('name', c.full_name),
    'company', jsonb_build_object('name', co.name, 'logo_path', co.logo_path, 'phone', co.phone, 'id', co.id),
    'appointments', coalesce((select jsonb_agg(jsonb_build_object('starts_at', a.starts_at, 'status', a.status, 'cancel_token', a.cancel_token) order by a.starts_at desc)
      from (select * from appointments where contact_id = c.id order by starts_at desc limit 20) a), '[]'::jsonb),
    'invoices', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'doc_number', i.doc_number, 'issue_date', i.issue_date, 'amount', i.amount, 'status', i.status) order by i.created_at desc)
      from invoices i where i.contact_id = c.id), '[]'::jsonb),
    'progress', coalesce((select jsonb_agg(jsonb_build_object('created_at', ac.created_at, 'data', ac.custom_fields) order by ac.created_at desc)
      from activities ac where ac.contact_id = c.id and ac.type = 'progress'), '[]'::jsonb))
  from contacts c join companies co on co.id = c.company_id
  where c.portal_token = p_token and co.plan = 'pro';
$$;
