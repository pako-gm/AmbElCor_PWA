# AmbElCor CRM — Guía del proyecto para Claude

## Contexto

CRM de usuario único (Carmen) para taller de costura artesanal **AmbElCor** en Valencia.
Acceso CRM exclusivo de Carmen. Clientes acceden a sus encargos vía token/código corto sin registro.

## Stack

| Capa | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend / BD | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Google OAuth + 2FA TOTP (Supabase MFA) |
| PDFs | jsPDF |
| Excel | SheetJS (xlsx) |
| PWA | vite-plugin-pwa |
| Pagos (futuro) | Stripe (instalado, inactivo — `VITE_STRIPE_ENABLED=false`) |

## Supabase

- **Project ref:** `mqbaorcowozqfbdxsvbl`
- **URL:** `https://mqbaorcowozqfbdxsvbl.supabase.co`
- **Claves:** en `.env.local` — nunca commitear
- **Redirect URI OAuth:** `https://mqbaorcowozqfbdxsvbl.supabase.co/auth/v1/callback`
- Usar MCP de Supabase para consultas SQL, migraciones y explorar esquema

## Diseño

- **Primary:** `#30BAAA` | **Gold:** `#C8A96E`
- **Fuentes:** Playfair Display (titulares) + Open Sans (cuerpo)
- Mobile-first: bottom-tab nav en móvil, sidebar en desktop
- CRM funcional y conciso (no tan visual como la landing)

## Estructura de carpetas relevante

```
src/
  components/ui/        ← shadcn/ui (no modificar manualmente)
  components/layout/    ← PageWrapper, BottomNav, ProtectedRoute
  pages/                ← una carpeta por módulo (Encargos/, Seguimiento/, etc.)
  hooks/                ← useAuth.jsx, useEncargos.js (lógica Supabase)
  utils/                ← formatters.js, exportExcel.js, pdfGenerator.js
  lib/                  ← supabase.js, stripe.js
```

## Estado de desarrollo (abril 2026)

### Completado
- SQL schema: 10 tablas + trigger `codigo_corto` (AMB-XXXX) + autonumeración YY/NNN + RLS
- Auth completo: Google OAuth → 2FA TOTP → ProtectedRoute
- Layout: PageWrapper + sidebar desktop + BottomNav móvil
- **Módulo Encargos (Fase 2 completa):**
  - `EncargosLista`: filtros por estado, búsqueda, tarjetas clickables
  - `NuevoEncargo`: selector cliente, líneas dinámicas, catálogo, total auto
  - `EncargoDetalle`: timeline estados, avanzar estado, PDFs, pagos inline, compartir
- PDF: presupuesto (al confirmar) + factura (al entregar)
- Seguimiento público: `/seguimiento` (código corto) + `/seguimiento/:token`
- Dashboard con métricas
- Exportación Excel (`exportExcel.js`) con filtro trimestral

### Pendiente
- Configurar Google OAuth en Google Cloud Console + Supabase Dashboard (producción)
- Clientes CRUD (`/clientes`, `/clientes/:id`)
- Proveedores CRUD
- Inventario
- Fase 3: Módulo contable completo (`/contabilidad/cobros`, `/contabilidad/pagos`, `/contabilidad/reportes`)
- Fase 4: Stripe

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

## Convenciones de código

- Hooks Supabase en `src/hooks/` (useEncargos.js, useAuth.jsx)
- Formateo de fechas, importes y números de encargo en `src/utils/formatters.js`
- Exportación Excel en `src/utils/exportExcel.js`
- PDFs en `src/utils/pdfGenerator.js`
- Componentes shadcn/ui en `src/components/ui/` — instalar con `npx shadcn@latest add <component>`

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_ENABLED=false
VITE_STRIPE_PUBLIC_KEY=
```

## Comandos útiles

```bash
npm run dev       # desarrollo local
npm run build     # build producción
npm run preview   # preview del build
```
