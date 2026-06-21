import { supabase } from '@/lib/supabase'
import { formatImporte, ESTADO_LABELS } from '@/utils/formatters'

const registrarHistorial = (encargo_id, descripcion) =>
  supabase.from('historial_encargo').insert({ encargo_id, descripcion })

// Lista de encargos con datos del cliente
export async function fetchEncargos({ estado, excludeEntregados = false } = {}) {
  let query = supabase
    .from('encargos')
    .select(`
      id, numero, estado, precio_total, fecha_encargo, fecha_entrega_estimada, fecha_entrega_real, codigo_corto,
      clientes (id, nombre, apellidos),
      encargo_lineas (id)
    `)
    .order('numero', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  else if (excludeEntregados) query = query.neq('estado', 'entregado')

  const { data, error } = await query
  if (error) throw error
  return data
}

// Detalle de un encargo completo
export async function fetchEncargo(id) {
  const { data, error } = await supabase
    .from('encargos')
    .select(`
      id, numero, estado, precio_total, fecha_encargo, fecha_entrega_estimada, fecha_entrega_real,
      token_publico, codigo_corto, notas,
      clientes (id, nombre, apellidos, telefono, email),
      encargo_lineas (
        id, descripcion, cantidad, precio_unitario, medidas_ajuste, notas,
        prendas_catalogo (id, nombre)
      ),
      historial_encargo (id, fecha, descripcion),
      pagos (id, fecha, importe, tipo, forma_pago, referencia, notas, estado, fecha_vencimiento)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Crear encargo con sus líneas
export async function crearEncargo({ cliente_id, fecha_entrega_estimada, notas, lineas }) {
  const precio_total = lineas.reduce(
    (sum, l) => sum + (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1),
    0
  )

  const { data: encargo, error } = await supabase
    .from('encargos')
    .insert({ cliente_id, fecha_entrega_estimada: fecha_entrega_estimada || null, notas, precio_total })
    .select()
    .single()
  if (error) throw error

  if (lineas.length > 0) {
    const lineasData = lineas.map(l => ({
      encargo_id: encargo.id,
      prenda_id: l.prenda_id || null,
      descripcion: l.descripcion,
      cantidad: parseInt(l.cantidad) || 1,
      precio_unitario: parseFloat(l.precio_unitario) || 0,
      medidas_ajuste: l.medidas_ajuste ? { notas: l.medidas_ajuste } : {},
      notas: l.notas || null,
    }))
    const { error: lineasError } = await supabase.from('encargo_lineas').insert(lineasData)
    if (lineasError) throw lineasError
  }

  await registrarHistorial(encargo.id, 'Encargo creado')

  return encargo
}

// Avanzar estado de un encargo
export async function avanzarEstado(id, estadoAnterior, estadoNuevo) {
  const { error: updateError } = await supabase
    .from('encargos')
    .update({ estado: estadoNuevo, ...(estadoNuevo === 'entregado' ? { fecha_entrega_real: new Date().toISOString().split('T')[0] } : {}) })
    .eq('id', id)
  if (updateError) throw updateError

  await supabase.from('historial_estados').insert({
    encargo_id: id,
    estado_anterior: estadoAnterior,
    estado_nuevo: estadoNuevo,
  })

  await registrarHistorial(id, `Estado: ${ESTADO_LABELS[estadoAnterior]} → ${ESTADO_LABELS[estadoNuevo]}`)
}

// Registrar pago de un encargo
export async function registrarPago({ encargo_id, fecha, importe, tipo, forma_pago, referencia, notas, estado, fecha_vencimiento }) {
  const { data, error } = await supabase
    .from('pagos')
    .insert({
      encargo_id, fecha, importe: parseFloat(importe), tipo, forma_pago,
      referencia: referencia || null, notas: notas || null,
      estado: estado || 'cobrado',
      fecha_vencimiento: estado === 'pendiente' ? (fecha_vencimiento || null) : null,
    })
    .select()
    .single()
  if (error) throw error

  await registrarHistorial(encargo_id, `Pago registrado: ${formatImporte(parseFloat(importe))}`)

  return data
}

// Actualizar pago
export async function actualizarPago(id, cambios) {
  const { error } = await supabase.from('pagos').update({
    fecha: cambios.fecha,
    importe: parseFloat(cambios.importe),
    tipo: cambios.tipo,
    forma_pago: cambios.forma_pago,
    referencia: cambios.referencia || null,
    estado: cambios.estado || 'cobrado',
    fecha_vencimiento: cambios.estado === 'pendiente' ? (cambios.fecha_vencimiento || null) : null,
  }).eq('id', id)
  if (error) throw error
}

// Eliminar pago
export async function eliminarPago(id, encargo_id, importe) {
  const { error } = await supabase.from('pagos').delete().eq('id', id)
  if (error) throw error

  if (encargo_id) {
    await registrarHistorial(encargo_id, `Pago eliminado: ${formatImporte(parseFloat(importe))}`)
  }
}

// Eliminar encargo y todo lo relacionado
export async function eliminarEncargo(id) {
  await supabase.from('historial_encargo').delete().eq('encargo_id', id)
  await supabase.from('historial_estados').delete().eq('encargo_id', id)
  await supabase.from('encargo_lineas').delete().eq('encargo_id', id)
  await supabase.from('pagos').delete().eq('encargo_id', id)
  const { error } = await supabase.from('encargos').delete().eq('id', id)
  if (error) throw error
}

// Buscar clientes
export async function buscarClientes(query) {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, apellidos, telefono')
    .or(`nombre.ilike.%${query}%,apellidos.ilike.%${query}%`)
    .limit(8)
  if (error) throw error
  return data
}

export async function fetchTodosClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, apellidos, telefono')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data
}

// Crear cliente rápido
export async function crearClienteRapido({ nombre, apellidos, telefono, email }) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({ nombre, apellidos: apellidos || null, telefono: telefono || null, email: email || null })
    .select()
    .single()
  if (error) throw error
  return data
}

// Eliminar línea de encargo y recalcular total
export async function eliminarLinea(lineaId, encargoId, descripcion) {
  const { error } = await supabase.from('encargo_lineas').delete().eq('id', lineaId)
  if (error) throw error
  const { data: lineas } = await supabase.from('encargo_lineas').select('cantidad, precio_unitario').eq('encargo_id', encargoId)
  const total = (lineas || []).reduce((s, l) => s + (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1), 0)
  await supabase.from('encargos').update({ precio_total: total }).eq('id', encargoId)
  await registrarHistorial(encargoId, `Prenda eliminada: ${descripcion || 'sin descripción'}`)
}

// Actualizar línea de encargo y recalcular total
export async function actualizarLinea(lineaId, encargoId, cambios) {
  const update = {
    cantidad: parseInt(cambios.cantidad) || 1,
    precio_unitario: parseFloat(cambios.precio_unitario) || 0,
    medidas_ajuste: cambios.medidas_ajuste ? { notas: cambios.medidas_ajuste } : {},
    notas: cambios.notas || null,
  }
  if (cambios.prenda_id !== undefined) update.prenda_id = cambios.prenda_id || null
  if (cambios.descripcion !== undefined) update.descripcion = cambios.descripcion
  const { error } = await supabase.from('encargo_lineas').update(update).eq('id', lineaId)
  if (error) throw error
  const { data: lineas } = await supabase.from('encargo_lineas').select('cantidad, precio_unitario').eq('encargo_id', encargoId)
  const total = (lineas || []).reduce((s, l) => s + (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1), 0)
  await supabase.from('encargos').update({ precio_total: total }).eq('id', encargoId)
}

// Agregar línea a encargo y recalcular total
export async function agregarLinea(encargoId, linea) {
  const { error } = await supabase.from('encargo_lineas').insert({
    encargo_id: encargoId,
    prenda_id: linea.prenda_id || null,
    descripcion: linea.descripcion,
    cantidad: parseInt(linea.cantidad) || 1,
    precio_unitario: parseFloat(linea.precio_unitario) || 0,
    medidas_ajuste: linea.medidas_ajuste ? { notas: linea.medidas_ajuste } : {},
    notas: linea.notas || null,
  })
  if (error) throw error
  const { data: lineas } = await supabase.from('encargo_lineas').select('cantidad, precio_unitario').eq('encargo_id', encargoId)
  const total = (lineas || []).reduce((s, l) => s + (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1), 0)
  await supabase.from('encargos').update({ precio_total: total }).eq('id', encargoId)
  await registrarHistorial(encargoId, `Prenda añadida: ${linea.descripcion}`)
}

// Actualizar fechas de un encargo
export async function updateFechasEncargo(id, fecha_encargo, fecha_entrega_estimada) {
  const fmt = d => d.toISOString().split('T')[0]
  const { error } = await supabase
    .from('encargos')
    .update({ fecha_encargo: fmt(fecha_encargo), fecha_entrega_estimada: fmt(fecha_entrega_estimada) })
    .eq('id', id)
  if (error) throw error
  await registrarHistorial(id, `Fechas actualizadas: inicio ${fmt(fecha_encargo)}, entrega ${fmt(fecha_entrega_estimada)}`)
}

// Catálogo de prendas activas
export async function fetchCatalogo() {
  const { data, error } = await supabase
    .from('prendas_catalogo')
    .select('id, nombre, precio_base, descuento')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data
}
