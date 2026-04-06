import { supabase } from '@/lib/supabase'

export async function fetchClientes(query = '') {
  let q = supabase
    .from('clientes')
    .select('id, nombre, apellidos, telefono, email, notas, created_at')
    .order('nombre', { ascending: true })

  if (query.trim()) {
    q = q.or(`nombre.ilike.%${query}%,apellidos.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchCliente(id) {
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id, nombre, apellidos, telefono, email, medidas_base, notas, created_at,
      encargos (
        id, numero, estado, precio_total, fecha_encargo, fecha_entrega_estimada,
        encargo_lineas (id)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function crearCliente({ nombre, apellidos, telefono, email, medidas_base, notas }) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre,
      apellidos: apellidos || null,
      telefono: telefono || null,
      email: email || null,
      medidas_base: medidas_base || null,
      notas: notas || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarCliente(id, campos) {
  const { error } = await supabase
    .from('clientes')
    .update(campos)
    .eq('id', id)
  if (error) throw error
}

export async function eliminarCliente(id) {
  // Verificar que no tenga encargos
  const { data: encargos } = await supabase
    .from('encargos')
    .select('id')
    .eq('cliente_id', id)
    .limit(1)
  if (encargos?.length > 0) {
    throw new Error('No se puede eliminar un cliente con encargos asociados.')
  }
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}
