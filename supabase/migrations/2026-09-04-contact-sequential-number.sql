-- Añade un ID secuencial por empresa a cada contacto (alumno/cliente), para
-- que se puedan referenciar y buscar registros fácilmente (p. ej. cuánto se
-- ha gastado un alumno en clases particulares).
alter table contacts add column contact_number integer;

create or replace function assign_contact_number()
returns trigger
language plpgsql
as $function$
begin
  if new.contact_number is null then
    select coalesce(max(contact_number), 0) + 1 into new.contact_number
    from contacts
    where company_id = new.company_id;
  end if;
  return new;
end;
$function$;

create trigger contacts_assign_number before insert on contacts
  for each row execute function assign_contact_number();

-- Backfill de los contactos existentes, numerados por orden de alta dentro
-- de cada empresa.
with numbered as (
  select id, row_number() over (partition by company_id order by created_at) as rn
  from contacts
)
update contacts c set contact_number = numbered.rn
from numbered
where numbered.id = c.id;

create unique index contacts_company_number_key on contacts (company_id, contact_number);
