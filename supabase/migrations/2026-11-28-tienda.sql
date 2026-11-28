-- Módulo "Tienda": catálogo con tallas y stock, pedidos por WhatsApp/Bizum.
--
-- La web pública (estática, en Netlify) NO lleva claves: pide el catálogo y
-- envía los pedidos a dos rutas de Zenzia (app/api/tienda/...), que llaman a
-- las funciones public_shop_* de abajo con la clave anónima. Esas funciones
-- son security definer y solo exponen lo justo: productos activos de una
-- empresa con el módulo "tienda" activado, y crear un pedido "pendiente".
--
-- El stock se descuenta cuando el dueño marca el pedido como "pagado" (al
-- recibir el Bizum), no al crearlo: así un pedido que nunca se paga no
-- bloquea prendas. Al crear el pedido sí se comprueba que haya stock.

insert into modules (key, name, description) values
  ('tienda', 'Tienda', 'Catálogo con tallas y stock, pedidos por WhatsApp y pago por Bizum')
on conflict (key) do nothing;

-- 1) Ajustes de la tienda por empresa
create table public.shop_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  whatsapp text,                 -- número que recibe los pedidos, con prefijo (34600000000)
  bizum_phone text,              -- número al que se hace el Bizum
  pickup_points jsonb not null default '[]'::jsonb, -- ["Almería · C/ Concepción Arenal, 8", ...]
  shipping_note text,            -- ej. "Envíos 24/48 h"
  low_stock_threshold int not null default 1,
  updated_at timestamptz not null default now()
);

-- 2) Productos
create table public.shop_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  photo_path text,               -- ruta en el bucket "shop"
  is_new boolean not null default false,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index shop_products_company_idx on public.shop_products(company_id, active, position);

-- 3) Tallas / variantes con su stock
create table public.shop_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.shop_products(id) on delete cascade,
  size text not null,
  stock int not null default 0 check (stock >= 0),
  position int not null default 0
);
create index shop_variants_product_idx on public.shop_variants(product_id);

-- 4) Pedidos
create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number int not null,
  status text not null default 'pendiente' check (status in ('pendiente','pagado','enviado','cancelado')),
  customer_name text not null,
  customer_phone text not null,
  delivery text not null,        -- "envio" o el texto del punto de recogida
  address text,
  city text,
  postal_code text,
  total numeric(10,2) not null,
  stock_applied boolean not null default false, -- true cuando ya se descontó el stock
  created_at timestamptz not null default now(),
  unique (company_id, number)
);
create index shop_orders_company_idx on public.shop_orders(company_id, created_at desc);

create table public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id uuid references public.shop_products(id) on delete set null,
  variant_id uuid references public.shop_variants(id) on delete set null,
  name text not null,
  size text not null,
  qty int not null check (qty > 0),
  unit_price numeric(10,2) not null
);
create index shop_order_items_order_idx on public.shop_order_items(order_id);

-- 5) RLS: los miembros de la empresa gestionan todo lo suyo
alter table public.shop_settings enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_variants enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;

create policy "member full access shop_settings" on public.shop_settings for all
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));
create policy "member full access shop_products" on public.shop_products for all
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));
create policy "member full access shop_variants" on public.shop_variants for all
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));
create policy "member full access shop_orders" on public.shop_orders for all
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));
create policy "member full access shop_order_items" on public.shop_order_items for all
  using (company_id in (select auth_company_ids())) with check (company_id in (select auth_company_ids()));

-- 6) Stock: se descuenta al pasar a "pagado" y se devuelve si un pedido ya
--    descontado se cancela. Una sola vez por pedido (stock_applied).
create or replace function public.shop_apply_stock(p_order uuid, p_sign int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update shop_variants v
     set stock = greatest(0, v.stock - p_sign * i.qty)
    from shop_order_items i
   where i.order_id = p_order and i.variant_id = v.id;
end $$;
revoke all on function public.shop_apply_stock(uuid, int) from public, anon, authenticated;

create or replace function public.shop_orders_stock_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('pagado','enviado') and not old.stock_applied then
    perform shop_apply_stock(new.id, 1);
    new.stock_applied := true;
  elsif new.status = 'cancelado' and old.stock_applied then
    perform shop_apply_stock(new.id, -1);
    new.stock_applied := false;
  end if;
  return new;
end $$;

create trigger shop_orders_stock
  before update of status on public.shop_orders
  for each row execute function public.shop_orders_stock_trigger();

-- 7) Catálogo público (sin sesión)
create or replace function public.public_shop_catalog(p_company uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not exists (
      select 1 from company_modules m where m.company_id = p_company and m.module_key = 'tienda' and m.enabled
    ) then null else jsonb_build_object(
    'settings', (select jsonb_build_object('whatsapp', s.whatsapp, 'bizum_phone', s.bizum_phone,
                   'pickup_points', s.pickup_points, 'shipping_note', s.shipping_note)
                 from shop_settings s where s.company_id = p_company),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'description', p.description, 'category', p.category,
        'price', p.price, 'sale_price', p.sale_price, 'photo_path', p.photo_path, 'is_new', p.is_new,
        'variants', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'size', v.size, 'available', v.stock > 0)
                                order by v.position, v.size)
                              from shop_variants v where v.product_id = p.id), '[]'::jsonb)
      ) order by p.position, p.created_at desc)
      from shop_products p where p.company_id = p_company and p.active
    ), '[]'::jsonb)
  ) end
$$;
grant execute on function public.public_shop_catalog(uuid) to anon, authenticated;

-- 8) Crear pedido público. p_order:
--    {"name","phone","delivery","address","city","postal_code",
--     "items":[{"variant_id","qty"}]}
--    Los precios se calculan aquí (nunca se fían del navegador).
create or replace function public.public_shop_create_order(p_company uuid, p_order jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order uuid;
  v_number int;
  v_total numeric(10,2) := 0;
  it jsonb;
  r record;
  v_qty int;
begin
  if not exists (select 1 from company_modules m where m.company_id = p_company and m.module_key = 'tienda' and m.enabled) then
    raise exception 'Tienda no disponible';
  end if;
  if coalesce(trim(p_order->>'name'),'') = '' or coalesce(trim(p_order->>'phone'),'') = '' then
    raise exception 'Faltan nombre o teléfono';
  end if;
  if jsonb_typeof(p_order->'items') <> 'array' or jsonb_array_length(p_order->'items') = 0
     or jsonb_array_length(p_order->'items') > 50 then
    raise exception 'El carrito está vacío';
  end if;

  -- Número correlativo por empresa (bloqueo para evitar duplicados)
  perform pg_advisory_xact_lock(hashtext('shop_orders_' || p_company::text));
  select coalesce(max(number), 0) + 1 into v_number from shop_orders where company_id = p_company;

  insert into shop_orders (company_id, number, customer_name, customer_phone, delivery, address, city, postal_code, total)
  values (p_company, v_number, left(trim(p_order->>'name'),120), left(trim(p_order->>'phone'),40),
          left(coalesce(p_order->>'delivery','envio'),160), left(p_order->>'address',200),
          left(p_order->>'city',120), left(p_order->>'postal_code',20), 0)
  returning id into v_order;

  for it in select * from jsonb_array_elements(p_order->'items') loop
    v_qty := greatest(1, least(20, coalesce((it->>'qty')::int, 1)));
    select v.id as variant_id, v.size, v.stock, p.id as product_id, p.name,
           coalesce(p.sale_price, p.price) as unit_price
      into r
      from shop_variants v join shop_products p on p.id = v.product_id
     where v.id = (it->>'variant_id')::uuid and v.company_id = p_company and p.active;
    if not found then raise exception 'Un producto ya no está disponible'; end if;
    if r.stock < v_qty then raise exception 'Sin stock suficiente de % (talla %)', r.name, r.size; end if;
    insert into shop_order_items (company_id, order_id, product_id, variant_id, name, size, qty, unit_price)
    values (p_company, v_order, r.product_id, r.variant_id, r.name, r.size, v_qty, r.unit_price);
    v_total := v_total + r.unit_price * v_qty;
  end loop;

  update shop_orders set total = v_total where id = v_order;
  return jsonb_build_object('number', v_number, 'total', v_total);
end $$;
grant execute on function public.public_shop_create_order(uuid, jsonb) to anon, authenticated;

-- 9) Fotos de producto: bucket público "shop", cada empresa escribe en su carpeta
insert into storage.buckets (id, name, public) values ('shop', 'shop', true)
on conflict (id) do nothing;

create policy "shop photos insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'shop' and (storage.foldername(name))[1] in (select auth_company_ids()::text));
create policy "shop photos update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'shop' and (storage.foldername(name))[1] in (select auth_company_ids()::text));
create policy "shop photos delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'shop' and (storage.foldername(name))[1] in (select auth_company_ids()::text));
