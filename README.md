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

## Webs de clientes con el script de Zenzia (`public/zz/site.js`)

Las webs que hacemos a clientes del plan Web cargan:

```html
<script src="https://app.zenzia.es/zz/site.js" data-company="<company_id>" defer></script>
```

y la empresa tiene que tener `companies.site_url` con la dirección de esa web.

Qué hace el script:

- **Textos e imágenes editados en "Mi web"**: los lee de `GET /api/site/<company_id>/texts`
  (solo lectura, con caché). El navegador del visitante **no** habla con Supabase ni lleva
  claves: `web_texts` y `web_events` ya no son accesibles para el rol `anon`
  (migración `2026-11-10-web-site-script-hardening.sql`).
- **Editor**: no está en `site.js`. Solo se carga dentro del iframe de "Mi web" en Zenzia:
  el panel pide con la sesión del usuario un token firmado de 5 minutos
  (`POST /api/site/edit-token`), se lo pasa al iframe por `postMessage` y la web carga el
  editor de `GET /api/site/editor`, que solo responde con un token válido. Abrir la web con
  `?zz_edit=1` fuera de Zenzia no hace nada. Variable de entorno: `SITE_EDITOR_SECRET`
  (si falta se usa `SUPABASE_SERVICE_ROLE_KEY`).
- **Métricas (visitas y clics)**: **apagadas por defecto**. No se manda nada ni se guarda nada
  en el navegador hasta que la web llama a `window.zzConsent(true)`. Con consentimiento se
  guarda `zz_vid` en `localStorage` (para contar visitantes distintos) y se envían los eventos
  a `POST /api/site/<company_id>/events` (con límite de peticiones por IP y por empresa).
  `window.zzConsent(false)` para la medición y borra `zz_vid`.

### Qué tiene que incluir cada web de cliente

1. **Textos legales propios del cliente** (el responsable es el cliente, no Zenzia):
   aviso legal (datos del titular: nombre o razón social, NIF, domicilio, email),
   política de privacidad (formularios, WhatsApp, email…) y política de cookies.
   En la política de privacidad, indicar a RL Digital Studios / Zenzia como encargado del
   tratamiento si se activa la analítica.
2. **Si se activa la analítica**: un banner de cookies que **no** active nada por defecto, con
   botones de *Aceptar* y *Rechazar* igual de visibles y una forma de cambiar de opinión
   después (enlace "Configurar cookies" en el pie). La política de cookies tiene que
   mencionar `zz_vid` (localStorage, analítica propia, sin caducidad, Zenzia).
   El banner guarda la decisión y, en cada carga de página en la que el visitante tenga
   aceptada la analítica, llama al script:

   ```js
   // Al aceptar (y en cada carga si ya estaba aceptado):
   window.zzConsent ? window.zzConsent(true) : (window.zzConsentPending = true);
   // Al rechazar o retirar el consentimiento:
   window.zzConsent && window.zzConsent(false);
   ```

3. **Si no se activa la analítica**: no hace falta banner por el script de Zenzia (solo carga
   textos, sin cookies ni almacenamiento). El dashboard del plan Web mostrará cero visitas.

Antes de entregar una web, comprobar en las herramientas del navegador: ninguna petición a
`*.supabase.co`, nada en `localStorage` antes de aceptar, y que `?zz_edit=1` no muestra
ningún control de edición.
