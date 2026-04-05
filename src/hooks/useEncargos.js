import { supabase } from '@/lib/supabase'

// Lista de encargos con datos del cliente
export async function fetchEncargos({ estado } = {}) {
  let query = supabase
    .from('encargos')
    .select(`
      id, numero, estado, precio_total, fecha_encargo, fecha_entrega_estimada, codigo_corto,
      clientes (id, nombre, apellidos),
      encargo_lineas (id)
    `)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

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
      historial_estados (id, estado_anterior, estado_nuevo, fecha, notas),
      pagos (id, fecha, importe, tipo, forma_pago, referencia, notas)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Crear encargo con sus líneas
export async function crearEncargo({ cliente_id, fecha_entrega_estimada, notas, lineas }) {
  // Calcular precio total
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
}

// Registrar pago de un encargo
export async function registrarPago({ encargo_id, fecha, importe, tipo, forma_pago, referencia, notas }) {
  const { data, error } = await supabase
    .from('pagos')
    .insert({ encargo_id, fecha, importe: parseFloat(importe), tipo, forma_pago, referencia: referencia || null, notas: notas || null })
    .select()
    .single()
  if (error) throw error
  return data
}

// Eliminar pago
export async function eliminarPago(id) {
  const { error } = await supabase.from('pagos').delete().eq('id', id)
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

// Crear cliente rápido
export async function crearClienteRapido({ nombre, apellidos, telefono }) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({ nombre, apellidos: apellidos || null, telefono: telefono || null })
    .select()
    .single()
  if (error) throw error
  return data
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
