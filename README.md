# Zenzia — RL Digital Studios

CRM para profesionales que trabajan con citas (fisio, nutrición, taller,
dental, estética). Mismo motor para todos los verticales; lo que cambia
por cliente son los módulos activados (tabla `company_modules`).

## Poner en marcha

1. Crear proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL editor del proyecto.
3. Copiar `.env.example` a `.env.local` y rellenar con la URL y anon key del proyecto.
4. `npm install`
5. `npm run dev`

## Dar de alta un cliente nuevo

1. Insertar fila en `companies` (name, vertical).
2. Insertar filas en `company_modules` según el pack del vertical — ver
   `VERTICAL_PACKS` en `lib/modules.ts` para los valores por defecto de
   cada vertical.
3. Crear usuario en Supabase Auth y vincularlo en `company_users`.

## Añadir o quitar un módulo a un cliente ya activo

Activar/desactivar la fila correspondiente en `company_modules`
(`enabled = true/false`). No requiere tocar código ni desplegar de nuevo:
el sidebar y las rutas del panel leen esa tabla en cada carga.

## Pantallas implementadas

- `/dashboard` — contactos activos y próximas citas.
- `/contactos`, `/contactos/nuevo`, `/contactos/[id]` — alta y ficha con historial.
- `/citas`, `/citas/nueva` — agenda y alta de cita.
- `/historial` — vista global de notas/sesiones (módulo `historial_clinico`).
- `/seguimiento` — entradas de progreso genéricas, peso/dolor/medidas según vertical (módulo `seguimiento`).
- `/bonos` — paquetes de sesiones prepagadas, con botón "usar sesión" (módulo `bonos`).
- `/vehiculos` — ficha de vehículo por cliente, para talleres (módulo `ficha_vehiculo`).

Pendiente de construir: `/presupuestos`, `/fotos`, `/consentimientos`, `/facturacion` — mismo patrón que las anteriores (Server Component + Server Action en `lib/actions/`).

## Estructura

- `supabase/schema.sql` — esquema completo con RLS por empresa.
- `lib/modules.ts` — catálogo de módulos y packs por vertical.
- `lib/company.ts` — helper para obtener la empresa (tenant) del usuario logueado.
- `lib/actions/` — Server Actions (altas/updates) por dominio: contactos, citas, bonos, vehículos, seguimiento.
- `components/Sidebar.tsx` — menú que se construye solo con los módulos activos.
- `app/(dashboard)/` — panel protegido (redirige a `/login` si no hay sesión).

## Nota sobre tipos

Las consultas a Supabase usan `any` en las relaciones embebidas
(`contacts(full_name)`) porque no hay tipos generados todavía. En cuanto
el esquema esté estable en un proyecto real, generar tipos con
`npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts`
y tipar el cliente elimina esos `any`.

## Webs de clientes: «Editar y publicar»

Las webs a medida que el cliente edita desde **Mi web** funcionan así (ver `lib/web-publish/`):

- **Plantilla** en `web-sites/<company_id>/`: el HTML que entregamos, sus estilos, fuentes, páginas legales, `cookies.js`… **sin** el `<script>` de `app.zenzia.es/zz/site.js`.
- **Cambios del cliente** en `web_texts` (textos, fotos, listas, secciones ocultas o añadidas).
- **Mi web → Editar**: el iframe carga `/api/mi-web/preview/index.html?edit=1` (solo con sesión). El servidor aplica `web_texts` a la plantilla e inyecta `public/zz/editor.js`. El editor ya no está en la web pública.
- **Mi web → Publicar**: `lib/actions/webPublish.ts` genera el HTML final, copia las fotos de Supabase a `/media/` y lo sube a Netlify (`companies.netlify_site_id`). La web publicada son archivos estáticos: no llama a Supabase, no lleva claves y no registra visitas.

Dar de alta una web nueva:

1. Copiar su carpeta a `web-sites/<company_id>/` (sin `site.js`). Lo que se añada a la plantilla y no deba editarse lleva `data-zz-skip`; los scripts que no deben ejecutarse en el editor (p. ej. el aviso de cookies), `data-zz-noedit`. Ojo: añadir o quitar textos en una sección cambia la numeración de claves de esa sección (`seccion.N`) y descoloca lo ya guardado.
2. `update companies set site_url = '…', netlify_site_id = '<id del sitio en Netlify>' where id = '<company_id>';` (solo la empresa admin puede cambiar `netlify_site_id`).
3. Desplegar Zenzia.

Requisito: variable de entorno `NETLIFY_AUTH_TOKEN` (token personal de Netlify) en el sitio de Zenzia.

`public/zz/site.js` queda solo para las webs que aún lo cargan (3DLAB); ya no registra visitas.
