# Resumen de páginas — Amb el Cor CRM

> Última actualización: 2026-04-22
> Total: 25 páginas organizadas en 9 módulos.
> Las rutas `/seguimiento/*` son las únicas públicas; el resto requiere Google OAuth + 2FA TOTP.

---

## Autenticación (rutas públicas)

### `/login` — `Login.jsx`
Puerta de entrada con botón de Google OAuth. Muestra el logo y nombre del taller sobre fondo color primario. Llama a `loginConGoogle()` de Supabase.

### `/setup-2fa` — `Setup2FA.jsx`
Configuración inicial del segundo factor. Muestra un QR para escanear con una app TOTP (Google Authenticator, etc.) y un campo de 6 dígitos para verificar. Solo se muestra la primera vez.

### `/verify-2fa` — `Verify2FA.jsx`
Verificación 2FA en cada inicio de sesión. Lista los factores TOTP existentes y solicita el código de 6 dígitos. Si no hay factores configurados, redirige a `/setup-2fa`.

---

## Dashboard

### `/` → `/encargos` — `Dashboard.jsx`
Resumen ejecutivo con métricas clave: encargos activos, listos para recoger y total. Muestra los 5 encargos activos más recientes y un resumen contable del mes actual vs. el anterior con mini gráficas de barras.

**Datos:** `fetchEncargos()`, `fetchCobros()`, `fetchPagosProveedor()`

---

## Módulo Encargos

### `/encargos` — `EncargosLista.jsx`
Lista completa de encargos con búsqueda por nombre/número y filtros por estado (presupuestado, confirmado, en_confeccion, listo, entregado). Tarjetas con cliente, número, prendas, fecha estimada, precio y badge de estado.

**Datos:** `fetchEncargos()` con filtro opcional por estado

### `/encargos/nuevo` — `NuevoEncargo.jsx`
Formulario de creación de encargo. Permite seleccionar cliente (con autocompletado y creación rápida inline), fecha de entrega estimada y líneas de prendas dinámicas desde el catálogo (precio y descuento se rellenan automáticamente). El total se calcula en tiempo real.

**Datos:** `fetchTodosClientes()`, `crearClienteRapido()`, `fetchCatalogo()`, `crearEncargo()`

### `/encargos/:id` — `EncargoDetalle.jsx`
Centro de operaciones principal del CRM. Contiene:
- Timeline de 5 estados con avance/retroceso (bloquea avance si no hay señal del 50%)
- Registro, edición y eliminación de pagos (señal, parcial, final, devolución)
- Gestión de líneas de prendas (añadir/editar/eliminar)
- Generación de PDF (presupuesto al confirmar, factura al entregar)
- Envío de notificación WhatsApp vía Edge Function `notify-whatsapp`
- Botón para compartir enlace de seguimiento público (token)

**Datos:** `fetchEncargo(id)`, `avanzarEstado()`, `registrarPago()`, `actualizarPago()`, `eliminarPago()`, `agregarLinea()`, `actualizarLinea()`, `eliminarLinea()`

---

## Módulo Clientes

### `/clientes` — `ClientesLista.jsx`
Lista de clientes con búsqueda por nombre, teléfono o email. Tarjetas clicables con información de contacto.

**Datos:** `fetchClientes()`

### `/clientes/nuevo` — `NuevoCliente.jsx`
Formulario de alta de cliente: nombre (obligatorio), apellidos, teléfono (9 dígitos), email y notas. Incluye validación de formato.

**Datos:** `crearCliente()`

### `/clientes/:id` — `ClienteDetalle.jsx`
Detalle de cliente con edición inline, sección colapsable de medidas (con enlace a formulario completo), historial de encargos ordenado por fecha y total facturado calculado.

**Datos:** `fetchCliente(id)`, `fetchMedidasCliente(id)`, `actualizarCliente()`, `eliminarCliente()`

### `/clientes/:id/medidas` — `MedidasCliente.jsx`
Formulario detallado de medidas para confección, organizado en 5 secciones colapsables:
1. **Corporales generales:** altura, pecho, cintura, cadera, talle, ancho espalda/pecho, separación pecho, altura pecho
2. **Brazos/manga:** largo manga, contorno sisa, brazo, codo, muñeca
3. **Falda/faldón:** largo delantero/trasero, contorno cadera alta, vuelo deseado
4. **Cuello/escote (gipó):** contorno cuello, profundidad escote del/tras, ancho escote
5. **Referencias:** altura cintura-suelo, número calzado, altura con zapato

Todos los campos son opcionales, se guardan como decimales. Incluye fecha de medición y notas.

**Datos:** `guardarMedidasCliente(id, datos)`

---

## Módulo Proveedores

### `/proveedores` — `ProveedoresLista.jsx`
Lista de proveedores con búsqueda por nombre, contacto o teléfono.

**Datos:** `fetchProveedores()`

### `/proveedores/nuevo` — `NuevoProveedor.jsx`
Alta de proveedor: nombre (obligatorio), persona de contacto, teléfono, email y notas.

**Datos:** `crearProveedor()`

### `/proveedores/:id` — `ProveedorDetalle.jsx`
Detalle de proveedor con edición inline, historial de pagos realizados (con total gastado) y lista de materiales de inventario asociados con alerta de stock bajo.

**Datos:** `fetchProveedor(id)`, `actualizarProveedor()`, `eliminarProveedor()`

---

## Módulo Contabilidad

### `/contabilidad` — `ContabilidadDashboard.jsx`
Panel financiero con selectores de año y trimestre. Muestra 3 KPIs (ingresos, gastos, resultado), gráfico de dona CSS con desglose de gastos por categoría y barras comparativas ingresos vs. gastos. Accesos rápidos a cobros, pagos y reportes.

**Datos:** `fetchResumenPorCategoria(año, trimestre)`, `fetchCobros({año, trimestre})`

### `/contabilidad/cobros` — `CobrosList.jsx`
Libro de ingresos filtrable por año/trimestre. Tabla con fecha, número de encargo (enlazado), cliente, tipo de pago, forma de pago e importe. KPIs: total cobrado, devoluciones y neto. Exportación a Excel.

**Datos:** `fetchCobros({año, trimestre})`

### `/contabilidad/pagos` — `PagosList.jsx`
Libro de gastos con registro inline de nuevos pagos. Permite asociar proveedor (con creación rápida), categoría contable, forma de pago y desglose de IVA automático (base imponible + % IVA → total calculado). Exportación a Excel.

**Categorías:** material, cuota_autonomo, alquiler, suministros, servicios_profesionales, impuestos, transporte, marketing, seguros, otros

**Datos:** `fetchPagosProveedor({año, trimestre})`, `registrarPagoProveedor()`, `eliminarPagoProveedor()`

### `/contabilidad/reportes` — `Reportes.jsx`
Informes anuales con gráfica de barras mensual (cobros vs. gastos), resumen anual y exportación trimestral de tres libros Excel: balance completo, libro de cobros y libro de gastos.

**Datos:** `fetchResumenAnual(año)`, `fetchCobros()`, `fetchPagosProveedor()`

---

## Módulo Inventario

### `/inventario` — `MaterialesLista.jsx`
Lista de materiales con KPIs (activos, stock bajo, valor total). Filtros por búsqueda, categoría y "solo stock bajo". Vista tabla en desktop y tarjetas en móvil. Exportación Excel del stock actual.

**Datos:** `fetchMateriales({soloActivos: true})`
**Lógica:** `stock_bajo` = stock_actual < stock_minimo; `valor_total` = Σ(stock × precio_referencia)

### `/inventario/nuevo` — `NuevoMaterial.jsx`
Alta de material: código (auto-generado como MAT-XXX), nombre, unidad (ud./m/m²/kg/l/par/rollo/caja), categoría, stock mínimo de alerta, precio de referencia y notas.

**Datos:** `crearMaterial(payload)`

### `/inventario/:id` — `MaterialDetalle.jsx`
Gestión completa de un material con cuatro paneles de acción:
- **Entrada:** cantidad, precio, proveedor, fecha, notas — con opción de crear gasto contable automáticamente
- **Salida:** cantidad, motivo (consumo_encargo/merma/devolucion/otro), encargo asociado, fecha, notas
- **Ajuste:** cantidad (+/-), motivo, fecha
- **Edición:** todos los campos del material

Historial completo de movimientos con exportación Excel.

**Datos:** `fetchMaterial(id)`, `registrarEntrada()`, `registrarSalida()`, `registrarAjuste()`, `actualizarMaterial()`, `desactivarMaterial()`

---

## Módulo Catálogo

### `/catalogo` — `CatalogoLista.jsx`
Lista de prendas del catálogo con búsqueda y toggle activa/inactiva. Las prendas inactivas no aparecen al crear encargos. Cada ítem muestra nombre, descripción, precio base y descuento.

**Datos:** `fetchPrendasCatalogo()`, `toggleActivoPrenda(id, activo)`

### `/catalogo/nueva` y `/catalogo/:id` — `CatalogoForm.jsx`
Formulario de creación/edición de prenda: nombre (obligatorio), descripción, precio base (obligatorio), descuento (0–100%) y toggle activo/inactivo.

**Datos:** `fetchPrenda(id)`, `crearPrenda()`, `actualizarPrenda()`

---

## Módulo Cronograma

### `/cronograma` — `Cronograma.jsx`
Planificación visual de encargos en 3 vistas:

- **Por fecha:** tarjetas ordenadas por urgencia con barra de progreso y colores (rojo ≤3 días, ámbar ≤7 días, teal >7 días)
- **Por estado:** grupos colapsables tipo Kanban con contador por estado
- **Gantt:** línea temporal horizontal con barras arrastrables (drag & drop) que actualizan las fechas en Supabase. Incluye marcador de hoy (línea roja), sombra en fines de semana y leyenda de colores por estado.

Toggle global para mostrar/ocultar encargos entregados. Sección separada para encargos sin fecha de entrega.

**Datos:** `fetchEncargos()`, `updateFechasEncargo(id, newInicio, newFin)`

---

## Seguimiento Público (sin autenticación)

### `/seguimiento` — `SeguimientoForm.jsx`
Página pública de entrada al seguimiento. El cliente introduce su código corto (AMB-XXXX) y si existe en la base de datos, redirige al detalle con el token público.

**Datos:** query directa a `encargos` por `codigo_corto` → obtiene `token_publico`

### `/seguimiento/:token` — `SeguimientoDetalle.jsx`
Vista pública y de solo lectura del estado del encargo. Muestra:
- Timeline vertical de 5 estados con fechas (puntos de colores, completados con check)
- Lista de prendas con cantidades y precios
- Resumen de pagos: cobrado, devuelto, pendiente (ámbar si hay saldo, teal si está pagado)

Sin ningún botón de acción — solo información para el cliente.

**Datos:** `encargos` + joins a `clientes`, `encargo_lineas`, `prendas_catalogo`, `historial_estados`, `pagos`

---

## Tabla resumen

| Ruta | Archivo | Propósito | Auth |
|------|---------|-----------|------|
| `/login` | Login.jsx | Google OAuth | No |
| `/setup-2fa` | Setup2FA.jsx | Configuración inicial 2FA | No |
| `/verify-2fa` | Verify2FA.jsx | Verificación 2FA | No |
| `/` | Dashboard.jsx | Panel de métricas | Sí |
| `/encargos` | EncargosLista.jsx | Lista de encargos | Sí |
| `/encargos/nuevo` | NuevoEncargo.jsx | Crear encargo | Sí |
| `/encargos/:id` | EncargoDetalle.jsx | Detalle y gestión de encargo | Sí |
| `/clientes` | ClientesLista.jsx | Lista de clientes | Sí |
| `/clientes/nuevo` | NuevoCliente.jsx | Crear cliente | Sí |
| `/clientes/:id` | ClienteDetalle.jsx | Detalle de cliente | Sí |
| `/clientes/:id/medidas` | MedidasCliente.jsx | Medidas de confección | Sí |
| `/proveedores` | ProveedoresLista.jsx | Lista de proveedores | Sí |
| `/proveedores/nuevo` | NuevoProveedor.jsx | Crear proveedor | Sí |
| `/proveedores/:id` | ProveedorDetalle.jsx | Detalle de proveedor | Sí |
| `/contabilidad` | ContabilidadDashboard.jsx | Panel financiero | Sí |
| `/contabilidad/cobros` | CobrosList.jsx | Libro de ingresos | Sí |
| `/contabilidad/pagos` | PagosList.jsx | Libro de gastos | Sí |
| `/contabilidad/reportes` | Reportes.jsx | Informes anuales | Sí |
| `/inventario` | MaterialesLista.jsx | Lista de materiales | Sí |
| `/inventario/nuevo` | NuevoMaterial.jsx | Crear material | Sí |
| `/inventario/:id` | MaterialDetalle.jsx | Gestión de material | Sí |
| `/catalogo` | CatalogoLista.jsx | Catálogo de prendas | Sí |
| `/catalogo/nueva` `/catalogo/:id` | CatalogoForm.jsx | Crear/editar prenda | Sí |
| `/cronograma` | Cronograma.jsx | Planificación y Gantt | Sí |
| `/seguimiento` | SeguimientoForm.jsx | Entrada seguimiento público | No |
| `/seguimiento/:token` | SeguimientoDetalle.jsx | Estado pedido (cliente) | No |
