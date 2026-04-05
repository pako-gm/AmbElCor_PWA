# CRM Ambelcor — Plan de Desarrollo Completo

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend / BD | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth + 2FA (TOTP) |
| Deploy | Vercel |
| Excel export | SheetJS |
| PWA | vite-plugin-pwa |
| Pagos (futuro) | @stripe/react-stripe-js (instalado, inactivo) |

## Credenciales Supabase

- **URL:** `https://mqbaorcowozqfbdxsvbl.supabase.co`
- **Anon key:** (la que tienes guardada)
- **Repo:** https://github.com/pako-gm/ambelcor

## Acceso

- **CRM completo:** una única cuenta Google (Carmen) con 2FA — sin multiusuario
- **Clientes:** acceso de solo lectura a sus encargos via enlace con token + código corto (sin login)

---

## Esquema de Base de Datos

### Tablas principales

```sql
-- Proveedores de materiales
proveedores (id, nombre, contacto, telefono, email, notas, created_at)

-- Fichas de clientes con medidas base
clientes (id, nombre, apellidos, telefono, email, medidas_base JSONB, notas, created_at)

-- Catálogo de prendas
prendas_catalogo (id, nombre, descripcion, precio_base, descuento, imagen_url, activo, created_at)
-- precio_final se calcula en JS: precio_base * (1 - descuento/100)

-- Inventario de materiales
inventario (id, nombre, tipo, material, color, unidad, stock, stock_minimo, proveedor_id, notas, created_at)

-- Encargos (un encargo puede contener varias prendas)
encargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,              -- formato YY/NNN (autonumerado)
  cliente_id references clientes,
  estado text CHECK (estado IN ('presupuestado','confirmado','en_confeccion','listo','entregado')),
  precio_total numeric,            -- suma calculada de todas las líneas
  fecha_encargo date,
  fecha_entrega_estimada date,
  fecha_entrega_real date,
  token_publico uuid DEFAULT gen_random_uuid() UNIQUE,  -- para enlace cliente
  codigo_corto text UNIQUE,        -- ej: AMB-4X9K, generado al crear
  notas text,
  created_at timestamptz DEFAULT now()
)

-- Líneas de encargo (una por prenda)
encargo_lineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encargo_id references encargos ON DELETE CASCADE,
  prenda_id references prendas_catalogo,
  descripcion text,                -- descripción libre si no viene del catálogo
  medidas_ajuste JSONB,            -- medidas específicas de esta prenda
  precio_unitario numeric,
  cantidad int DEFAULT 1,
  notas text
)
-- precio de línea = precio_unitario * cantidad
-- precio_total del encargo = SUM de todas las líneas

-- Historial de cambios de estado
historial_estados (id, encargo_id, estado_anterior, estado_nuevo, fecha, notas)

-- Datos fiscales de Carmen (para facturas)
datos_fiscales (id, nombre, nif, direccion, telefono, email, iban, created_at)
```

### Tablas Módulo Contable

```sql
-- Cobros de clientes (señal / parcial / final / devolución)
pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encargo_id references encargos,
  fecha date NOT NULL,
  importe numeric NOT NULL,
  tipo text CHECK (tipo IN ('señal','parcial','final','devolucion')),
  forma_pago text CHECK (forma_pago IN ('efectivo','transferencia','tarjeta','stripe')),
  stripe_payment_id text,          -- nullable, para cuando Stripe esté activo
  referencia text,                 -- número de transferencia o referencia manual
  notas text,
  created_at timestamptz DEFAULT now()
)

-- Pagos a proveedores (salidas de caja)
pagos_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id references proveedores,
  fecha date NOT NULL,
  concepto text NOT NULL,
  importe numeric NOT NULL,
  forma_pago text CHECK (forma_pago IN ('efectivo','transferencia')),
  referencia text,
  notas text,
  created_at timestamptz DEFAULT now()
)
```

---

## Flujo de Estados de un Encargo

```
presupuestado → confirmado → en_confeccion → listo → entregado
```

- Al pasar a `confirmado` → se genera PDF de **Presupuesto** (con listado de prendas y precios)
- Al pasar a `entregado` → se genera PDF de **Factura** (datos fiscales + desglose de pagos)

---

## Seguimiento de Encargos para Clientes

### Mecanismo: token público + código corto

Cada encargo genera automáticamente al crearse:
- `token_publico` — UUID largo para compartir como enlace directo
- `codigo_corto` — código de 8 caracteres tipo `AMB-4X9K` para comunicar verbalmente

### Rutas públicas (sin login)

```
/seguimiento/:token_publico     ← acceso directo via enlace
/seguimiento                    ← formulario para introducir código corto
```

### Qué ve el cliente en la página de seguimiento

- Estado actual del encargo con timeline visual
- Listado de prendas incluidas en el encargo
- Fecha de entrega estimada
- Pagos realizados (importes y fechas, sin forma de pago)
- **No ve:** datos de otros clientes, precios de proveedor, módulo contable

### Flujo de uso por Carmen

1. Crear encargo → se generan token y código automáticamente
2. En detalle del encargo → botón **"Compartir seguimiento"**
3. Opciones: copiar enlace largo (para WhatsApp) o mostrar código corto (para teléfono)
4. El cliente accede sin necesidad de registrarse

### Seguridad

```sql
-- RLS: la página de seguimiento solo puede leer encargos via token_publico
-- Se accede con la anon key de Supabase, política restrictiva:
CREATE POLICY "seguimiento_publico" ON encargos
  FOR SELECT USING (token_publico = current_setting('request.jwt.claims', true)::json->>'token');

-- Alternativa más simple: Supabase Edge Function que recibe el token
-- y devuelve solo los campos públicos del encargo
```

> **Opción recomendada:** usar una **Edge Function** `get-encargo-publico` que recibe el token,
> valida que existe, y devuelve únicamente los campos visibles al cliente. Más seguro que exponer
> la tabla directamente con RLS.

---

## Estructura de Rutas React

```
/login
/setup-2fa                        ← configuración TOTP primer acceso
/verify-2fa                       ← introducir código TOTP en cada login
/dashboard                        ← resumen: encargos activos, cobros recientes, stock bajo mínimo
/encargos                         ← listado con filtros por estado
/encargos/nuevo                   ← formulario nuevo encargo + líneas de prendas
/encargos/:id                     ← detalle: estado, prendas, pagos, enlace cliente
/clientes                         ← listado
/clientes/nuevo
/clientes/:id                     ← ficha + medidas + historial de encargos
/proveedores                      ← listado
/proveedores/nuevo
/proveedores/:id                  ← ficha + historial de pagos realizados
/inventario                       ← listado de materiales con stock
/contabilidad
  /contabilidad/cobros            ← cobros de clientes por rango de fechas
  /contabilidad/pagos             ← pagos a proveedores por rango de fechas
  /contabilidad/reportes          ← exportación Excel para gestoría
/admin                            ← datos fiscales, seguridad (2FA), configuración

-- Rutas públicas (sin autenticación)
/seguimiento                      ← formulario código corto
/seguimiento/:token               ← vista pública del encargo
```

---

## Autenticación

### Método principal: Google OAuth
- Login exclusivamente via cuenta Google (no email/password propio)
- Configuración en Supabase Dashboard → Authentication → Providers → Google
- Requiere crear credenciales OAuth 2.0 en Google Cloud Console:
  - Authorized redirect URI: `https://mqbaorcowozqfbdxsvbl.supabase.co/auth/v1/callback`

```javascript
// src/lib/supabase.js — login con Google
export const loginConGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/verify-2fa'
    }
  })
```

### Verificación en dos pasos (2FA — TOTP)
- Supabase Auth soporta TOTP nativo (Google Authenticator, Authy, etc.)
- Se activa en el primer acceso desde `/setup-2fa`
- En logins posteriores: Google OAuth → pantalla de código TOTP → acceso

```javascript
// Enroll 2FA (primera vez, en /setup-2fa)
const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
// data.totp.qr_code → mostrar QR al usuario

// Verificar código TOTP en cada login (en /verify-2fa)
const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
```

### Flujo de login completo
```
1. Carmen pulsa "Entrar con Google"
2. Redirección OAuth → Google → callback Supabase → /verify-2fa
3. Introducir código de 6 dígitos del autenticador
4. Acceso al dashboard
```

### Configuración requerida en Supabase Dashboard
- Authentication → Providers → **Google** → activar + pegar Client ID y Secret
- Authentication → **MFA** → activar TOTP
- Authentication → URL Configuration → Site URL: `https://ambelcor.vercel.app`

---

## Preparación Stripe (instalado, inactivo)

Variable de entorno en `.env`:
```
VITE_STRIPE_ENABLED=false
VITE_STRIPE_PUBLIC_KEY=
```

Componente `<PaymentForm />` creado pero renderizado solo si `VITE_STRIPE_ENABLED=true`.
Cuando llegue el momento: cambiar el flag y conectar. Sin reescrituras.

---

## FASE 1 — Setup y Core

**Objetivo:** Proyecto corriendo en local con auth y navegación.

### 1.1 Scaffold del proyecto
```bash
npm create vite@latest ambelcor -- --template react
cd ambelcor
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @supabase/supabase-js
npm install react-router-dom
npm install @stripe/react-stripe-js @stripe/stripe-js   # instalado, inactivo
npm install xlsx                                         # SheetJS para exportar Excel
npm install jspdf                                        # generación de PDFs
npm install -D vite-plugin-pwa
npx shadcn@latest init
```

### 1.2 Estructura de carpetas
```
src/
  components/
    ui/               ← shadcn/ui components
    layout/           ← Navbar, BottomNav, PageWrapper
    encargos/         ← tarjetas, timeline de estados, líneas de prenda
    seguimiento/      ← componentes de la vista pública
  pages/
    Login.jsx
    Setup2FA.jsx
    Verify2FA.jsx
    Dashboard.jsx
    Encargos/
    Clientes/
    Proveedores/
    Inventario/
    Contabilidad/
    Admin/
    Seguimiento/      ← vista pública sin auth
  lib/
    supabase.js       ← cliente Supabase
    stripe.js         ← cliente Stripe (inactivo)
  hooks/
    useAuth.js
    useEncargos.js
    usePagos.js
  utils/
    formatters.js     ← fechas, importes, números de encargo
    exportExcel.js    ← lógica SheetJS
    codigoCorto.js    ← generador de códigos tipo AMB-4X9K
  App.jsx
  main.jsx
```

### 1.3 SQL a ejecutar en Supabase
Ejecutar todas las tablas del esquema definido arriba en el SQL Editor de Supabase.

```sql
-- Función para generar código corto único
CREATE OR REPLACE FUNCTION generar_codigo_corto()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'AMB-';
  i int;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-asignar código corto al crear encargo
CREATE OR REPLACE FUNCTION set_codigo_corto()
RETURNS trigger AS $$
BEGIN
  IF NEW.codigo_corto IS NULL THEN
    LOOP
      NEW.codigo_corto := generar_codigo_corto();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM encargos WHERE codigo_corto = NEW.codigo_corto);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_codigo_corto
  BEFORE INSERT ON encargos
  FOR EACH ROW EXECUTE FUNCTION set_codigo_corto();
```

### 1.4 RLS — Políticas de seguridad
```sql
-- CRM: solo el usuario autenticado (Carmen) puede acceder
ALTER TABLE encargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE encargo_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedor ENABLE ROW LEVEL SECURITY;

-- Política general: solo usuarios autenticados
CREATE POLICY "solo_autenticado" ON encargos
  FOR ALL USING (auth.role() = 'authenticated');

-- Vista pública de encargos: se gestiona via Edge Function, no RLS directo
```

### 1.5 Auth y shell
- Login con **Google OAuth** via Supabase Auth (sin email/password propio)
- Pantalla de **código TOTP** post-OAuth (`/verify-2fa`)
- Página de **setup 2FA** en primer acceso (`/setup-2fa`)
- `useAuth` hook con contexto global (user + mfaVerified)
- Navegación bottom-tab para móvil
- Rutas protegidas (auth + 2FA verificado)
- Rutas públicas `/seguimiento/*` sin protección

**Entregable Fase 1:** App corriendo en local con login funcional, 2FA configurado, rutas protegidas y navegación mobile.

---

## FASE 2 — Encargos

**Objetivo:** CRUD completo de encargos con múltiples prendas, flujo de estados y PDFs.

### 2.1 Listado de encargos
- Filtros por estado (chips horizontales mobile-friendly)
- Tarjetas con: número encargo, cliente, nº de prendas, estado, fecha entrega
- Búsqueda por nombre de cliente o número de encargo

### 2.2 Nuevo encargo
- Selector de cliente (con buscador)
- **Sección de líneas de prendas** (añadir/eliminar dinámicamente):
  - Selector de prenda del catálogo (o descripción libre)
  - Cantidad
  - Precio unitario (pre-relleno desde catálogo, editable)
  - Medidas ajuste por prenda (JSONB)
  - Notas por prenda
- Precio total calculado automáticamente al añadir/modificar líneas
- Fecha de entrega estimada
- Autonumeración YY/NNN + código corto asignados automáticamente al guardar

### 2.3 Detalle de encargo
- Timeline visual de estados
- Botón para avanzar al siguiente estado
- **Listado de prendas del encargo** con medidas y precios
- Historial de cambios de estado
- Sección de pagos del cliente (registro rápido)
- Botón **"Compartir seguimiento"** → copia enlace o muestra código corto
- Acceso a PDFs

### 2.4 Generación de PDFs (jsPDF)
- **Presupuesto:** al confirmar → nº encargo, cliente, listado de prendas con precios, total
- **Factura:** al entregar → datos fiscales de Carmen + prendas + desglose de pagos recibidos

**Entregable Fase 2:** Flujo completo de encargo (multi-prenda) desde creación hasta entrega con PDFs y enlace de seguimiento.

---

## FASE 3 — Módulo Contable

**Objetivo:** Registro de cobros y pagos + exportación Excel para gestoría.

### 3.1 Cobros de clientes (`/contabilidad/cobros`)
- Listado filtrable por rango de fechas y tipo
- Formulario rápido de registro de cobro (vinculado a encargo)
- Totales por período
- Formas de pago: efectivo / transferencia / tarjeta
- Campo `stripe_payment_id` presente pero oculto hasta Fase 4

### 3.2 Pagos a proveedores (`/contabilidad/pagos`)
- Listado filtrable por rango de fechas y proveedor
- Formulario de registro de pago con concepto libre
- Totales por período

### 3.3 Reportes Excel (`/contabilidad/reportes`)

Usando **SheetJS**, generación de:

| Reporte | Contenido |
|---|---|
| Libro de cobros | fecha, nº encargo, cliente, concepto, importe, forma de pago |
| Libro de pagos | fecha, proveedor, concepto, importe, forma de pago, referencia |
| Resumen de caja | cobros vs pagos por mes/trimestre |

```javascript
// Filtro trimestral (utils/exportExcel.js)
const filtrarPorTrimestre = (registros, trimestre, año) => {
  const meses = { 1: [0,2], 2: [3,5], 3: [6,8], 4: [9,11] };
  return registros.filter(r => {
    const d = new Date(r.fecha);
    return d.getFullYear() === año &&
           d.getMonth() >= meses[trimestre][0] &&
           d.getMonth() <= meses[trimestre][1];
  });
};
```

**Entregable Fase 3:** Módulo contable operativo con exportación Excel lista para gestoría.

---

## FASE 4 — Stripe (Futuro)

**Objetivo:** Permitir que los clientes paguen señales o pagos parciales online.

### 4.1 Activación
```env
VITE_STRIPE_ENABLED=true
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### 4.2 Componentes a activar
- `<PaymentForm />` en la **página pública de seguimiento** del encargo
- Webhook de Stripe → Supabase Edge Function para registrar el pago automáticamente en `pagos`
- `stripe_payment_id` visible en listado de cobros del módulo contable

### 4.3 Consideraciones móvil
- Stripe Elements tiene soporte nativo para Apple Pay / Google Pay
- `@stripe/react-stripe-js` ya instalado desde Fase 1

**Entregable Fase 4:** Pasarela de pago online accesible desde el enlace de seguimiento del cliente.

---

## Decisiones de Diseño

- **Palette:** Cálida y femenina, adaptada a un taller de costura (no corporativa)
- **Mobile-first:** Navegación bottom-tab, formularios de una columna, tarjetas táctiles
- **Offline-ready:** PWA con vite-plugin-pwa para uso sin conexión eventual
- **Sin motor contable complejo:** Solo registro + exportación. La gestoría hace el resto.
- **Un solo usuario CRM:** Sin gestión de roles, sin multiusuario, máxima simplicidad
- **Clientes sin registro:** Acceso via token/código, sin cuentas, sin contraseñas

---

## Orden de Trabajo Sugerido en VS Code + Claude Code

1. Ejecutar **SQL completo** en Supabase (MCP) — tablas + trigger código corto
2. `npm create vite@latest` + instalar dependencias + `shadcn init`
3. Configurar `src/lib/supabase.js` con las credenciales
4. Configurar Google OAuth en Google Cloud Console + Supabase Dashboard
5. Crear shell con router + rutas vacías (protegidas y públicas)
6. Implementar login Google + 2FA (`useAuth`, `/verify-2fa`, `/setup-2fa`)
7. Construir navegación mobile (bottom tabs)
8. Arrancar con `/encargos` — la ruta más usada

---

*Documento generado para continuar el desarrollo en VS Code + Claude Code con MCP de Supabase.*
