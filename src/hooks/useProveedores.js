import { supabase } from '@/lib/supabase'

export async function fetchProveedores(query = '') {
  let q = supabase
    .from('proveedores')
    .select('id, nombre, contacto, telefono, email, notas, created_at')
    .order('nombre', { ascending: true })

  if (query.trim()) {
    q = q.ilike('nombre', `%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchProveedor(id) {
  const { data, error } = await supabase
    .from('proveedores')
    .select(`
      id, nombre, contacto, telefono, email, notas, created_at,
      pagos_proveedor (id, fecha, concepto, importe, forma_pago, referencia),
      inventario (id, nombre, stock, stock_minimo, unidad)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function crearProveedor({ nombre, contacto, telefono, email, notas }) {
  const { data, error } = await supabase
    .from('proveedores')
    .insert({
      nombre,
      contacto: contacto || null,
      telefono: telefono || null,
      email: email || null,
      notas: notas || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarProveedor(id, campos) {
  const { error } = await supabase
    .from('proveedores')
    .update(campos)
    .eq('id', id)
  if (error) throw error
}

export async function eliminarProveedor(id) {
  const { data: pagos } = await supabase
    .from('pagos_proveedor')
    .select('id')
    .eq('proveedor_id', id)
    .limit(1)
  if (pagos?.length > 0) {
    throw new Error('No se puede eliminar un proveedor con pagos asociados.')
  }
  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) throw error
}
