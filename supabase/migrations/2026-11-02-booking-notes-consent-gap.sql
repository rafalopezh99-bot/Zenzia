-- Reservas online: comentario del cliente, consentimiento y descanso entre
-- sesiones. Aplicada en Supabase como migración booking_notes_consent_gap.
alter table appointments add column if not exists booking_consent_at timestamptz;

drop function if exists public.public_book(uuid, text, text, text, timestamptz, uuid);

create function public.public_book(
  p_company uuid, p_name text, p_phone text, p_email text, p_starts_at timestamptz,
  p_service uuid default null, p_notes text default null, p_consent boolean default false
) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_booking jsonb; v_end timestamptz; v_contact uuid; v_appt uuid; v_dur int; v_price numeric; v_gap int; v_note text;
begin
  select booking into v_booking from companies where id = p_company and plan in ('smart', 'pro') and (booking->>'enabled')::boolean;
  if v_booking is null then raise exception 'Reservas no disponibles'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if p_starts_at < now() then raise exception 'Esa hora ya ha pasado'; end if;
  v_dur := (v_booking->>'duration')::int;
  v_gap := greatest(coalesce((v_booking->>'gap')::int, 0), 0);
  if p_service is not null then
    select duration_min, price into v_dur, v_price from services where id = p_service and company_id = p_company and active;
    if v_dur is null then raise exception 'Servicio no válido'; end if;
  end if;
  v_end := p_starts_at + make_interval(mins => v_dur);
  if exists (select 1 from appointments where company_id = p_company and status <> 'cancelled'
             and starts_at < v_end + make_interval(mins => v_gap) and ends_at > p_starts_at - make_interval(mins => v_gap)) then
    raise exception 'Ese hueco ya está ocupado'; end if;
  select id into v_contact from contacts where company_id = p_company and status = 'active'
    and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g') limit 1;
  if v_contact is null then
    insert into contacts (company_id, full_name, phone, email, status)
    values (p_company, trim(p_name), trim(p_phone), nullif(trim(p_email), ''), 'active') returning id into v_contact;
  end if;
  v_note := nullif(trim(left(coalesce(p_notes, ''), 1000)), '');
  insert into appointments (company_id, contact_id, starts_at, ends_at, status, notes, service_id, price, booking_consent_at)
  values (p_company, v_contact, p_starts_at, v_end, 'scheduled',
          case when v_note is null then 'Reserva online' else 'Reserva online. Comentario del cliente: ' || v_note end,
          p_service, v_price, case when p_consent then now() end) returning id into v_appt;
  insert into notifications (company_id, source, kind, full_name, phone, email, message, status, contact_id)
  values (p_company, 'reserva_online', 'reserva', trim(p_name), trim(p_phone), nullif(trim(p_email), ''),
          'Nueva reserva online para el ' || to_char(p_starts_at at time zone 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), 'nueva', v_contact);
  return v_appt;
end $function$;

grant execute on function public.public_book(uuid, text, text, text, timestamptz, uuid, text, boolean) to anon, authenticated;
