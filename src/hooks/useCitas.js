import { supabase } from '@/lib/supabase'

export async function fetchCitas({ inicio, fin }) {
  const { data, error } = await supabase
    .from('citas')
    .select(`
      id, cliente_id, cliente_nombre, tipo, inicio, fin, notas, created_at,
      clientes (id, nombre, apellidos)
    `)
    .gte('inicio', inicio)
    .lt('fin', fin)
    .order('inicio', { ascending: true })

  if (error) throw error
  return data
}

export async function crearCita({ cliente_id, cliente_nombre, tipo, inicio, fin, notas }) {
  const { data, error } = await supabase
    .from('citas')
    .insert({
      cliente_id,
      cliente_nombre,
      tipo,
      inicio,
      fin,
      notas,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function actualizarCita(id, { cliente_id, cliente_nombre, tipo, inicio, fin, notas }) {
  const { data, error } = await supabase
    .from('citas')
    .update({
      cliente_id,
      cliente_nombre,
      tipo,
      inicio,
      fin,
      notas,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function eliminarCita(id) {
  const { error } = await supabase.from('citas').delete().eq('id', id)
  if (error) throw error
}
