# Zenzia — estado del proyecto (handoff para Claude Code)

Generado el 06/10/2026 al cierre de una sesión de Cowork, para continuar el trabajo desde Claude Code en local.

**Repo local:** `C:\Users\rafal\Claude\Projects\CRM - Zenzia`
**Supabase project id:** `fztomfxebxovgqahkqsy`
**Dominio marketing:** zenzia.es — **Stack:** Next.js 14 (App Router) + Supabase (Postgres + Auth + RLS) + Tailwind

---

## 1. Qué es Zenzia (contexto de producto)

CRM SaaS que RL Digital Studios (la agencia de Rafa) vende como upsell a pymes/autónomos basados en citas (fisios, nutricionistas, talleres, dental, estética...). Mismo motor para todos los verticales; lo que cambia por cliente son los **módulos activados** (`company_modules`) y campos específicos en `custom_fields` (JSONB), no el código. Historial completo de la decisión de producto (nombre, modelo de negocio, matriz de módulos por vertical, precios) está en el documento de proyecto `claude/plan-crm-interno.md` — ese doc está desactualizado desde el 31/08, este archivo lo sustituye en vigencia.

Planes de precio "Zenzia Start / Smart / Pro" para la web: **decidido que se van a crear, pero el contenido de cada plan todavía NO se ha definido.** Rafa lo marcó explícitamente como algo que hay que decidir juntos antes de construir nada — no empezar esa parte sin hablarlo primero.

---

## 2. Web pública (zenzia.es) — estado: terminada y sincronizada

- Paleta: blanco + azul marino (`--mk-accent:#163e6e`) + celeste (`--mk-coral:#2f9ce0`) — tokens en `app/globals.css` bajo la clase `.mk` (identidad de marca fija, no tiene modo oscuro).
- Logo: wordmark "Zenzia" (navy, con el punto de la "i" en celeste) en `public/zenzia-wordmark.png`, protagonista en cabecera (`h-[5.5rem]`) y pie (`h-14 sm:h-16`) — ver `components/marketing-ui.tsx` (`ZenziaWordmark`).
- Email de contacto en todo el sitio: `zenzia.co@gmail.com` (incluye `app/aviso-legal`, `app/privacidad`).
- Pendiente, explícitamente aparcado por Rafa: los 3 planes de precio (Start/Smart/Pro) — falta decidir qué incluye cada uno antes de maquetar nada.

## 3. Dashboard / CRM — estado: recién rediseñado, pendiente de verificar build en local

### 3.1 Identidad visual
- Misma paleta navy/celeste que la web, pero con modo claro/oscuro real: tokens `--color-*` en `app/globals.css`, bajo `:root` (claro) y `[data-theme="dark"]` (oscuro), expuestos como colores Tailwind (`bg-brand`, `text-ink`, etc. — ver `tailwind.config.ts`). `brand` es más claro en oscuro (`#4fa8e8`) para contraste; `mint` es el celeste de acento (ya no verde).
- Logo con variante para fondo oscuro: `components/ZenziaLogo.tsx` pinta dos `<img>` apilados (`dark:hidden` / `dark:block`) usando `public/zenzia-wordmark.png` (navy) y `public/zenzia-wordmark-dark.png` (celeste muy claro, generado invirtiendo los tonos). Se usa en `Sidebar.tsx`, `app/login/page.tsx`, `app/registro/page.tsx`, `app/registro/enviado/page.tsx` — los 4 sitios donde aparece el logo están cubiertos (el dashboard tiene un script de tema global en `app/layout.tsx` que aplica modo oscuro incluso en páginas sin selector visible, por eso hacía falta cubrir login/registro también).
- Favicon e iconos de PWA: regenerados en `app/icon.png`, `app/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-{192,512}.png`, `public/zenzia-icon.png` — "Z" blanca sobre navy con el punto celeste (antes era una Z verde-azulada vieja, ya no pegaba con la marca nueva). `app/manifest.ts` actualizado con los colores nuevos.
- Open Graph / vista previa al compartir: `app/layout.tsx` tiene metadata completa (`openGraph`, `twitter`, `metadataBase: https://zenzia.es`) apuntando a `public/og-image.png` (1200×630, generado a medida con el wordmark).

### 3.2 Sistema de widgets del dashboard
- `lib/widgets.ts`: catálogo de widgets disponibles (`STANDARD_WIDGETS` / `ACADEMIA_WIDGETS` según vertical), guardado en `companies.dashboard_widgets` (jsonb, array de keys; `null` = todos los del catálogo activados por defecto).
- `components/DashboardWidgetsEditor.tsx`: botón "Editar panel" con checklist, guarda vía `lib/actions/dashboardWidgets.ts`.
- Widgets nuevos añadidos esta sesión (antes solo había tarjetas de stats + pipeline + próximas citas):
  - `chart_facturacion_mensual` — barras, cobrado mes a mes del año en curso.
  - `chart_facturacion_anual` — barras, cobrado año a año (últimos 5 años).
  - `top_clientes_potenciales` — top 5 contactos con presupuestos (`quotes`) pendientes, excluyendo los que ya están en pipeline "ganado"/"perdido", ordenados por importe presupuestado.
  - `top_servicios_potenciales` — top 5 **conceptos/títulos** de presupuestos pendientes agrupados y sumados (Zenzia no tiene catálogo de productos — es CRM de servicios — así que "producto potencial" se aproxima agrupando `quotes.title`).
  - Las queries de estas 4 están en `app/(dashboard)/dashboard/page.tsx`, cada una solo se ejecuta si el widget está activado (`show(key)`).

### 3.3 Componentes nuevos
- `components/StatCard.tsx` — tarjeta de estadística con icono en placa de color (navy/celeste/verde para dinero/ámbar para avisos/gris para proveedores).
- `components/icons.tsx` — **iconos propios dibujados a mano** (Users/CalendarClock/Bell/Wallet/Truck), NO una librería externa. Importante: se probó `lucide-react` primero y falló al instalarse en el equipo de Rafa (ver sección 5), así que se sustituyó por estos 5 SVG inline (mismo trazo visual, copiado del propio lucide-react que es ISC/libre, cero dependencia de npm).
- `components/charts/BillingBarChart.tsx` — gráfica de barras (recharts) para facturación mensual/anual. Los colores se pasan como `fill="var(--color-brand)"` directamente (los navegadores modernos resuelven `var()` en atributos SVG), así cambia solo de claro a oscuro sin JS. Animación desactivada (`isAnimationActive={false}`) a propósito — con animación activa un screenshot/carga rápida puede pillar las barras a medio crecer.
- `components/TopRankingCard.tsx` — lista "Top 5" con barra de progreso por fila (mismo patrón que la plantilla de referencia que pasó Rafa, "Top Products"), en navy→celeste según posición.

### 3.4 Dependencia nueva
- Se añadió **`recharts`** (`^3.10.1`) a `package.json` — sí hace falta `npm install` después de este pull si no se ha hecho ya. `lucide-react` se instaló y se volvió a quitar en la misma sesión (ver sección 5), no debería quedar en `package.json`.

---

## 4. Supabase — cambios de esta sesión

- Migración `add_dashboard_widgets_and_suppliers`: añade `companies.dashboard_widgets jsonb`, crea tabla `public.suppliers` (módulo Proveedores, con su RLS).
- Nuevo módulo **Proveedores** completo: `lib/actions/suppliers.ts`, `app/(dashboard)/proveedores/page.tsx` (listado + alta), `app/(dashboard)/proveedores/[id]/page.tsx` (edición + borrado), enlace en `Sidebar.tsx`.
- **Se borraron todos los usuarios/empresas de producción** (a petición expresa de Rafa): las 2 empresas (Zenzia/agencia y Academia Mariló Díaz) y los 2 usuarios (`rafalopezh99@gmail.com`, `marilodiazfyq@gmail.com`) ya no existen. Rafa ejecutó el DELETE él mismo en el SQL Editor de Supabase porque las sentencias DELETE vía MCP (tanto `execute_sql` como `apply_migration`) se quedan colgadas/timeout de forma sistemática (confirmado con pruebas aisladas: SELECT/UPDATE/INSERT funcionan al instante, DELETE cuelga siempre, incluso en tablas vacías) — **para cualquier borrado futuro en Supabase, pedirle a Rafa que lo ejecute él mismo en el SQL Editor, no reintentar por MCP.**
- Se creó una **cuenta de prueba** reutilizando el mismo `company_id` que tenía la empresa "Zenzia" original (`5a279e59-d107-4341-80a2-f33bb5f71b24`) para no tener que tocar `lib/company.ts` (que tiene ese id hardcodeado como admin):
  - Empresa: "Zenzia (prueba)", vertical `asesoria`, módulos agenda/presupuestos/facturación activos.
  - Usuario: **`demo@zenzia.es` / `ZenziaDemo2026!`** (rol owner, admin). Creado por SQL directo contra `auth.users`/`auth.identities` — al principio fallaba el login con "Database error querying schema" porque `confirmation_token`/`recovery_token`/`email_change_token_new`/`email_change` quedaron en `NULL` en vez de `''` (GoTrue de Supabase no soporta NULL ahí, falla el *scan* a string en Go). Ya corregido con un UPDATE. **Si se crea cualquier otro usuario a mano por SQL en Supabase Auth, poner esos 4 campos en `''`, no dejarlos NULL.**
  - Se sembraron datos de ejemplo para poder ver las gráficas nuevas con contenido: 4 contactos (`Laura Jiménez`, `Carlos Ortega`, `Marta Ruiz`, `Sergio Molina`) en distintas fases de pipeline, varios `quotes` pendientes, y facturas (`invoices`) pagadas repartidas por meses de 2026 y por años 2023-2026. Es evidente que son datos de prueba (nombres genéricos) — Rafa puede borrarlos desde la propia app o dejarlos para seguir viendo las gráficas rellenas.

---

## 5. Incidencias de esta sesión (para tener en cuenta)

1. **`lucide-react` no se puede instalar de fiar en el equipo de Rafa**: `npm install` terminaba "bien" (exit code 0, `package.json` presente) pero los `.d.ts` del paquete (`dist/lucide-react.d.ts`, etc.) no llegaban a escribirse — probablemente un corte a mitad de descarga/extracción. Rompía `tsc`/`next build` con `TS7016`. **Decisión: no usar esa librería.** Se sustituyó por SVGs propios en `components/icons.tsx`. Si en el futuro hace falta otra librería de iconos o cualquier paquete nuevo, instalar con tiempo de sobra y verificar con `ls node_modules/<paquete>/dist` que los archivos están completos antes de dar por bueno el install.

2. **`npm run build` termina en `SIGBUS` cuando se ejecuta desde el puente remoto (Cowork) sobre la carpeta sincronizada**, de forma repetible. Diagnóstico de esta sesión: `tsc --noEmit` pasa limpio en el mismo equipo, y el `npm run build` completo pasó limpio **3 veces seguidas** en el sandbox cloud de Cowork con exactamente los mismos archivos — apunta a un problema del montaje de archivos remoto (mmap sobre un filesystem puente/FUSE), no del código. **Esto quedó sin confirmar porque Rafa va a probarlo desde su propia terminal** (fuera del puente de Cowork). Si sigue fallando ahí también, es un bug real a investigar (probablemente memoria: la VM de Cowork tiene 3.8GB RAM / 2 CPU, podría no ser suficiente para `next build` con `recharts` añadido — si hiciera falta, probar `NODE_OPTIONS=--max-old-space-size=4096 npm run build` o cerrar otras apps antes de compilar).

3. **`npm audit`: 10 vulnerabilidades (2 moderate, 7 high, 1 critical)** — no investigadas todavía, arrastran de antes de esta sesión. `npm audit` para ver detalle.

4. Error de TypeScript pre-existente, no relacionado con este trabajo: `pdf-lib` da "module not found" al correr `tsc --noEmit` en el equipo de Rafa en algún contexto puntual — visto en sesiones anteriores, no bloquea el build normal, no se ha investigado a fondo.

---

## 6. Qué falta / próximos pasos sugeridos

1. **Confirmar en terminal propia (no vía Cowork)** que `npm install && npm run build` compila limpio — es el primer paso para Claude Code.
2. Decidir y construir los 3 planes de precio (Zenzia Start/Smart/Pro) para la web — Rafa quiere definir el contenido de cada plan antes de tocar código.
3. Revisar `npm audit` y decidir si merece la pena el salto de versión que piden los 2 avisos "high" de Next.js (ver nota en `claude/plan-crm-interno.md`, sección "Estado del build").
4. Recordatorios automáticos de citas (WhatsApp/email) — el campo `reminder_sent` existe en `appointments` pero no hay integración real todavía (pendiente desde antes de esta sesión).
5. Si Rafa quiere limpiar la cuenta de prueba (`demo@zenzia.es`) de los datos de ejemplo sembrados, puede hacerlo desde la propia app (Contactos/Presupuestos/Facturación) sin tocar Supabase a mano.
6. Rafa pidió explícitamente, como siguiente bloque de trabajo tras el dashboard: **repasar el resto de la app "pestaña por pestaña"** (contactos, agenda, presupuestos, facturación, perfil...) aplicando el mismo nivel de cuidado visual que se le dio al dashboard esta sesión. Todavía no se ha empezado.

---

## 7. Dónde está cada cosa (mapa rápido de archivos tocados esta sesión)

```
app/layout.tsx                          → metadata OG/Twitter, theme-color, favicon
app/manifest.ts                         → colores PWA actualizados
app/icon.png, app/apple-icon.png        → favicon nuevo
public/icon-*.png, zenzia-icon.png      → iconos PWA nuevos
public/og-image.png                     → imagen de vista previa al compartir
public/zenzia-wordmark-dark.png         → logo para fondo oscuro
components/ZenziaLogo.tsx               → logo que cambia solo con el tema
app/login/page.tsx                      → usa ZenziaLogo
app/registro/page.tsx                   → usa ZenziaLogo
app/registro/enviado/page.tsx           → usa ZenziaLogo
components/Sidebar.tsx                  → usa ZenziaLogo, enlace a Proveedores
components/StatCard.tsx                 → NUEVO — tarjeta de stat con icono
components/icons.tsx                    → NUEVO — iconos propios (sin librería)
components/TopRankingCard.tsx           → NUEVO — ranking top 5 con barras
components/charts/BillingBarChart.tsx   → NUEVO — gráfica de barras (recharts)
lib/widgets.ts                          → 4 widgets nuevos en el catálogo
app/(dashboard)/dashboard/page.tsx      → queries + render de los widgets nuevos
lib/actions/suppliers.ts                → NUEVO — CRUD proveedores
app/(dashboard)/proveedores/            → NUEVO — módulo Proveedores completo
package.json / package-lock.json        → +recharts, sin lucide-react
```

---

## 8. Credenciales de prueba

- **App (demo):** `demo@zenzia.es` / `ZenziaDemo2026!` — cuenta admin, empresa "Zenzia (prueba)", con datos de ejemplo.
- **Supabase project id:** `fztomfxebxovgqahkqsy` (acceso vía MCP de Supabase o supabase.com/dashboard).
