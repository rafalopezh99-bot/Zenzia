# Oficina RL Digital Studios

Oficina virtual con muñequitos (estilo Los Sims) en la que cada departamento es
un equipo de Claude al que le puedes encargar tareas:

| Departamento | Para qué |
|---|---|
| Desarrollo Web | Webs y apps para clientes (código, estructura, textos, presupuestos) |
| Zenzia | Producto CRM: módulos, planes, soporte, emails a clientes |
| Legal | RGPD, LOPDGDD, LSSI, contratos y textos legales (busca en internet) |
| Ciberseguridad | RLS de Supabase, cabeceras, copias, brechas (busca en internet) |
| Marketing | Redes, SEO, emails, competencia (busca en internet) |

Cuando un departamento trabaja, sus muñecos teclean y el rombo de encima se
pone amarillo; al terminar se pone azul y aparece un aviso en la sala. Pueden
trabajar varios departamentos a la vez. Dentro de cada tarea puedes pedir
cambios y seguir la conversación. El historial se guarda en el navegador del PC.

## Instalarla en Windows (una sola vez)

1. Instala **Node.js LTS** desde https://nodejs.org si no lo tienes.
2. Consigue una **clave de la API de Claude** en
   https://platform.claude.com/settings/keys. Se paga por uso, aparte de la
   suscripción de claude.ai.
3. Trae la rama con `git pull` y haz **doble clic en `oficina/ABRIR-OFICINA.bat`**.
   La primera vez te pide la clave, instala todo y abre
   http://localhost:3333 en el navegador.

A partir de ahí, cada vez que quieras entrar en la oficina, doble clic en
`ABRIR-OFICINA.bat`. Para apagarla, cierra la ventana negra.

### Manualmente (Mac/Linux o sin el .bat)

```bash
cd oficina
cp .env.example .env.local   # y pega tu ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3333
```

## Personalizarla

- **Añadir o cambiar departamentos, empleados, colores o instrucciones:**
  `lib/departamentos.ts`. Cada departamento tiene su `prompt` (cómo trabaja),
  sus `empleados` (nombre, rol y colores del muñeco) y `busquedaWeb`.
- **Modelo:** por defecto `claude-opus-5-5`. Se cambia con `OFICINA_MODELO`
  en `.env.local`.

## Cómo está hecha

- Next.js 15 aparte del CRM: no se despliega con Zenzia y está excluida
  del `tsconfig.json` de la raíz.
- `app/api/tarea/route.ts` llama a Claude con el SDK oficial
  (`@anthropic-ai/sdk`) y va enviando la respuesta en streaming. Lleva activado
  el *fallback* del servidor: si el modelo rechaza una tarea por sus filtros de
  seguridad, la API la reintenta sola con otro modelo.
- La clave solo vive en `.env.local`, en tu PC. Ese archivo no se sube a git.
