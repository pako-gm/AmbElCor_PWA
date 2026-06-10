import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

export function useContabilidad() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Cobros ────────────────────────────────────────────────────────────────

  const fetchCobros = useCallback(async ({ año, trimestre } = {}) => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('pagos')
        .select(`
          id, fecha, importe, tipo, forma_pago, referencia, notas,
          estado, fecha_vencimiento,
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

  const marcarEstadoCobro = useCallback(async (id, estado) => {
    const { error: err } = await supabase
      .from('pagos')
      .update({ estado })
      .eq('id', id)
    if (err) throw err
  }, [])

  // ── Pagos proveedor ───────────────────────────────────────────────────────

  const fetchPagosProveedor = useCallback(async ({ año, trimestre } = {}) => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('pagos_proveedor')
        .select(`
          id, fecha, concepto, importe, forma_pago, referencia, notas,
          categoria, base_imponible, iva_porcentaje, iva_importe, estado,
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

  const marcarEstadoPago = useCallback(async (id, estado) => {
    const { error: err } = await supabase
      .from('pagos_proveedor')
      .update({ estado })
      .eq('id', id)
    if (err) throw err
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

  // ── Libro diario (cobros + gastos combinados) ─────────────────────────────

  const fetchLibroDiario = useCallback(async ({ año } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const desde = `${año}-01-01`
      const hasta = `${año}-12-31`

      const [{ data: cobros, error: e1 }, { data: pagos, error: e2 }] = await Promise.all([
        supabase
          .from('pagos')
          .select('id, fecha, importe, tipo, forma_pago, referencia, estado, encargos(id, numero, clientes(nombre, apellidos))')
          .gte('fecha', desde)
          .lte('fecha', hasta),
        supabase
          .from('pagos_proveedor')
          .select('id, fecha, concepto, importe, forma_pago, referencia, base_imponible, iva_porcentaje, estado')
          .gte('fecha', desde)
          .lte('fecha', hasta),
      ])

      if (e1) throw e1
      if (e2) throw e2

      const ingresos = (cobros ?? []).map(c => {
        const cliente = c.encargos?.clientes
          ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
          : '—'
        return {
          id: `c-${c.id}`,
          tipo: 'ingreso',
          fecha: c.fecha,
          descripcion: cliente,
          referencia: c.encargos?.numero ?? c.referencia ?? null,
          base: parseFloat(c.importe) || 0,
          iva: null,
          total: parseFloat(c.importe) || 0,
          forma_pago: c.forma_pago,
          estado: c.estado ?? 'cobrado',
        }
      })

      const gastos = (pagos ?? []).map(p => ({
        id: `p-${p.id}`,
        tipo: 'gasto',
        fecha: p.fecha,
        descripcion: p.concepto,
        referencia: p.referencia ?? null,
        base: p.base_imponible != null ? parseFloat(p.base_imponible) : parseFloat(p.importe) || 0,
        iva: p.iva_porcentaje ?? null,
        total: parseFloat(p.importe) || 0,
        forma_pago: p.forma_pago,
        estado: p.estado ?? 'pagado',
      }))

      return [...ingresos, ...gastos].sort((a, b) => a.fecha.localeCompare(b.fecha))
    } catch (e) {
      setError(e.message)
      return []
    } finally {
      setLoading(false)
    }
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

  // ── Resumen anual para gráfico mensual ────────────────────────────────────

  const fetchResumenAnual = useCallback(async (año) => {
    const desde = `${año}-01-01`
    const hasta = `${año}-12-31`

    const [{ data: cobros }, { data: pagos }] = await Promise.all([
      supabase.from('pagos').select('fecha, importe').gte('fecha', desde).lte('fecha', hasta),
      supabase.from('pagos_proveedor').select('fecha, importe').gte('fecha', desde).lte('fecha', hasta),
    ])

    const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, cobros: 0, gastos: 0 }))
    ;(cobros ?? []).forEach(({ fecha, importe }) => {
      const mes = new Date(fecha + 'T00:00:00').getMonth()
      meses[mes].cobros += parseFloat(importe) || 0
    })
    ;(pagos ?? []).forEach(({ fecha, importe }) => {
      const mes = new Date(fecha + 'T00:00:00').getMonth()
      meses[mes].gastos += parseFloat(importe) || 0
    })
    return meses
  }, [])

  return {
    loading,
    error,
    fetchCobros,
    marcarEstadoCobro,
    fetchPagosProveedor,
    marcarEstadoPago,
    registrarPagoProveedor,
    eliminarPagoProveedor,
    fetchProveedores,
    crearProveedor,
    fetchLibroDiario,
    fetchResumenAnual,
    fetchResumenPorCategoria,
  }
}
