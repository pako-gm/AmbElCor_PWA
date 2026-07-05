import { supabase } from '@/lib/supabase'

export async function fetchCitas({ inicio, fin }) {
  console.log('[useCitas] fetchCitas - cargando citas:', { inicio, fin })
  const { data, error } = await supabase
    .from('citas')
    .select(`
      id, cliente_id, cliente_nombre, tipo, inicio, fin, notas, created_at,
      clientes (id, nombre, apellidos)
    `)
    .gte('inicio', inicio)
    .lt('fin', fin)
    .order('inicio', { ascending: true })

  console.log('[useCitas] fetchCitas - respuesta:', { data, error })
  if (error) {
    console.error('[useCitas] fetchCitas - error:', error)
    throw error
  }
  console.log('[useCitas] fetchCitas - citas cargadas:', data?.length, 'citas')
  return data
}

export async function crearCita({ cliente_id, cliente_nombre, tipo, inicio, fin, notas }) {
  console.log('[useCitas] crearCita - entrada:', { cliente_id, cliente_nombre, tipo, inicio, fin, notas })
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

  console.log('[useCitas] crearCita - respuesta:', { data, error })
  if (error) {
    console.error('[useCitas] crearCita - error:', error)
    throw error
  }
  console.log('[useCitas] crearCita - éxito, data:', data)
  return data
}

export async function actualizarCita(id, { cliente_id, cliente_nombre, tipo, inicio, fin, notas }) {
  console.log('[useCitas] actualizarCita - entrada:', { id, cliente_id, cliente_nombre, tipo, inicio, fin, notas })
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

  console.log('[useCitas] actualizarCita - respuesta:', { data, error })
  if (error) {
    console.error('[useCitas] actualizarCita - error:', error)
    throw error
  }
  console.log('[useCitas] actualizarCita - éxito, data:', data)
  return data
}

export async function eliminarCita(id) {
  const { error } = await supabase.from('citas').delete().eq('id', id)
  if (error) throw error
}
