import { supabase } from '@/lib/supabase'

export async function fetchPrendasCatalogo() {
  const { data, error } = await supabase
    .from('prendas_catalogo')
    .select('id, nombre, descripcion, precio_base, activo, tipo_uso, material_id')
    .order('nombre')
  if (error) throw error
  return data
}

export async function fetchPrenda(id) {
  const { data, error } = await supabase
    .from('prendas_catalogo')
    .select('id, nombre, descripcion, precio_base, activo, tipo_uso, material_id, materiales:material_id ( id, nombre, unidad )')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Materiales de reventa disponibles para enlazar a una prenda vendible del catálogo.
export async function fetchMaterialesVendibles() {
  const { data, error } = await supabase
    .from('vista_stock_materiales')
    .select('id, codigo, nombre, unidad, activo, tipo, precio_referencia, stock_actual')
    .eq('tipo', 'producto_reventa')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return (data ?? []).map(m => ({
    ...m,
    precio_referencia: parseFloat(m.precio_referencia) || 0,
    stock_actual: parseFloat(m.stock_actual) || 0,
  }))
}

export async function crearPrenda(prenda) {
  const { data, error } = await supabase
    .from('prendas_catalogo')
    .insert([prenda])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarPrenda(id, cambios) {
  const { error } = await supabase
    .from('prendas_catalogo')
    .update(cambios)
    .eq('id', id)
  if (error) throw error
}

export async function toggleActivoPrenda(id, activo) {
  const { error } = await supabase
    .from('prendas_catalogo')
    .update({ activo })
    .eq('id', id)
  if (error) throw error
}
