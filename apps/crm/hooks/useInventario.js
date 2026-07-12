import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useInventario() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Materiales ────────────────────────────────────────────────────────────

  const fetchMateriales = useCallback(async ({ soloActivos = true } = {}) => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('vista_stock_materiales')
        .select('*')
        .order('nombre')
      if (soloActivos) q = q.eq('activo', true)
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

  const fetchMaterial = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: material, error: e1 }, { data: movimientos, error: e2 }, { data: prendas, error: e3 }] = await Promise.all([
        supabase.from('vista_stock_materiales').select('*').eq('id', id).single(),
        supabase
          .from('movimientos_inventario')
          .select(`
            id, tipo, cantidad, precio_unitario, fecha, motivo, notas, created_at,
            proveedores ( id, nombre ),
            encargos ( id, numero ),
            ventas ( id, numero )
          `)
          .eq('material_id', id)
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('prendas_catalogo').select('id, nombre').eq('material_id', id).limit(1),
      ])
      if (e1) throw e1
      if (e2) throw e2
      if (e3) throw e3
      return { material, movimientos: movimientos ?? [], prendaVinculada: prendas?.[0] ?? null }
    } catch (e) {
      setError(e.message)
      return { material: null, movimientos: [], prendaVinculada: null }
    } finally {
      setLoading(false)
    }
  }, [])

  const crearMaterial = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('materiales')
      .insert(payload)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const actualizarMaterial = useCallback(async (id, payload) => {
    const { data, error: err } = await supabase
      .from('materiales')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const desactivarMaterial = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('materiales')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
  }, [])

  // ── Movimientos ───────────────────────────────────────────────────────────

  const eliminarMovimiento = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('movimientos_inventario')
      .delete()
      .eq('id', id)
    if (err) throw err
  }, [])

  const actualizarMovimiento = useCallback(async (id, { fecha, cantidad, precio_unitario, notas, motivo }) => {
    const payload = { fecha, cantidad, notas: notas || null, motivo: motivo || null }
    if (precio_unitario !== undefined) payload.precio_unitario = precio_unitario || null
    const { data, error: err } = await supabase
      .from('movimientos_inventario')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const fetchMovimientos = useCallback(async ({ materialId, desde, hasta, tipo } = {}) => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('movimientos_inventario')
        .select(`
          id, tipo, cantidad, precio_unitario, fecha, motivo, notas, created_at,
          materiales ( id, codigo, nombre, unidad_gestion:unidad ),
          proveedores ( id, nombre ),
          encargos ( id, numero, codigo_corto )
        `)
        .order('fecha', { ascending: false })
      if (materialId) q = q.eq('material_id', materialId)
      if (desde) q = q.gte('fecha', desde)
      if (hasta) q = q.lte('fecha', hasta)
      if (tipo) q = q.eq('tipo', tipo)
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

  // ── Registrar entrada ─────────────────────────────────────────────────────

  const registrarEntrada = useCallback(async ({
    materialId, materialNombre, cantidad, precioUnitario,
    proveedorId, fecha, notas, crearGasto,
  }) => {
    let pagoProveedorId = null

    if (crearGasto && proveedorId && precioUnitario && cantidad) {
      const importe = parseFloat(cantidad) * parseFloat(precioUnitario)
      const { data: pago, error: errPago } = await supabase
        .from('pagos_proveedor')
        .insert({
          proveedor_id: proveedorId,
          fecha: fecha ?? new Date().toISOString().slice(0, 10),
          concepto: `Compra: ${materialNombre} x ${cantidad}`,
          importe,
          forma_pago: 'efectivo',
          categoria: 'material',
        })
        .select()
        .single()
      if (errPago) throw errPago
      pagoProveedorId = pago.id
    }

    const { data, error: err } = await supabase
      .from('movimientos_inventario')
      .insert({
        material_id: materialId,
        tipo: 'entrada',
        cantidad: parseFloat(cantidad),
        precio_unitario: precioUnitario ? parseFloat(precioUnitario) : null,
        proveedor_id: proveedorId || null,
        fecha: fecha ?? new Date().toISOString().slice(0, 10),
        notas: notas || null,
        pago_proveedor_id: pagoProveedorId,
      })
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  // ── Registrar salida ──────────────────────────────────────────────────────

  const registrarSalida = useCallback(async ({
    materialId, cantidad, encargoId, motivo, fecha, notas,
  }) => {
    const { data, error: err } = await supabase
      .from('movimientos_inventario')
      .insert({
        material_id: materialId,
        tipo: 'salida',
        cantidad: parseFloat(cantidad),
        encargo_id: encargoId || null,
        fecha: fecha ?? new Date().toISOString().slice(0, 10),
        motivo: motivo || null,
        notas: notas || null,
      })
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  // ── Registrar ajuste ──────────────────────────────────────────────────────

  const registrarAjuste = useCallback(async ({ materialId, cantidad, motivo, fecha }) => {
    const { data, error: err } = await supabase
      .from('movimientos_inventario')
      .insert({
        material_id: materialId,
        tipo: 'ajuste',
        cantidad: parseFloat(cantidad),
        fecha: fecha ?? new Date().toISOString().slice(0, 10),
        motivo: motivo || null,
      })
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  // ── Alertas stock bajo ────────────────────────────────────────────────────

  const fetchAlertasStockBajo = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('vista_stock_materiales')
      .select('*')
      .eq('activo', true)
    if (err) throw err
    return (data ?? []).filter(m => parseFloat(m.stock_actual) < parseFloat(m.stock_minimo))
  }, [])

  // ── Proveedores (para selects en formularios) ─────────────────────────────

  const fetchProveedores = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .order('nombre')
    if (err) throw err
    return data ?? []
  }, [])

  // ── Encargos activos (para selector en salidas) ───────────────────────────

  const fetchEncargosActivos = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('encargos')
      .select('id, numero, clientes(nombre, apellidos)')
      .not('estado', 'eq', 'entregado')
      .order('numero', { ascending: false })
      .limit(50)
    if (err) throw err
    return data ?? []
  }, [])

  // ── Categorías ────────────────────────────────────────────────────────────

  const fetchCategorias = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('categorias_inventario')
      .select('*')
      .order('nombre')
    if (err) throw err
    return data ?? []
  }, [])

  const crearCategoria = useCallback(async ({ nombre, icono = 'box', prefijo = null }) => {
    const maxOrden = await supabase
      .from('categorias_inventario')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .single()
    const orden = (maxOrden.data?.orden ?? 0) + 1
    const { data, error: err } = await supabase
      .from('categorias_inventario')
      .insert({ nombre, icono, orden, prefijo: prefijo?.trim().toUpperCase() || null })
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const actualizarCategoria = useCallback(async (id, { nombre, icono, prefijo }) => {
    const { data, error: err } = await supabase
      .from('categorias_inventario')
      .update({ nombre, icono, prefijo: prefijo?.trim().toUpperCase() || null })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  // Genera el siguiente código correlativo para un prefijo: PREFIJO-001, PREFIJO-002…
  const generarCodigoMaterial = useCallback(async (prefijo) => {
    const pref = (prefijo || 'S/C').trim().toUpperCase()
    const { data, error: err } = await supabase
      .from('materiales')
      .select('codigo')
      .ilike('codigo', `${pref}-%`)
    if (err) throw err
    let max = 0
    for (const row of data ?? []) {
      const m = row.codigo?.match(/-(\d+)\s*$/)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return `${pref}-${String(max + 1).padStart(3, '0')}`
  }, [])

  const eliminarCategoria = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('categorias_inventario')
      .delete()
      .eq('id', id)
    if (err) throw err
  }, [])

  // ── Unidades ──────────────────────────────────────────────────────────────

  const fetchUnidades = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('unidades_inventario')
      .select('*')
      .order('etiqueta')
    if (err) throw err
    return data ?? []
  }, [])

  const crearUnidad = useCallback(async ({ clave, etiqueta, abreviatura }) => {
    const maxOrden = await supabase
      .from('unidades_inventario')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .single()
    const orden = (maxOrden.data?.orden ?? 0) + 1
    const { data, error: err } = await supabase
      .from('unidades_inventario')
      .insert({ clave, etiqueta, abreviatura, orden })
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const actualizarUnidad = useCallback(async (id, { etiqueta, abreviatura }) => {
    const { data, error: err } = await supabase
      .from('unidades_inventario')
      .update({ etiqueta, abreviatura })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    return data
  }, [])

  const eliminarUnidad = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('unidades_inventario')
      .delete()
      .eq('id', id)
    if (err) throw err
  }, [])

  return {
    loading,
    error,
    fetchMateriales,
    fetchMaterial,
    crearMaterial,
    actualizarMaterial,
    desactivarMaterial,
    fetchMovimientos,
    registrarEntrada,
    registrarSalida,
    registrarAjuste,
    fetchAlertasStockBajo,
    fetchProveedores,
    fetchEncargosActivos,
    eliminarMovimiento,
    actualizarMovimiento,
    fetchCategorias,
    crearCategoria,
    actualizarCategoria,
    generarCodigoMaterial,
    eliminarCategoria,
    fetchUnidades,
    crearUnidad,
    actualizarUnidad,
    eliminarUnidad,
  }
}
