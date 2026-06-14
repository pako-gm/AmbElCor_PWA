import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Configuración global del CRM almacenada en la tabla key-value `configuracion_app`.
// Pensada para crecer con nuevos ajustes sin migraciones adicionales.
export function useConfiguracion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Devuelve un objeto plano { clave: valor } con toda la configuración.
  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('configuracion_app')
        .select('clave, valor')
      if (err) throw err
      return Object.fromEntries((data ?? []).map(({ clave, valor }) => [clave, valor]))
    } catch (e) {
      setError(e.message)
      return {}
    } finally {
      setLoading(false)
    }
  }, [])

  const guardarConfig = useCallback(async (clave, valor) => {
    const { error: err } = await supabase
      .from('configuracion_app')
      .upsert(
        { clave, valor: String(valor), updated_at: new Date().toISOString() },
        { onConflict: 'clave' }
      )
    if (err) throw err
  }, [])

  // Sube el precio_base de todas las prendas del catálogo un `pct` por ciento.
  // Devuelve el número de prendas actualizadas.
  const aplicarIncrementoCatalogo = useCallback(async (pct) => {
    const factor = 1 + (Number(pct) || 0) / 100
    const { data: prendas, error: err } = await supabase
      .from('prendas_catalogo')
      .select('id, precio_base')
    if (err) throw err

    const actualizaciones = (prendas ?? [])
      .filter(p => p.precio_base != null)
      .map(p => ({
        id: p.id,
        precio_base: Math.round(Number(p.precio_base) * factor * 100) / 100,
      }))

    for (const { id, precio_base } of actualizaciones) {
      const { error: upErr } = await supabase
        .from('prendas_catalogo')
        .update({ precio_base })
        .eq('id', id)
      if (upErr) throw upErr
    }
    return actualizaciones.length
  }, [])

  return { loading, error, fetchConfig, guardarConfig, aplicarIncrementoCatalogo }
}
