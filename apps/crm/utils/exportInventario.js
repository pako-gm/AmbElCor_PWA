import * as XLSX from 'xlsx'

const UNIDAD_LABELS = {
  unidad: 'Unidad', metro: 'Metro (m)', metro_cuadrado: 'Metro cuadrado (m²)',
  kilogramo: 'Kilogramo (kg)', litro: 'Litro (l)', par: 'Par', rollo: 'Rollo', caja: 'Caja',
}

const TIPO_LABELS = { entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste' }

export const exportarStockActual = (materiales) => {
  const filas = materiales.map(m => ({
    Código: m.codigo ?? '',
    Nombre: m.nombre,
    Categoría: m.categoria ?? '',
    Unidad: UNIDAD_LABELS[m.unidad] ?? m.unidad,
    'Stock actual': parseFloat(m.stock_actual),
    'Stock mínimo': parseFloat(m.stock_minimo ?? 0),
    'Precio referencia (€)': m.precio_referencia != null ? parseFloat(m.precio_referencia) : '',
    'Valor total (€)': m.precio_referencia != null
      ? Math.round(parseFloat(m.stock_actual) * parseFloat(m.precio_referencia) * 100) / 100
      : '',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stock actual')
  const hoy = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `inventario_stock_${hoy}.xlsx`)
}

export const exportarMovimientosMaterial = (material, movimientos) => {
  const filas = movimientos.map(mv => ({
    Fecha: mv.fecha,
    Tipo: TIPO_LABELS[mv.tipo] ?? mv.tipo,
    Cantidad: parseFloat(mv.cantidad),
    'Precio unitario (€)': mv.precio_unitario != null ? parseFloat(mv.precio_unitario) : '',
    Proveedor: mv.proveedores?.nombre ?? '',
    Encargo: mv.encargos?.numero ?? '',
    Motivo: mv.motivo ?? '',
    Notas: mv.notas ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
  const codigo = material.codigo ?? material.nombre.slice(0, 15).replace(/\s+/g, '_')
  const hoy = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `movimientos_${codigo}_${hoy}.xlsx`)
}
