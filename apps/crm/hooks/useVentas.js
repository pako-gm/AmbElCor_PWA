import { supabase } from '@/lib/supabase'

// Prendas de catálogo vendibles directamente (tipo_uso 'solo_venta' o 'ambos'),
// enriquecidas con el stock y coste (PMP) actuales de su material de stock enlazado.
export async function fetchPrendasVendibles() {
  const { data: prendas, error } = await supabase
    .from('prendas_catalogo')
    .select('id, nombre, descripcion, precio_base, material_id')
    .eq('activo', true)
    .in('tipo_uso', ['solo_venta', 'ambos'])
    .order('nombre')
  if (error) throw error
  if (!prendas?.length) return []

  const materialIds = [...new Set(prendas.map(p => p.material_id).filter(Boolean))]
  if (materialIds.length === 0) return []

  const { data: stock, error: errStock } = await supabase
    .from('vista_stock_materiales')
    .select('id, nombre, unidad, stock_actual, precio_referencia')
    .in('id', materialIds)
  if (errStock) throw errStock

  const stockPorMaterial = Object.fromEntries((stock ?? []).map(s => [s.id, s]))

  return prendas
    .filter(p => stockPorMaterial[p.material_id])
    .map(p => {
      const s = stockPorMaterial[p.material_id]
      return {
        id: p.id,
        nombre: p.nombre,
        precio_base: p.precio_base,
        material_id: p.material_id,
        material_nombre: s.nombre,
        unidad: s.unidad,
        stock_actual: parseFloat(s.stock_actual) || 0,
        precio_referencia: parseFloat(s.precio_referencia) || 0,
      }
    })
}

export async function fetchVentas({ desde, hasta, clienteId } = {}) {
  let q = supabase
    .from('ventas')
    .select('id, numero, fecha, forma_pago, total, estado, notas, clientes ( id, nombre, apellidos ), venta_lineas ( count )')
    .order('fecha', { ascending: false })
    .order('numero', { ascending: false })
  if (desde) q = q.gte('fecha', desde)
  if (hasta) q = q.lte('fecha', hasta)
  if (clienteId) q = q.eq('cliente_id', clienteId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(v => ({ ...v, num_lineas: v.venta_lineas?.[0]?.count ?? 0 }))
}

export async function fetchVenta(id) {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      id, numero, fecha, forma_pago, total, notas, estado, created_at,
      clientes ( id, nombre, apellidos ),
      venta_lineas (
        id, cantidad, descripcion, precio_unitario_venta, precio_unitario_coste, notas,
        prendas_catalogo ( id, nombre ),
        materiales ( id, nombre, unidad )
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Crea una venta tipo ticket: verifica stock, calcula coste (snapshot del PMP actual)
// y total, e inserta cabecera + líneas + un movimiento de salida de stock por línea.
// Inserts secuenciales (sin transacción real, mismo patrón que registrarEntrada en useInventario.js):
// si algo falla tras crear la cabecera, se intenta borrar la venta para no dejar huérfanos.
export async function crearVenta({ cliente_id, fecha, forma_pago, notas, lineas }) {
  if (!lineas?.length) throw new Error('La venta debe tener al menos una línea.')

  const cantidadPorMaterial = {}
  for (const l of lineas) {
    cantidadPorMaterial[l.material_id] = (cantidadPorMaterial[l.material_id] || 0) + parseFloat(l.cantidad)
  }
  const materialIds = Object.keys(cantidadPorMaterial)

  const { data: stock, error: errStock } = await supabase
    .from('vista_stock_materiales')
    .select('id, nombre, stock_actual, precio_referencia')
    .in('id', materialIds)
  if (errStock) throw errStock
  const stockPorMaterial = Object.fromEntries((stock ?? []).map(s => [s.id, s]))

  for (const materialId of materialIds) {
    const s = stockPorMaterial[materialId]
    const disponible = parseFloat(s?.stock_actual) || 0
    const solicitado = cantidadPorMaterial[materialId]
    if (solicitado > disponible) {
      throw new Error(`Stock insuficiente de "${s?.nombre ?? materialId}": disponible ${disponible}, solicitado ${solicitado}.`)
    }
  }

  const lineasConCoste = lineas.map(l => ({
    ...l,
    precio_unitario_coste: parseFloat(stockPorMaterial[l.material_id]?.precio_referencia) || 0,
  }))
  const total = lineasConCoste.reduce((sum, l) => sum + parseFloat(l.cantidad) * parseFloat(l.precio_unitario_venta), 0)

  const { data: venta, error: errVenta } = await supabase
    .from('ventas')
    .insert({
      cliente_id: cliente_id || null,
      fecha: fecha ?? new Date().toISOString().slice(0, 10),
      forma_pago,
      total,
      notas: notas || null,
    })
    .select()
    .single()
  if (errVenta) throw errVenta

  try {
    const { error: errLineas } = await supabase
      .from('venta_lineas')
      .insert(lineasConCoste.map(l => ({
        venta_id: venta.id,
        prenda_id: l.prenda_id,
        material_id: l.material_id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario_venta: l.precio_unitario_venta,
        precio_unitario_coste: l.precio_unitario_coste,
        notas: l.notas || null,
      })))
    if (errLineas) throw errLineas

    for (const materialId of materialIds) {
      const { error: errMov } = await supabase
        .from('movimientos_inventario')
        .insert({
          material_id: materialId,
          tipo: 'salida',
          cantidad: cantidadPorMaterial[materialId],
          venta_id: venta.id,
          fecha: venta.fecha,
          motivo: `Venta ${venta.numero}`,
        })
      if (errMov) throw errMov
    }
  } catch (e) {
    await supabase.from('ventas').delete().eq('id', venta.id)
    throw e
  }

  return venta
}

// Edita cabecera + líneas de una venta ya registrada. Revierte y recrea los
// movimientos de stock de salida de forma atómica (función RPC editar_venta):
// si hay stock insuficiente para las nuevas cantidades, no cambia nada.
export async function editarVenta(id, { cliente_id, fecha, forma_pago, notas, lineas }) {
  if (!lineas?.length) throw new Error('La venta debe tener al menos una línea.')

  const { data, error } = await supabase.rpc('editar_venta', {
    p_venta_id: id,
    p_cliente_id: cliente_id || null,
    p_fecha: fecha,
    p_forma_pago: forma_pago,
    p_notas: notas || null,
    p_lineas: lineas.map(l => ({
      prenda_id: l.prenda_id,
      material_id: l.material_id,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precio_unitario_venta: l.precio_unitario_venta,
    })),
  })
  if (error) throw error
  return data
}
