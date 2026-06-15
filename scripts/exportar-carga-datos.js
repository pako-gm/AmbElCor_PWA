/**
 * Exporta los datos actuales de Supabase a archivos Excel (uno por tabla) en
 * DESIGN/CARGA_DATOS/. Pensado como punto de partida para sustituir los datos
 * ficticios por los reales: Carmen edita los .xlsx y luego se cargan con
 * scripts/cargar-datos.js.
 *
 * Las FK (UUID) se exportan resueltas a claves naturales legibles
 * (nº de encargo, nombre de clienta, código de material…).
 *
 * Uso:  npm run export:carga
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const OUT_DIR = path.join(root, 'DESIGN', 'CARGA_DATOS')

// --- Credenciales: parsear .env.local a mano (sin dotenv) ---
function parseEnv(file) {
  const env = {}
  if (!fs.existsSync(file)) return env
  for (const linea of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (!m || linea.trim().startsWith('#')) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[m[1]] = val
  }
  return env
}

// Proxy/SSL corporativo intercepta el certificado de Supabase y Node no lo verifica.
// Para esta utilidad local de exportación puntual relajamos la verificación TLS.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const env = parseEnv(path.join(root, '.env.local'))
const URL = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
if (!URL || !KEY) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}
const supabase = createClient(URL, KEY)

// --- Helpers ---
const json = (v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v)

async function fetchAll(tabla) {
  const { data, error } = await supabase.from(tabla).select('*')
  if (error) throw new Error(`${tabla}: ${error.message}`)
  return data ?? []
}

function escribir(nombreArchivo, filas, cabeceras) {
  // Si no hay filas, generamos una hoja solo con cabeceras (plantilla vacía).
  const ws = filas.length
    ? XLSX.utils.json_to_sheet(filas)
    : XLSX.utils.aoa_to_sheet([cabeceras])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  XLSX.writeFile(wb, path.join(OUT_DIR, nombreArchivo))
  console.log(`  ✓ ${nombreArchivo} (${filas.length} filas)`)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Exportando a ${OUT_DIR}\n`)

  // Mapas id -> clave natural para resolver FK
  const clientes = await fetchAll('clientes')
  const proveedores = await fetchAll('proveedores')
  const prendas = await fetchAll('prendas_catalogo')
  const materiales = await fetchAll('materiales')
  const encargos = await fetchAll('encargos')

  const nombreCliente = (c) => `${c.nombre ?? ''} ${c.apellidos ?? ''}`.trim()
  const mapCliente = new Map(clientes.map((c) => [c.id, { nombre: nombreCliente(c), tel: c.telefono ?? '' }]))
  const mapProveedor = new Map(proveedores.map((p) => [p.id, p.nombre]))
  const mapPrenda = new Map(prendas.map((p) => [p.id, p.nombre]))
  const mapMaterial = new Map(materiales.map((m) => [m.id, m.codigo || m.nombre]))
  const mapEncargo = new Map(encargos.map((e) => [e.id, e.numero]))

  // ---------- MAESTROS ----------
  escribir('clientes.xlsx', clientes.map((c) => ({
    nombre: c.nombre, apellidos: c.apellidos ?? '', telefono: c.telefono ?? '',
    email: c.email ?? '', medidas_base: json(c.medidas_base), notas: c.notas ?? '',
  })), ['nombre', 'apellidos', 'telefono', 'email', 'medidas_base', 'notas'])

  escribir('proveedores.xlsx', proveedores.map((p) => ({
    nombre: p.nombre, contacto: p.contacto ?? '', telefono: p.telefono ?? '',
    email: p.email ?? '', notas: p.notas ?? '',
  })), ['nombre', 'contacto', 'telefono', 'email', 'notas'])

  escribir('prendas_catalogo.xlsx', prendas.map((p) => ({
    nombre: p.nombre, descripcion: p.descripcion ?? '', precio_base: p.precio_base,
    descuento: p.descuento ?? 0, imagen_url: p.imagen_url ?? '', activo: p.activo ?? true,
  })), ['nombre', 'descripcion', 'precio_base', 'descuento', 'imagen_url', 'activo'])

  escribir('materiales.xlsx', materiales.map((m) => ({
    codigo: m.codigo ?? '', nombre: m.nombre, descripcion: m.descripcion ?? '',
    unidad: m.unidad, categoria: m.categoria ?? '', stock_minimo: m.stock_minimo ?? 0,
    precio_referencia: m.precio_referencia ?? '', notas: m.notas ?? '', activo: m.activo ?? true,
  })), ['codigo', 'nombre', 'descripcion', 'unidad', 'categoria', 'stock_minimo', 'precio_referencia', 'notas', 'activo'])

  const datosFiscales = await fetchAll('datos_fiscales')
  escribir('datos_fiscales.xlsx', datosFiscales.map((d) => ({
    nombre: d.nombre ?? '', nif: d.nif ?? '', direccion: d.direccion ?? '',
    telefono: d.telefono ?? '', email: d.email ?? '', iban: d.iban ?? '',
  })), ['nombre', 'nif', 'direccion', 'telefono', 'email', 'iban'])

  const MEDIDAS_COLS = [
    'fecha_toma', 'altura_total', 'contorno_pecho', 'contorno_cintura', 'contorno_cadera',
    'talle_delantero', 'talle_espalda', 'ancho_espalda', 'ancho_pecho', 'separacion_pecho',
    'altura_pecho', 'largo_manga', 'contorno_sisa', 'contorno_brazo', 'contorno_codo',
    'contorno_muneca', 'largo_falda_delantero', 'largo_falda_trasero', 'contorno_cadera_alta',
    'vuelo_deseado', 'contorno_cuello', 'profundidad_escote_del', 'profundidad_escote_tras',
    'ancho_escote', 'altura_cintura_suelo', 'num_calzado', 'altura_con_zapato', 'notas',
  ]
  const medidasCliente = await fetchAll('medidas_cliente')
  escribir('medidas_cliente.xlsx', medidasCliente.map((m) => {
    const cli = mapCliente.get(m.cliente_id)
    const fila = { cliente: cli?.nombre ?? '', cliente_telefono: cli?.tel ?? '' }
    for (const col of MEDIDAS_COLS) fila[col] = m[col] ?? ''
    return fila
  }), ['cliente', 'cliente_telefono', ...MEDIDAS_COLS])

  // ---------- CONFIG ----------
  const categorias = await fetchAll('categorias_inventario')
  escribir('categorias_inventario.xlsx', categorias.map((c) => ({
    nombre: c.nombre, icono: c.icono ?? '', orden: c.orden ?? 0,
  })), ['nombre', 'icono', 'orden'])

  const unidades = await fetchAll('unidades_inventario')
  escribir('unidades_inventario.xlsx', unidades.map((u) => ({
    clave: u.clave, etiqueta: u.etiqueta, abreviatura: u.abreviatura, orden: u.orden ?? 0,
  })), ['clave', 'etiqueta', 'abreviatura', 'orden'])

  const config = await fetchAll('configuracion_app')
  escribir('configuracion_app.xlsx', config.map((c) => ({
    clave: c.clave, valor: c.valor ?? '', descripcion: c.descripcion ?? '',
  })), ['clave', 'valor', 'descripcion'])

  // ---------- TRANSACCIONAL / HISTÓRICO ----------
  escribir('encargos.xlsx', encargos.map((e) => ({
    numero: e.numero ?? '', cliente: mapCliente.get(e.cliente_id)?.nombre ?? '',
    cliente_telefono: mapCliente.get(e.cliente_id)?.tel ?? '', estado: e.estado,
    precio_total: e.precio_total ?? 0, fecha_encargo: e.fecha_encargo ?? '',
    fecha_entrega_estimada: e.fecha_entrega_estimada ?? '', fecha_entrega_real: e.fecha_entrega_real ?? '',
    codigo_corto: e.codigo_corto ?? '', notas: e.notas ?? '',
  })), ['numero', 'cliente', 'cliente_telefono', 'estado', 'precio_total', 'fecha_encargo', 'fecha_entrega_estimada', 'fecha_entrega_real', 'codigo_corto', 'notas'])

  const lineas = await fetchAll('encargo_lineas')
  escribir('encargo_lineas.xlsx', lineas.map((l) => ({
    encargo_numero: mapEncargo.get(l.encargo_id) ?? '', prenda: mapPrenda.get(l.prenda_id) ?? '',
    descripcion: l.descripcion ?? '', medidas_ajuste: json(l.medidas_ajuste),
    precio_unitario: l.precio_unitario, cantidad: l.cantidad, notas: l.notas ?? '',
  })), ['encargo_numero', 'prenda', 'descripcion', 'medidas_ajuste', 'precio_unitario', 'cantidad', 'notas'])

  const pagos = await fetchAll('pagos')
  escribir('pagos.xlsx', pagos.map((p) => ({
    encargo_numero: mapEncargo.get(p.encargo_id) ?? '', fecha: p.fecha, importe: p.importe,
    tipo: p.tipo ?? '', forma_pago: p.forma_pago ?? '', referencia: p.referencia ?? '',
    estado: p.estado, fecha_vencimiento: p.fecha_vencimiento ?? '', notas: p.notas ?? '',
  })), ['encargo_numero', 'fecha', 'importe', 'tipo', 'forma_pago', 'referencia', 'estado', 'fecha_vencimiento', 'notas'])

  const pagosProv = await fetchAll('pagos_proveedor')
  escribir('pagos_proveedor.xlsx', pagosProv.map((p) => ({
    proveedor: mapProveedor.get(p.proveedor_id) ?? '', fecha: p.fecha, concepto: p.concepto,
    importe: p.importe, forma_pago: p.forma_pago ?? '', referencia: p.referencia ?? '',
    categoria: p.categoria ?? '', base_imponible: p.base_imponible ?? '',
    iva_porcentaje: p.iva_porcentaje ?? '', iva_importe: p.iva_importe ?? '', estado: p.estado,
    notas: p.notas ?? '',
  })), ['proveedor', 'fecha', 'concepto', 'importe', 'forma_pago', 'referencia', 'categoria', 'base_imponible', 'iva_porcentaje', 'iva_importe', 'estado', 'notas'])

  const movimientos = await fetchAll('movimientos_inventario')
  escribir('movimientos_inventario.xlsx', movimientos.map((m) => ({
    material: mapMaterial.get(m.material_id) ?? '', tipo: m.tipo, cantidad: m.cantidad,
    precio_unitario: m.precio_unitario ?? '', proveedor: mapProveedor.get(m.proveedor_id) ?? '',
    encargo_numero: mapEncargo.get(m.encargo_id) ?? '', fecha: m.fecha, motivo: m.motivo ?? '',
    notas: m.notas ?? '',
  })), ['material', 'tipo', 'cantidad', 'precio_unitario', 'proveedor', 'encargo_numero', 'fecha', 'motivo', 'notas'])

  const citas = await fetchAll('citas')
  escribir('citas.xlsx', citas.map((c) => ({
    cliente: mapCliente.get(c.cliente_id)?.nombre ?? c.cliente_nombre ?? '',
    cliente_telefono: mapCliente.get(c.cliente_id)?.tel ?? '', tipo: c.tipo,
    inicio: c.inicio ?? '', fin: c.fin ?? '', notas: c.notas ?? '',
  })), ['cliente', 'cliente_telefono', 'tipo', 'inicio', 'fin', 'notas'])

  const histEstados = await fetchAll('historial_estados')
  escribir('historial_estados.xlsx', histEstados.map((h) => ({
    encargo_numero: mapEncargo.get(h.encargo_id) ?? '', estado_anterior: h.estado_anterior ?? '',
    estado_nuevo: h.estado_nuevo, fecha: h.fecha ?? '', notas: h.notas ?? '',
  })), ['encargo_numero', 'estado_anterior', 'estado_nuevo', 'fecha', 'notas'])

  const histEncargo = await fetchAll('historial_encargo')
  escribir('historial_encargo.xlsx', histEncargo.map((h) => ({
    encargo_numero: mapEncargo.get(h.encargo_id) ?? '', fecha: h.fecha ?? '', descripcion: h.descripcion,
  })), ['encargo_numero', 'fecha', 'descripcion'])

  console.log('\nListo.')
}

main().catch((e) => {
  console.error('\nError:', e.message)
  process.exit(1)
})
