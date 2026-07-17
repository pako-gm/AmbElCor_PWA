# AmbElCor CRM — Guía del proyecto para Claude

## Descripción del proyecto

CRM web para el taller de indumentaria fallera **Amb el Cor** (Carmen Moya, Paiporta).
Gestión de clientas, encargos, presupuestos y seguimiento de pedidos.
Acceso CRM exclusivo de Carmen. Clientes acceden a sus encargos vía token/código corto sin registro.

## Stack

| Capa | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend / BD | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (email + contraseña) + 2FA TOTP (Supabase MFA) + RLS |
| PDFs | jsPDF |
| Excel | SheetJS (xlsx) |
| PWA | vite-plugin-pwa |
| Pagos (futuro) | Stripe (instalado, inactivo — `VITE_STRIPE_ENABLED=false`) |
| Deployment | Vercel |

## Arquitectura clave

- Modelo de encargo multi-línea: un encargo tiene varias líneas de trabajo
- Seguimiento público de pedidos vía token + código corto (sin login)
- Lógica de negocio principalmente en el navegador; Edge Function `notify-whatsapp` para notificaciones
- Varios usuarios autenticados, sistema de roles segun usuario, implementado en Ajustes > Usuarios

## Supabase

- **Project ref:** `mqbaorcowozqfbdxsvbl`
- **URL:** `https://mqbaorcowozqfbdxsvbl.supabase.co`
- **Claves:** en `.env.local` — nunca commitear
- Usar MCP de Supabase para consultas SQL, migraciones y explorar esquema

## Diseño

- **Primary/brand:** `#1fb39a` | **dark:** `#118b78` | **Gold/amber:** `#b07d33`
- Paleta completa definida en `tailwind.config.js` (brand, ink, violet, purple, green, amber, danger, muted, line, surface…) y vars CSS en `apps/crm/index.css`
- **Fuentes:** Lora (titulares, `font-display`) + Figtree (cuerpo, `font-sans`)
- Hover de botón primario estándar: `hover:bg-primary-dark`
- Mobile-first: bottom-tab nav en móvil, drawer lateral en desktop
- CRM funcional y conciso (no tan visual como la landing)
- El módulo Inventario usa un design system CSS propio (`.btn`, `.panel`, `.modal`, `.input`… en `apps/crm/index.css`) con componentes en `apps/crm/components/inventario/InventarioUI.jsx`

## Convenciones de código

- UI siempre en español
- Tablas y columnas Supabase en snake_case
- Componentes React en PascalCase, hooks con prefijo `use`
- No añadir dependencias nuevas sin evaluar si ya existe algo en el stack
- Hooks Supabase en `apps/crm/hooks/` (useEncargos.js, useAuth.jsx, useClientes.js, useProveedores.js, useInventario.js, useContabilidad.js, useCitas.js, useCatalogo.js)
- Formateo de fechas, importes, teléfonos y números de encargo en `apps/crm/utils/formatters.js`
- Validaciones de entrada (teléfono, email, números) en `apps/crm/utils/validators.js`
- Componentes base propios en `apps/crm/components/ui/` (Button, Field, Modal, ConfirmDialog, Toast, LoadingState, EmptyState, Badge, SearchInput, PageHeader)
- Exportación Excel en `apps/crm/utils/exportExcel.js`
- PDFs en `apps/crm/utils/pdfGenerator.js`
- Componentes shadcn/ui en `apps/crm/components/ui/` — instalar con `npx shadcn@latest add <component>`

## Estructura de carpetas relevante

El proyecto separa el código en `apps/` (sin tooling de monorepo — sigue siendo un único `package.json` y build Vite; alias `@` → `apps/crm`, `@landing` → `apps/landing`):

```
apps/
  crm/                   ← CRM (todo lo que antes vivía en src/)
    components/ui/       ← shadcn/ui (no modificar manualmente)
    components/layout/   ← PageWrapper, BottomNav, ProtectedRoute
    pages/                ← una carpeta por módulo (Encargos/, Clientes/, etc.)
    hooks/                ← useAuth.jsx, useEncargos.js, useClientes.js…
    utils/                ← formatters.js, exportExcel.js, pdfGenerator.js
    lib/                  ← supabase.js, stripe.js
  landing/               ← Landing pública ("Web Pública"), sin dependencias del CRM
supabase/
  functions/
    notify-whatsapp/    ← Edge Function para notificaciones WhatsApp
```

`apps/shop/` y `packages/` (para código compartido) no existen todavía — se crearán cuando se aborde la tienda online (Fase 4, Stripe), momento en el que se decidirá si conviene adoptar tooling de monorepo (pnpm workspaces/turborepo) según lo que esa app necesite compartir de verdad con el CRM.

## Estado de desarrollo (abril 2026)

### Completado
- SQL schema: 10 tablas + trigger `codigo_corto` (AMB-XXXX) + autonumeración YY/NNN + RLS
- Auth completo: Supabase Auth (email + contraseña) → 2FA TOTP → ProtectedRoute, con roles reales en tabla `perfiles` y RLS en todas las tablas (rama `feat/auth-supabase-rls`)
- Layout: PageWrapper + sidebar desktop + BottomNav móvil
- **Módulo Encargos:**
  - `EncargosLista`: filtros por estado, búsqueda, tarjetas clickables
  - `NuevoEncargo`: selector cliente, líneas dinámicas, catálogo, total auto
  - `EncargoDetalle`: timeline estados, avanzar estado, PDFs, pagos inline, compartir
- PDF: presupuesto (al confirmar) + factura (al entregar)
- Seguimiento público: `/seguimiento` (código corto) + `/seguimiento/:token`
- Dashboard con métricas
- Exportación Excel (`exportExcel.js`) con filtro trimestral
- **Módulo Clientes:** lista, nuevo, detalle, medidas (`/clientes`, `/clientes/:id`, `/clientes/:id/medidas`)
- **Módulo Proveedores:** panel integrado en Inventario (`/inventario/proveedores`)
- **Módulo Inventario:** lista de materiales, nuevo, detalle, ajustes (`/inventario`, `/inventario/ajustes`)
- **Módulo Contabilidad:** página única con tabs dashboard/cobros/pagos/libro (`/contabilidad`, `ContabilidadDashboard.jsx`)
- **Módulo Citas:** agenda de día con timeline propio y drag&drop táctil (`/citas`, componentes en `apps/crm/components/citas/`)
- **Módulo Catálogo:** lista y formulario de prendas (`/catalogo`)
- Edge Function `notify-whatsapp` para notificaciones al cliente

### Pendiente
- Alta manual de los 3 usuarios reales en Supabase Dashboard (ver `docs/setup-usuarios.md`)
- Desplegar Edge Functions `admin-usuarios` y `notificar-reset`
- Fase 4: Stripe (pagos en línea)

## Flujo de estados de un encargo

```
presupuestado → confirmado → en_confeccion → listo → entregado
```

- `confirmado` → genera PDF Presupuesto
- `entregado` → genera PDF Factura

## Tablas principales de Supabase

`encargos`, `encargo_lineas`, `clientes`, `proveedores`, `prendas_catalogo`,
`inventario`, `pagos`, `pagos_proveedor`, `historial_estados`, `datos_fiscales`

Campos clave en `encargos`:
- `numero` — formato `YY/NNN` (autonumerado por trigger)
- `token_publico` — UUID para enlace cliente
- `codigo_corto` — `AMB-XXXX` para comunicar por teléfono

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_ENABLED=false
VITE_STRIPE_PUBLIC_KEY=
VITE_TURNSTILE_SITE_KEY=
```

## Comandos útiles

```bash
npm run dev       # desarrollo local
npm run build     # build producción
npm run preview   # preview del build
```

## Lecciones aprendidas
Se ha eliminado estas referencia a claude/LECCIONES.md
**Claude code no consultará ese archivo al inicio de cada tarea.**

# Cost Optimisation

- Default model should be Sonnet.
- Use Opus only for architecture decisions, large refactors and complex debugging.
- Never spawn subagents for simple file searches.
- Prefer Read, Grep and Glob before creating agents.
- Use at most one subagent unless explicitly requested.
- Prefer sequential investigation over parallel exploration.
- Run /compact after finishing a feature.
- Avoid loading MCP results unless required.
