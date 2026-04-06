# Plan: Módulo Clientes y Proveedores — AmbElCor

## Contexto

Implementar el CRUD completo de Clientes y Proveedores. Las rutas ya están en `src/App.jsx`
como placeholders. Ya existe lógica parcial de clientes en `src/hooks/useEncargos.js`
(`buscarClientes`, `crearClienteRapido`) que hay que migrar/extender a hooks propios.

---

## Archivos a crear

| Archivo | Descripción |
|---|---|
| `src/hooks/useClientes.js` | CRUD completo de clientes |
| `src/hooks/useProveedores.js` | CRUD completo de proveedores |
| `src/pages/Clientes/ClientesLista.jsx` | Lista con búsqueda |
| `src/pages/Clientes/ClienteDetalle.jsx` | Ficha cliente completa |
| `src/pages/Clientes/NuevoCliente.jsx` | Formulario creación |
| `src/pages/Proveedores/ProveedoresLista.jsx` | Lista con búsqueda |
| `src/pages/Proveedores/ProveedorDetalle.jsx` | Ficha proveedor completa |
| `src/pages/Proveedores/NuevoProveedor.jsx` | Formulario creación |

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Importar y conectar los 6 nuevos componentes (líneas 52-58) |
| `src/hooks/useEncargos.js` | Mantener `buscarClientes` y `crearClienteRapido` tal como están (NuevoEncargo los sigue usando) |

---

## MÓDULO CLIENTES

### Hook: `src/hooks/useClientes.js`

```javascript
fetchClientes(query)
// → SELECT id, nombre, apellidos, telefono, email, notas, created_at
// → ilike en nombre+apellidos si hay query, ordenado por nombre ASC

fetchCliente(id)
// → SELECT * FROM clientes WHERE id = id
// → JOIN encargos (id, numero, estado, precio_total, fecha_encargo, fecha_entrega_estimada)
//     con encargo_lineas count

crearCliente({ nombre, apellidos, telefono, email, medidas_base, notas })

actualizarCliente(id, campos)

eliminarCliente(id)
// Solo si no tiene encargos asociados (validar antes)
```

---

### `src/pages/Clientes/ClientesLista.jsx`

Mismo patrón que `EncargosLista.jsx`:

- Cabecera: "Clientes" + botón "+ Nuevo cliente" → `/clientes/nuevo`
- Input búsqueda con X para limpiar (patrón de `NuevoEncargo.jsx`)
- Tarjetas clickables → `/clientes/:id`:
  - Nombre completo (bold)
  - Teléfono · Email
  - Nº encargos realizados
- Estado vacío si no hay resultados

---

### `src/pages/Clientes/NuevoCliente.jsx`

Formulario completo (amplía el "formulario rápido" de `NuevoEncargo.jsx`):

**Sección Datos personales:**
- Nombre * (required)
- Apellidos
- Teléfono * (9 dígitos, mismo validador que NuevoEncargo)
- Email (validación RFC)

**Sección Medidas base** (colapsable):
- Pecho (cm)
- Cintura (cm)
- Cadera (cm)
- Talla (texto libre: "38", "M", etc.)
- Largo espalda (cm)
- Notas de medidas

**Sección Notas:**
- Textarea libre

**Botones:** Guardar cliente / Cancelar (→ `/clientes`)

---

### `src/pages/Clientes/ClienteDetalle.jsx`

**Cabecera:**
- Botón ← + Nombre completo
- Botón editar (abre campos en edición inline) + botón eliminar (popup confirmación)

**Sección "Datos de contacto"** (editable inline):
- Teléfono, Email, Notas

**Sección "Medidas base"** (editable inline):
- Pecho, Cintura, Cadera, Talla, Largo espalda, Notas medidas
- Botón "Editar medidas" → campos editables → "Guardar" / "Cancelar"

**Sección "Encargos":**
- Tarjeta resumen: Total encargos · Total facturado
- Lista de encargos del cliente (tarjetas clickables → `/encargos/:id`):
  - Número · Estado (badge color) · Fecha · Importe
- Ordenados por fecha DESC

---

## MÓDULO PROVEEDORES

### Hook: `src/hooks/useProveedores.js`

```javascript
fetchProveedores(query)
// → SELECT id, nombre, contacto, telefono, email, notas, created_at
// → ilike en nombre si hay query, ordenado por nombre ASC

fetchProveedor(id)
// → SELECT * FROM proveedores WHERE id = id
// → JOIN pagos_proveedor (fecha, concepto, importe, forma_pago) ORDER BY fecha DESC
// → JOIN inventario (id, nombre, stock, unidad) WHERE proveedor_id = id

crearProveedor({ nombre, contacto, telefono, email, notas })

actualizarProveedor(id, campos)

eliminarProveedor(id)
// Solo si no tiene pagos ni inventario asociado (validar antes)
```

---

### `src/pages/Proveedores/ProveedoresLista.jsx`

Mismo patrón que `ClientesLista.jsx`:

- Cabecera: "Proveedores" + botón "+ Nuevo proveedor" → `/proveedores/nuevo`
- Input búsqueda con X para limpiar
- Tarjetas clickables → `/proveedores/:id`:
  - Nombre (bold)
  - Contacto · Teléfono
  - Total gastado (suma de pagos_proveedor)

---

### `src/pages/Proveedores/NuevoProveedor.jsx`

**Sección Datos:**
- Nombre * (required)
- Persona de contacto
- Teléfono
- Email

**Sección Notas:**
- Textarea libre

**Botones:** Guardar proveedor / Cancelar (→ `/proveedores`)

---

### `src/pages/Proveedores/ProveedorDetalle.jsx`

**Cabecera:**
- Botón ← + Nombre proveedor
- Botón editar inline + botón eliminar (popup confirmación)

**Sección "Datos de contacto"** (editable inline):
- Nombre, Contacto, Teléfono, Email, Notas

**Sección "Historial de pagos":**
- Tarjeta resumen: Total gastado
- Lista de pagos (de `pagos_proveedor`):
  - Fecha · Concepto · Forma de pago · Importe
- Ordenados por fecha DESC

**Sección "Materiales / Inventario":**
- Lista de artículos de inventario con `proveedor_id = id`:
  - Nombre · Stock actual · Unidad
  - Badge rojo si `stock < stock_minimo`
- Si vacío: mensaje "Sin artículos de inventario"

---

## Migración SQL necesaria

Verificar que las tablas `clientes` y `proveedores` tienen exactamente estos campos
(en caso de que falte alguno, añadirlo con ALTER TABLE):

```sql
-- Verificar campo medidas_base en clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS medidas_base jsonb;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notas text;

-- Verificar campos en proveedores
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS contacto text;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS notas text;
```

---

## `src/App.jsx` — líneas 52-58

```jsx
import ClientesLista from '@/pages/Clientes/ClientesLista'
import NuevoCliente from '@/pages/Clientes/NuevoCliente'
import ClienteDetalle from '@/pages/Clientes/ClienteDetalle'
import ProveedoresLista from '@/pages/Proveedores/ProveedoresLista'
import NuevoProveedor from '@/pages/Proveedores/NuevoProveedor'
import ProveedorDetalle from '@/pages/Proveedores/ProveedorDetalle'

<Route path="/clientes" element={<Protected><ClientesLista /></Protected>} />
<Route path="/clientes/nuevo" element={<Protected><NuevoCliente /></Protected>} />
<Route path="/clientes/:id" element={<Protected><ClienteDetalle /></Protected>} />
<Route path="/proveedores" element={<Protected><ProveedoresLista /></Protected>} />
<Route path="/proveedores/nuevo" element={<Protected><NuevoProveedor /></Protected>} />
<Route path="/proveedores/:id" element={<Protected><ProveedorDetalle /></Protected>} />
```

---

## Reutilización de código existente

| Elemento | Fuente |
|---|---|
| Formulario cliente rápido (campos + validaciones) | `NuevoEncargo.jsx` líneas 180-235 |
| Input búsqueda con X para limpiar | `NuevoEncargo.jsx` (recién añadido) |
| Patrón lista + tarjetas clickables | `EncargosLista.jsx` |
| Popup confirmación eliminar | `EncargoDetalle.jsx` (recién añadido) |
| `formatFecha`, `formatImporte` | `src/utils/formatters.js` |
| Patrón edición inline con Guardar/Cancelar | `EncargoDetalle.jsx` sección pagos |

---

## Orden de implementación sugerido

1. Migración SQL (verificar campos)
2. `useClientes.js` + `useProveedores.js`
3. `ClientesLista` + `ProveedoresLista` (listas simples)
4. `NuevoCliente` + `NuevoProveedor` (formularios)
5. `ClienteDetalle` + `ProveedorDetalle` (fichas completas)
6. Conectar en `App.jsx`

---

## Verificación

1. Crear cliente desde `/clientes/nuevo` → aparece en lista → ficha muestra datos
2. Editar teléfono desde ficha → se guarda en Supabase
3. Encargo existente aparece en historial del cliente
4. Crear proveedor → desde PagosList (Fase 3) aparece en selector
5. Ficha proveedor muestra historial de pagos si existen
6. Eliminar cliente sin encargos → OK; con encargos → mensaje de error
