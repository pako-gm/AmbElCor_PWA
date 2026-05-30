# AmbElCor CRM — Guía del proyecto para Claude

## Descripción del proyecto

CRM web para el taller de indumentaria fallera **Amb el Cor** (Carmen Moya, Catarroja).
Gestión de clientas, encargos, presupuestos y seguimiento de pedidos.
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
| Deployment | Vercel |

## Arquitectura clave

- Modelo de encargo multi-línea: un encargo tiene varias líneas de trabajo
- Seguimiento público de pedidos vía token + código corto (sin login)
- Lógica de negocio principalmente en el navegador; Edge Function `notify-whatsapp` para notificaciones
- Un solo usuario autenticado (Carmen); no hay sistema de roles

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
- Consultar `.claude/paleta.md` para colores detallados si existe

## Convenciones de código

- UI siempre en español
- Tablas y columnas Supabase en snake_case
- Componentes React en PascalCase, hooks con prefijo `use`
- No añadir dependencias nuevas sin evaluar si ya existe algo en el stack
- Hooks Supabase en `src/hooks/` (useEncargos.js, useAuth.jsx, useClientes.js, useProveedores.js, useInventario.js, useContabilidad.js)
- Formateo de fechas, importes y números de encargo en `src/utils/formatters.js`
- Exportación Excel en `src/utils/exportExcel.js`
- PDFs en `src/utils/pdfGenerator.js`
- Componentes shadcn/ui en `src/components/ui/` — instalar con `npx shadcn@latest add <component>`

## Estructura de carpetas relevante

```
src/
  components/ui/        ← shadcn/ui (no modificar manualmente)
  components/layout/    ← PageWrapper, BottomNav, ProtectedRoute
  pages/                ← una carpeta por módulo (Encargos/, Clientes/, etc.)
  hooks/                ← useAuth.jsx, useEncargos.js, useClientes.js…
  utils/                ← formatters.js, exportExcel.js, pdfGenerator.js
  lib/                  ← supabase.js, stripe.js
supabase/
  functions/
    notify-whatsapp/    ← Edge Function para notificaciones WhatsApp
```

## Estado de desarrollo (abril 2026)

### Completado
- SQL schema: 10 tablas + trigger `codigo_corto` (AMB-XXXX) + autonumeración YY/NNN + RLS
- Auth completo: Google OAuth → 2FA TOTP → ProtectedRoute
- Layout: PageWrapper + sidebar desktop + BottomNav móvil
- **Módulo Encargos:**
  - `EncargosLista`: filtros por estado, búsqueda, tarjetas clickables
  - `NuevoEncargo`: selector cliente, líneas dinámicas, catálogo, total auto
  - `EncargoDetalle`: timeline estados, avanzar estado, PDFs, pagos inline, compartir
- PDF: presupuesto (al confirmar) + factura (al entregar)
- Seguimiento público: `/seguimiento` (código corto) + `/seguimiento/:token`
- Dashboard con métricas
- Exportación Excel (`exportExcel.js`) con filtro trimestral
- **Módulo Clientes:** lista, nuevo, detalle (`/clientes`, `/clientes/:id`)
- **Módulo Proveedores:** lista, nuevo, detalle (`/proveedores`, `/proveedores/:id`)
- **Módulo Inventario:** lista de materiales, nuevo, detalle
- **Módulo Contabilidad:** dashboard, cobros, pagos, reportes
- Edge Function `notify-whatsapp` para notificaciones al cliente

### Pendiente
- Configurar Google OAuth en Google Cloud Console + Supabase Dashboard (producción)
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
```

## Comandos útiles

```bash
npm run dev       # desarrollo local
npm run build     # build producción
npm run preview   # preview del build
```

## Lecciones aprendidas

Los errores de programación corregidos durante el desarrollo se registran en `.claude/LECCIONES.md`.
**Claude Code debe consultar ese archivo al inicio de cada tarea nueva y actualizarlo antes de continuar tras cometer un error.**
