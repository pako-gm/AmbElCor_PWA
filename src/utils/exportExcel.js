import * as XLSX from 'xlsx'
import { CATEGORIA_GASTO_LABELS, TIPO_PAGO_LABELS, FORMA_PAGO_LABELS } from '@/utils/formatters'

const filtrarPorTrimestre = (registros, trimestre, año) => {
  const meses = { 1: [0, 2], 2: [3, 5], 3: [6, 8], 4: [9, 11] }
  return registros.filter(r => {
    const d = new Date(r.fecha)
    return d.getFullYear() === año &&
      d.getMonth() >= meses[trimestre][0] &&
      d.getMonth() <= meses[trimestre][1]
  })
}

export const exportarLibroCobros = (cobros, { trimestre, año } = {}) => {
  const datos = trimestre ? filtrarPorTrimestre(cobros, trimestre, año) : cobros
  const filas = datos.map(c => ({
    Fecha: c.fecha,
    'Nº Encargo': c.encargos?.numero ?? '',
    Cliente: c.encargos?.clientes
      ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
      : '',
    Tipo: TIPO_PAGO_LABELS[c.tipo] ?? c.tipo,
    Importe: c.importe,
    'Forma de pago': FORMA_PAGO_LABELS[c.forma_pago] ?? c.forma_pago,
    Referencia: c.referencia ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cobros')
  XLSX.writeFile(wb, `cobros_${año ?? 'todos'}.xlsx`)
}

export const exportarLibroPagos = (pagos, { trimestre, año } = {}) => {
  const datos = trimestre ? filtrarPorTrimestre(pagos, trimestre, año) : pagos
  const filas = datos.map(p => ({
    Fecha: p.fecha,
    Proveedor: p.proveedores?.nombre ?? '',
    Categoría: CATEGORIA_GASTO_LABELS[p.categoria] ?? p.categoria ?? '',
    Concepto: p.concepto,
    'Base imponible': p.base_imponible != null ? p.base_imponible : '',
    '% IVA': p.iva_porcentaje != null && p.base_imponible != null ? p.iva_porcentaje : '',
    IVA: p.iva_importe != null ? p.iva_importe : '',
    Total: p.importe,
    'Forma de pago': FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago,
    Referencia: p.referencia ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
  XLSX.writeFile(wb, `pagos_${año ?? 'todos'}.xlsx`)
}

export const exportarBalanceTrimestral = (cobros, pagos, { trimestre, año } = {}) => {
  const cobrosFiltrados = trimestre ? filtrarPorTrimestre(cobros, trimestre, año) : cobros
  const pagosFiltrados = trimestre ? filtrarPorTrimestre(pagos, trimestre, año) : pagos

  // Hoja Cobros
  const filasCobros = cobrosFiltrados.map(c => ({
    Fecha: c.fecha,
    'Nº Encargo': c.encargos?.numero ?? '',
    Cliente: c.encargos?.clientes
      ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
      : '',
    Tipo: TIPO_PAGO_LABELS[c.tipo] ?? c.tipo,
    Importe: c.importe,
    'Forma de pago': FORMA_PAGO_LABELS[c.forma_pago] ?? c.forma_pago,
    Referencia: c.referencia ?? '',
  }))

  // Hoja Gastos
  const filasGastos = pagosFiltrados.map(p => ({
    Fecha: p.fecha,
    Proveedor: p.proveedores?.nombre ?? '',
    Categoría: CATEGORIA_GASTO_LABELS[p.categoria] ?? p.categoria ?? '',
    Concepto: p.concepto,
    'Base imponible': p.base_imponible != null ? p.base_imponible : '',
    '% IVA': p.iva_porcentaje != null && p.base_imponible != null ? p.iva_porcentaje : '',
    IVA: p.iva_importe != null ? p.iva_importe : '',
    Total: p.importe,
    'Forma de pago': FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago,
    Referencia: p.referencia ?? '',
  }))

  // Hoja Resumen
  const totalCobrado = cobrosFiltrados
    .filter(c => c.tipo !== 'devolucion')
    .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalDevoluciones = cobrosFiltrados
    .filter(c => c.tipo === 'devolucion')
    .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalGastado = pagosFiltrados.reduce((s, p) => s + parseFloat(p.importe || 0), 0)
  const resultado = totalCobrado - totalDevoluciones - totalGastado

  // Desglose por categoría
  const porCategoria = {}
  pagosFiltrados.forEach(p => {
    const cat = p.categoria ?? 'otros'
    porCategoria[cat] = (porCategoria[cat] ?? 0) + parseFloat(p.importe || 0)
  })

  const filasResumen = [
    { Concepto: 'RESUMEN', Importe: '' },
    { Concepto: 'Total cobrado', Importe: totalCobrado },
    { Concepto: 'Devoluciones', Importe: -totalDevoluciones },
    { Concepto: 'Total gastado', Importe: -totalGastado },
    { Concepto: 'RESULTADO NETO', Importe: resultado },
    { Concepto: '', Importe: '' },
    { Concepto: 'DESGLOSE GASTOS POR CATEGORÍA', Importe: '' },
    ...Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({
        Concepto: CATEGORIA_GASTO_LABELS[cat] ?? cat,
        Importe: total,
      })),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasCobros), 'Cobros')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasGastos), 'Gastos')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasResumen), 'Resumen')

  const nombreArchivo = trimestre
    ? `balance_T${trimestre}_${año}.xlsx`
    : `balance_${año ?? 'todos'}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
