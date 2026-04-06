# Plan: Fase 3 — Módulo Contable AmbElCor

## Contexto

Implementar las 3 pantallas de contabilidad (actualmente placeholders) con datos reales de Supabase.
Las rutas ya están definidas en `src/App.jsx` (líneas 63-65) y las funciones de exportación Excel
ya existen en `src/utils/exportExcel.js`.

---

## Paso 1 — Migración SQL (Supabase MCP)

Crear `pagos_proveedor` con RLS si no existe, y verificar tabla `proveedores`:

```sql
CREATE TABLE IF NOT EXISTS pagos_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  concepto text NOT NULL,
  importe numeric(10,2) NOT NULL,
  forma_pago text CHECK (forma_pago IN ('efectivo','transferencia','tarjeta','bizum')),
  referencia text,
  notas text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pagos_proveedor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo autenticados" ON pagos_proveedor FOR ALL TO authenticated USING (true);
```

---

## Paso 2 — `src/hooks/useContabilidad.js` (nuevo)

```
fetchCobros({ año, trimestre })          → pagos JOIN encargos JOIN clientes
fetchPagosProveedor({ año, trimestre })  → pagos_proveedor JOIN proveedores
registrarPagoProveedor(...)
eliminarPagoProveedor(id)
fetchProveedores()
crearProveedor({ nombre, telefono, email })
fetchResumenAnual(año)                   → datos agrupados por mes para el gráfico
```

---

## Paso 3 — `src/pages/Contabilidad/CobrosList.jsx` (nuevo)

- Selector año + filtro trimestre (Todos / T1 / T2 / T3 / T4) + botón "Exportar Excel"
- Tarjetas resumen: **Total cobrado · Devoluciones · Pendiente global**
- Lista: fecha · nº encargo (link a `/encargos/:id`) · cliente · tipo · forma de pago · importe
- Reutiliza:
  - `formatFecha`, `formatImporte`, `TIPO_PAGO_LABELS`, `FORMA_PAGO_LABELS` — `src/utils/formatters.js`
  - `exportarLibroCobros(cobros, { trimestre, año })` — `src/utils/exportExcel.js`

---

## Paso 4 — `src/pages/Contabilidad/PagosList.jsx` (nuevo)

- Selector año + filtro trimestre + botón "Exportar Excel"
- Tarjeta resumen: **Total gastado en período**
- Botón **+ Registrar gasto** → formulario inline con:
  - Proveedor (select de BD + opción "＋ Nuevo proveedor" abre mini-modal)
  - Fecha, Concepto, Importe, Forma de pago (efectivo/transferencia/tarjeta/bizum), Referencia
- Lista: fecha · proveedor · concepto · forma de pago · importe · botón eliminar
- Eliminar con popup de confirmación (mismo patrón que el de eliminar encargo)
- Reutiliza:
  - Patrón formulario inline de `src/pages/Encargos/EncargoDetalle.jsx` líneas 380-420
  - `exportarLibroPagos(pagos, { trimestre, año })` — `src/utils/exportExcel.js`

---

## Paso 5 — `src/pages/Contabilidad/Reportes.jsx` (nuevo)

- Selector de año
- **Gráfico de barras CSS** por mes (sin librería extra):
  - 12 barras dobles: cobros (color teal) / gastos (color amber)
  - Altura proporcional al máximo del año
- Resumen anual: **Total cobrado · Total gastado · Resultado** (cobros - gastos)
- Sección exportar:
  - Selector trimestre + botones "Libro de Cobros" y "Libro de Pagos"
  - Usa `exportarLibroCobros` y `exportarLibroPagos` de `src/utils/exportExcel.js`

---

## Paso 6 — `src/App.jsx` (modificar líneas 63-65)

Reemplazar los 3 `<Placeholder>` de contabilidad con imports reales:

```jsx
import CobrosList from '@/pages/Contabilidad/CobrosList'
import PagosList from '@/pages/Contabilidad/PagosList'
import Reportes from '@/pages/Contabilidad/Reportes'

<Route path="/contabilidad/cobros" element={<Protected><CobrosList /></Protected>} />
<Route path="/contabilidad/pagos" element={<Protected><PagosList /></Protected>} />
<Route path="/contabilidad/reportes" element={<Protected><Reportes /></Protected>} />
```

---

## Verificación

1. `/contabilidad/cobros` → muestra pagos ya registrados en encargos existentes
2. `/contabilidad/pagos` → registrar gasto → aparece en lista y en Supabase
3. Exportar Excel de cobros → genera `.xlsx` con columnas correctas
4. `/contabilidad/reportes` → gráfico con barras en meses con datos
5. Eliminar pago proveedor → popup confirmación → desaparece de la lista
