import { supabase } from '@/lib/supabase'

export async function fetchPrendasCatalogo() {
  const { data, error } = await supabase
    .from('prendas_catalogo')
    .select('id, nombre, descripcion, precio_base, descuento, activo')
    .order('nombre')
  if (error) throw error
  return data
}

export async function fetchPrenda(id) {
  const { data, error } = await supabase
    .from('prendas_catalogo')
    .select('id, nombre, descripcion, precio_base, descuento, activo')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
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
