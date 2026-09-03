-- Los bonos pueden venderse por horas o por clases (número fijo de sesiones);
-- antes solo se contemplaban "horas" implícitamente. Se añade la unidad para
-- que la tarifa sea explícita y se pueda elegir al crear cada bono.
alter table bono_types
  add column unit text not null default 'horas' check (unit in ('horas', 'clases'));
