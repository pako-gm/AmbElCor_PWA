import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import MOCK from '@/mockData.json'

const IS_MOCK = import.meta.env.VITE_USE_MOCKS === 'true'

const mesesTrimestre = {
  1: ['01', '02', '03'],
  2: ['04', '05', '06'],
  3: ['07', '08', '09'],
  4: ['10', '11', '12'],
}

function rangoTrimestre(año, trimestre) {
  const meses = mesesTrimestre[trimestre]
  const desde = `${año}-${meses[0]}-01`
  const hasta = `${año}-${meses[2]}-31`
  return { desde, hasta }
}

function filtrarPorPeriodo(arr, { año, trimestre } = {}) {
  return arr.filter(r => {
    const fecha = r.fecha
    if (!fecha) return true
    if (año && trimestre) {
      const { desde, hasta } = rangoTrimestre(año, trimestre)
      return fecha >= desde && fecha <= hasta
    }
    if (año) {
      return fecha.startsWith(`${año}`)
    }
    return true
  })
}

export function useContabilidad() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Cobros ────────────────────────────────────────────────────────────────

  const fetchCobros = useCallback(async ({ año, trimestre } = {}) => {
    if (IS_MOCK) {
      return filtrarPorPeriodo(MOCK.cobros, { año, trimestre })
    }

    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('pagos')
        .select(`
          id, fecha, importe, tipo, forma_pago, referencia, notas,
          encargos ( id, numero, cliente_id,
            clientes ( nombre, apellidos )
          )
        `)
        .order('fecha', { ascending: false })

      if (año && trimestre) {
        const { desde, hasta } = rangoTrimestre(año, trimestre)
        q = q.gte('fecha', desde).lte('fecha', hasta)
      } else if (año) {
        q = q.gte('fecha', `${año}-01-01`).lte('fecha', `${año}-12-31`)
      }

      const { data, error: err } = await q
      if (err) throw err
      return data ?? []
    } catch (e) {
      setError(e.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Pagos proveedor ───────────────────────────────────────────────────────

  const fetchPagosProveedor = useCallback(async ({ año, trimestre } = {}) => {
    if (IS_MOCK) {
      return filtrarPorPeriodo(MOCK.pagosProveedor, { año, trimestre })
    }

    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('pagos_proveedor')
        .select(`
          id, fecha, concepto, importe, forma_pago, referencia, notas,
          categoria, base_imponible, iva_porcentaje, iva_importe,
          proveedores ( id, nombre )
        `)
        .order('fecha', { ascending: false })

      if (año && trimestre) {
        const { desde, hasta } = rangoTrimestre(año, trimestre)
        q = q.gte('fecha', desde).lte('fecha', hasta)
      } else if (año) {
        q = q.gte('fecha', `${año}-01-01`).lte('fecha', `${año}-12-31`)
      }

      const { data, error: err } = await q
      if (err) throw err
      return data ?? []
    } catch (e) {
      setError(e.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const registrarPagoProveedor = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('pagos_proveedor')
      .insert(payload)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const eliminarPagoProveedor = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('pagos_proveedor')
      .delete()
      .eq('id', id)
    if (err) throw err
  }, [])

  // ── Proveedores ───────────────────────────────────────────────────────────

  const fetchProveedores = useCallback(async () => {
    if (IS_MOCK) {
      return MOCK.proveedores.map(p => ({ id: p.id, nombre: p.nombre }))
    }

    const { data, error: err } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .order('nombre')
    if (err) throw err
    return data ?? []
  }, [])

  const crearProveedor = useCallback(async ({ nombre, telefono, email }) => {
    const { data, error: err } = await supabase
      .from('proveedores')
      .insert({ nombre, telefono, email })
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  // ── Resumen por categoría ────────────────────────────────────────────────

  const fetchResumenPorCategoria = useCallback(async (año, trimestre) => {
    const pagos = await fetchPagosProveedor({ año, trimestre })
    const mapa = {}
    pagos.forEach(p => {
      const cat = p.categoria ?? 'otros'
      mapa[cat] = (mapa[cat] ?? 0) + parseFloat(p.importe || 0)
    })
    return Object.entries(mapa)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
  }, [fetchPagosProveedor])

  // ── Resumen anual para Reportes ───────────────────────────────────────────

  const fetchResumenAnual = useCallback(async (año) => {
    if (IS_MOCK) {
      return MOCK.resumenAnual
    }

    const desde = `${año}-01-01`
    const hasta = `${año}-12-31`

    const [{ data: cobros }, { data: pagos }] = await Promise.all([
      supabase
        .from('pagos')
        .select('fecha, importe')
        .gte('fecha', desde)
        .lte('fecha', hasta),
      supabase
        .from('pagos_proveedor')
        .select('fecha, importe')
        .gte('fecha', desde)
        .lte('fecha', hasta),
    ])

    // Agrupar por mes (1-12)
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      cobros: 0,
      gastos: 0,
    }))

    ;(cobros ?? []).forEach(({ fecha, importe }) => {
      const mes = new Date(fecha).getMonth() // 0-based
      meses[mes].cobros += parseFloat(importe) || 0
    })
    ;(pagos ?? []).forEach(({ fecha, importe }) => {
      const mes = new Date(fecha).getMonth()
      meses[mes].gastos += parseFloat(importe) || 0
    })

    return meses
  }, [])

  return {
    loading,
    error,
    fetchCobros,
    fetchPagosProveedor,
    registrarPagoProveedor,
    eliminarPagoProveedor,
    fetchProveedores,
    crearProveedor,
    fetchResumenAnual,
    fetchResumenPorCategoria,
  }
}
