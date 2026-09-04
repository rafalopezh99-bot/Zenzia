-- Método de pago y fecha de cobro de las facturas, para poder marcar
-- "pagada en efectivo/bizum" y alimentar el Historial de pagos.
alter table invoices add column payment_method text;
alter table invoices add column paid_at timestamptz;
