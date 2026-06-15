/**
 * Carga en Supabase los Excel de DESIGN/CARGA_DATOS/, REEMPLAZANDO los datos
 * existentes (ficticios) por los de los .xlsx. Resuelve las claves naturales
 * (cliente, proveedor, prenda, material, encargo_numero) de vuelta a UUID.
 *
 * Uso:
 *   npm run cargar:datos                  # simulación (dry-run) de todas las tablas
 *   npm run cargar:datos -- --apply       # aplica de verdad (borra e inserta)
 *   npm run cargar:datos clientes         # solo una tabla (dry-run)
 *   npm run cargar:datos clientes --apply # solo una tabla, aplicando
 *
 * ⚠️ DESTRUCTIVO con --apply: vacía cada tabla antes de insertar.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const IN_DIR = path.join(root, 'DESIGN', 'CARGA_DATOS')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // proxy/SSL corporativo (ver export script)

// --- args ---
const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const soloTabla = args.find((a) => !a.startsWith('--'))

// --- env ---
function parseEnv(file) {
  const env = {}
  if (!fs.existsSync(file)) return env
  for (const linea of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (!m || linea.trim().startsWith('#')) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[m[1]] = v
  }
  return env
}
const env = parseEnv(path.join(root, '.env.local'))
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

// --- helpers ---
const nz = (v) => (v === '' || v === undefined ? null : v) // vacío -> null
const parseJson = (v) => {
  if (v == null || v === '') return {}
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return {} }
}
function leer(tabla) {
  const f = path.join(IN_DIR, `${tabla}.xlsx`)
  if (!fs.existsSync(f)) return null
  const wb = XLSX.read(fs.readFileSync(f), { type: 'buffer' })
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
}

// Mapas clave natural -> id (se refrescan tras cargar los maestros)
const maps = { cliente: new Map(), proveedor: new Map(), prenda: new Map(), material: new Map(), encargo: new Map() }
const normCli = (nombre, tel) => `${(nombre || '').trim().toLowerCase()}|${(tel || '').trim()}`

async function refrescarMapas() {
  const [cli, prov, pre, mat, enc] = await Promise.all([
    supabase.from('clientes').select('id,nombre,apellidos,telefono'),
    supabase.from('proveedores').select('id,nombre'),
    supabase.from('prendas_catalogo').select('id,nombre'),
    supabase.from('materiales').select('id,codigo,nombre'),
    supabase.from('encargos').select('id,numero'),
  ])
  maps.cliente.clear(); maps.proveedor.clear(); maps.prenda.clear(); maps.material.clear(); maps.encargo.clear()
  for (const c of cli.data ?? []) {
    const full = `${c.nombre ?? ''} ${c.apellidos ?? ''}`.trim()
    maps.cliente.set(normCli(full, c.telefono), c.id)        // con teléfono (preferente)
    maps.cliente.set(normCli(full, ''), c.id)                // y solo por nombre (fallback)
  }
  for (const p of prov.data ?? []) maps.proveedor.set((p.nombre || '').trim().toLowerCase(), p.id)
  for (const p of pre.data ?? []) maps.prenda.set((p.nombre || '').trim().toLowerCase(), p.id)
  for (const m of mat.data ?? []) maps.material.set(((m.codigo || m.nombre) || '').trim().toLowerCase(), m.id)
  for (const e of enc.data ?? []) maps.encargo.set((e.numero || '').trim(), e.id)
}
const idCliente = (n, t) => maps.cliente.get(normCli(n, t)) ?? maps.cliente.get(normCli(n, '')) ?? null
const idProv = (n) => maps.proveedor.get((n || '').trim().toLowerCase()) ?? null
const idPrenda = (n) => maps.prenda.get((n || '').trim().toLowerCase()) ?? null
const idMat = (n) => maps.material.get((n || '').trim().toLowerCase()) ?? null
const idEnc = (n) => maps.encargo.get((n || '').trim()) ?? null

// Transformadores: fila Excel -> registro BD. null => omitir la fila (FK no resuelta).
const TABLAS = {
  clientes: (r) => ({ nombre: r.nombre, apellidos: nz(r.apellidos), telefono: nz(r.telefono), email: nz(r.email), medidas_base: parseJson(r.medidas_base), notas: nz(r.notas) }),
  proveedores: (r) => ({ nombre: r.nombre, contacto: nz(r.contacto), telefono: nz(r.telefono), email: nz(r.email), notas: nz(r.notas) }),
  prendas_catalogo: (r) => ({ nombre: r.nombre, descripcion: nz(r.descripcion), precio_base: r.precio_base || 0, descuento: r.descuento || 0, imagen_url: nz(r.imagen_url), activo: r.activo !== false }),
  materiales: (r) => ({ codigo: nz(r.codigo), nombre: r.nombre, descripcion: nz(r.descripcion), unidad: r.unidad || 'unidad', categoria: nz(r.categoria), stock_minimo: r.stock_minimo || 0, precio_referencia: nz(r.precio_referencia), notas: nz(r.notas), activo: r.activo !== false }),
  datos_fiscales: (r) => ({ nombre: nz(r.nombre), nif: nz(r.nif), direccion: nz(r.direccion), telefono: nz(r.telefono), email: nz(r.email), iban: nz(r.iban) }),
  categorias_inventario: (r) => ({ nombre: r.nombre, icono: nz(r.icono) || 'box', orden: r.orden || 0 }),
  unidades_inventario: (r) => ({ clave: r.clave, etiqueta: r.etiqueta, abreviatura: r.abreviatura, orden: r.orden || 0 }),
  configuracion_app: (r) => ({ clave: r.clave, valor: nz(r.valor), descripcion: nz(r.descripcion) }),

  encargos: (r) => ({ numero: nz(r.numero), cliente_id: idCliente(r.cliente, r.cliente_telefono), estado: r.estado || 'presupuestado', precio_total: r.precio_total || 0, fecha_encargo: nz(r.fecha_encargo), fecha_entrega_estimada: nz(r.fecha_entrega_estimada), fecha_entrega_real: nz(r.fecha_entrega_real), codigo_corto: nz(r.codigo_corto), notas: nz(r.notas) }),
  encargo_lineas: (r) => { const id = idEnc(r.encargo_numero); return id ? { encargo_id: id, prenda_id: idPrenda(r.prenda), descripcion: nz(r.descripcion), medidas_ajuste: parseJson(r.medidas_ajuste), precio_unitario: r.precio_unitario || 0, cantidad: r.cantidad || 1, notas: nz(r.notas) } : null },
  pagos: (r) => { const id = idEnc(r.encargo_numero); return id ? { encargo_id: id, fecha: nz(r.fecha), importe: r.importe, tipo: nz(r.tipo), forma_pago: nz(r.forma_pago), referencia: nz(r.referencia), estado: r.estado || 'cobrado', fecha_vencimiento: nz(r.fecha_vencimiento), notas: nz(r.notas) } : null },
  pagos_proveedor: (r) => ({ proveedor_id: idProv(r.proveedor), fecha: nz(r.fecha), concepto: r.concepto, importe: r.importe, forma_pago: nz(r.forma_pago), referencia: nz(r.referencia), categoria: nz(r.categoria) || 'material', base_imponible: nz(r.base_imponible), iva_porcentaje: nz(r.iva_porcentaje), iva_importe: nz(r.iva_importe), estado: r.estado || 'pagado', notas: nz(r.notas) }),
  movimientos_inventario: (r) => { const id = idMat(r.material); return id ? { material_id: id, tipo: r.tipo, cantidad: r.cantidad, precio_unitario: nz(r.precio_unitario), proveedor_id: idProv(r.proveedor), encargo_id: idEnc(r.encargo_numero), fecha: nz(r.fecha), motivo: nz(r.motivo), notas: nz(r.notas) } : null },
  citas: (r) => ({ cliente_id: idCliente(r.cliente, r.cliente_telefono), cliente_nombre: nz(r.cliente), tipo: r.tipo, inicio: nz(r.inicio), fin: nz(r.fin), notas: nz(r.notas) }),
  medidas_cliente: (r) => { const id = idCliente(r.cliente, r.cliente_telefono); if (!id) return null; const out = { cliente_id: id }; for (const k of Object.keys(r)) { if (k === 'cliente' || k === 'cliente_telefono') continue; out[k] = nz(r[k]) } return out },
  historial_estados: (r) => { const id = idEnc(r.encargo_numero); return id ? { encargo_id: id, estado_anterior: nz(r.estado_anterior), estado_nuevo: r.estado_nuevo, fecha: nz(r.fecha), notas: nz(r.notas) } : null },
  historial_encargo: (r) => { const id = idEnc(r.encargo_numero); return id ? { encargo_id: id, fecha: nz(r.fecha), descripcion: r.descripcion } : null },
}

// Orden de carga (maestros -> encargos -> dependientes)
const ORDEN = [
  'clientes', 'proveedores', 'prendas_catalogo', 'materiales', 'datos_fiscales',
  'categorias_inventario', 'unidades_inventario', 'configuracion_app',
  'encargos',
  'encargo_lineas', 'pagos', 'citas', 'pagos_proveedor', 'movimientos_inventario',
  'medidas_cliente', 'historial_estados', 'historial_encargo',
]
const PK = { configuracion_app: 'clave' } // PK no-uuid para el borrado

async function cargarTabla(tabla) {
  const filas = leer(tabla)
  if (filas == null) { console.log(`  – ${tabla}: sin .xlsx, omitido`); return }

  const registros = []
  let descartadas = 0
  for (const r of filas) {
    const rec = TABLAS[tabla](r)
    if (rec == null) { descartadas++; continue }
    registros.push(rec)
  }

  const aviso = descartadas ? ` (${descartadas} descartadas por FK sin resolver)` : ''
  if (!APPLY) {
    console.log(`  [dry-run] ${tabla}: insertaría ${registros.length} filas${aviso}`)
    return
  }

  // Borrado total + inserción
  const pk = PK[tabla] || 'id'
  const del = await supabase.from(tabla).delete().not(pk, 'is', null)
  if (del.error) { console.log(`  ✗ ${tabla}: error al vaciar -> ${del.error.message}`); return }
  if (registros.length) {
    const ins = await supabase.from(tabla).insert(registros)
    if (ins.error) { console.log(`  ✗ ${tabla}: error al insertar -> ${ins.error.message}`); return }
  }
  console.log(`  ✓ ${tabla}: ${registros.length} filas cargadas${aviso}`)

  // Si cargamos un maestro/encargos, refrescamos mapas para las dependientes
  if (['clientes', 'proveedores', 'prendas_catalogo', 'materiales', 'encargos'].includes(tabla)) {
    await refrescarMapas()
  }
}

async function main() {
  console.log(`Cargando desde ${IN_DIR}  [${APPLY ? 'APLICAR' : 'DRY-RUN'}]\n`)
  await refrescarMapas()
  const lista = soloTabla ? [soloTabla] : ORDEN
  for (const t of lista) {
    if (!TABLAS[t]) { console.log(`  ? ${t}: tabla desconocida, omitida`); continue }
    await cargarTabla(t)
  }
  console.log(APPLY ? '\nCarga completada.' : '\nDry-run completado. Usa --apply para escribir.')
}

main().catch((e) => { console.error('\nError:', e.message); process.exit(1) })
