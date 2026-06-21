import { supabase } from '@/lib/supabase'
import { escaparBusqueda } from '@/utils/validators'

export async function fetchClientes(query = '') {
  let q = supabase
    .from('clientes')
    .select('id, nombre, apellidos, alias, telefono, email, notas, created_at')
    .order('nombre', { ascending: true })

  if (query.trim()) {
    const term = escaparBusqueda(query)
    q = q.or(`nombre.ilike.%${term}%,apellidos.ilike.%${term}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchCliente(id) {
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id, nombre, apellidos, alias, telefono, email, medidas_base, notas, created_at,
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

export async function crearCliente({ nombre, apellidos, alias, telefono, email, medidas_base, notas }) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre,
      apellidos: apellidos || null,
      alias: alias || null,
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

export async function fetchMedidasCliente(clienteId) {
  const { data, error } = await supabase
    .from('medidas_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function guardarMedidasCliente(clienteId, datos) {
  const { error } = await supabase
    .from('medidas_cliente')
    .upsert(
      { ...datos, cliente_id: clienteId, updated_at: new Date().toISOString() },
      { onConflict: 'cliente_id' }
    )
  if (error) throw error
}

export async function eliminarCliente(id) {
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
