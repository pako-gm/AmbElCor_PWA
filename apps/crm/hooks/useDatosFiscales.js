import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Datos fiscales del emisor (Carmen) almacenados en la tabla `datos_fiscales`.
// Es una tabla de fila única: se usa en los PDFs de presupuesto y factura.
export function useDatosFiscales() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Devuelve la fila de datos fiscales (o {} si aún no existe).
  const fetchDatosFiscales = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('datos_fiscales')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (err) throw err
      return data ?? {}
    } catch (e) {
      setError(e.message)
      return {}
    } finally {
      setLoading(false)
    }
  }, [])

  // Guarda los datos fiscales. Actualiza la fila existente o crea una nueva.
  const guardarDatosFiscales = useCallback(async (datos) => {
    const { id, created_at, ...campos } = datos
    const fila = id ? { id, ...campos } : campos
    const { data, error: err } = await supabase
      .from('datos_fiscales')
      .upsert(fila)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  return { loading, error, fetchDatosFiscales, guardarDatosFiscales }
}
