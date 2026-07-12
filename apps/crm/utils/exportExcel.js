import { CATEGORIA_GASTO_LABELS, TIPO_PAGO_LABELS, FORMA_PAGO_LABELS } from '@/utils/formatters'

let excelJSModulePromise
const cargarExcelJS = () => {
  excelJSModulePromise ??= import('exceljs').then(m => m.default ?? m)
  return excelJSModulePromise
}

const GRIS_CABECERA = 'FFD9D9D9'
const GRIS_BANDA = 'FFF7F7F7'
const BORDE_FINO = { style: 'thin', color: { argb: 'FFBFBFBF' } }
const FORMATO_EURO = '#,##0.00" €"'

const COLUMNAS_DIARIO = [
  { header: 'Fecha', key: 'Fecha', width: 12 },
  { header: 'Tipo', key: 'Tipo', width: 10 },
  { header: 'Descripción', key: 'Descripción', width: 30 },
  { header: 'Referencia', key: 'Referencia', width: 16 },
  { header: 'Base imponible', key: 'Base imponible', width: 14, style: { numFmt: FORMATO_EURO } },
  { header: '% IVA', key: '% IVA', width: 8 },
  { header: 'Total', key: 'Total', width: 12, style: { numFmt: FORMATO_EURO } },
  { header: 'Forma de pago', key: 'Forma de pago', width: 14 },
  { header: 'Estado', key: 'Estado', width: 12 },
]

const COLUMNAS_COBROS = [
  { header: 'Fecha', key: 'Fecha', width: 12 },
  { header: 'Nº Encargo', key: 'Nº Encargo', width: 12 },
  { header: 'Cliente', key: 'Cliente', width: 26 },
  { header: 'Tipo', key: 'Tipo', width: 12 },
  { header: 'Importe', key: 'Importe', width: 12, style: { numFmt: FORMATO_EURO } },
  { header: 'Forma de pago', key: 'Forma de pago', width: 14 },
  { header: 'Referencia', key: 'Referencia', width: 16 },
]

const COLUMNAS_GASTOS = [
  { header: 'Fecha', key: 'Fecha', width: 12 },
  { header: 'Proveedor', key: 'Proveedor', width: 22 },
  { header: 'Categoría', key: 'Categoría', width: 16 },
  { header: 'Concepto', key: 'Concepto', width: 26 },
  { header: 'Base imponible', key: 'Base imponible', width: 14, style: { numFmt: FORMATO_EURO } },
  { header: '% IVA', key: '% IVA', width: 8 },
  { header: 'IVA', key: 'IVA', width: 12, style: { numFmt: FORMATO_EURO } },
  { header: 'Total', key: 'Total', width: 12, style: { numFmt: FORMATO_EURO } },
  { header: 'Forma de pago', key: 'Forma de pago', width: 14 },
  { header: 'Referencia', key: 'Referencia', width: 16 },
]

const COLUMNAS_RESUMEN = [
  { header: 'Concepto', key: 'Concepto', width: 34 },
  { header: 'Importe', key: 'Importe', width: 14, style: { numFmt: FORMATO_EURO } },
]

const crearHojaEstilizada = (wb, nombre, columnas, filas) => {
  const ws = wb.addWorksheet(nombre)
  ws.columns = columnas
  ws.addRows(filas)

  ws.getRow(1).eachCell({ includeEmpty: true }, cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CABECERA } }
    cell.border = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO }
    cell.alignment = { vertical: 'middle' }
  })

  for (let i = 2; i <= ws.rowCount; i++) {
    const banda = i % 2 === 0
    ws.getRow(i).eachCell({ includeEmpty: true }, cell => {
      cell.border = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO }
      if (banda) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_BANDA } }
    })
  }

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  return ws
}

const descargarWorkbook = async (wb, filename) => {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportarLibroDiario = async (entries, { año, mes } = {}) => {
  const filas = entries.map(e => ({
    'Fecha': e.fecha,
    'Tipo': e.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
    'Descripción': e.descripcion,
    'Referencia': e.referencia ?? '',
    'Base imponible': e.base != null ? e.base : '',
    '% IVA': e.iva != null ? e.iva : '',
    'Total': e.tipo === 'ingreso' ? e.total : -e.total,
    'Forma de pago': FORMA_PAGO_LABELS[e.forma_pago] ?? e.forma_pago ?? '',
    'Estado': e.estado ?? '',
  }))
  const ExcelJS = await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  crearHojaEstilizada(wb, 'Libro Diario', COLUMNAS_DIARIO, filas)
  const sufijo = mes ? `_${mes}` : ''
  await descargarWorkbook(wb, `libro_diario_${año ?? 'todos'}${sufijo}.xlsx`)
}

const filtrarPorTrimestre = (registros, trimestre, año) => {
  const meses = { 1: [0, 2], 2: [3, 5], 3: [6, 8], 4: [9, 11] }
  return registros.filter(r => {
    const d = new Date(r.fecha)
    return d.getFullYear() === año &&
      d.getMonth() >= meses[trimestre][0] &&
      d.getMonth() <= meses[trimestre][1]
  })
}

const filasDeCobros = (cobros) => cobros.map(c => ({
  'Fecha': c.fecha,
  'Nº Encargo': c.encargos?.numero ?? '',
  'Cliente': c.encargos?.clientes
    ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
    : '',
  'Tipo': TIPO_PAGO_LABELS[c.tipo] ?? c.tipo,
  'Importe': c.importe,
  'Forma de pago': FORMA_PAGO_LABELS[c.forma_pago] ?? c.forma_pago,
  'Referencia': c.referencia ?? '',
}))

const filasDeGastos = (pagos, labels) => pagos.map(p => ({
  'Fecha': p.fecha,
  'Proveedor': p.proveedores?.nombre ?? '',
  'Categoría': labels[p.categoria] ?? p.categoria ?? '',
  'Concepto': p.concepto,
  'Base imponible': p.base_imponible != null ? p.base_imponible : '',
  '% IVA': p.iva_porcentaje != null && p.base_imponible != null ? p.iva_porcentaje : '',
  'IVA': p.iva_importe != null ? p.iva_importe : '',
  'Total': p.importe,
  'Forma de pago': FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago,
  'Referencia': p.referencia ?? '',
}))

export const exportarLibroCobros = async (cobros, { trimestre, año } = {}) => {
  const datos = trimestre ? filtrarPorTrimestre(cobros, trimestre, año) : cobros
  const ExcelJS = await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  crearHojaEstilizada(wb, 'Cobros', COLUMNAS_COBROS, filasDeCobros(datos))
  await descargarWorkbook(wb, `cobros_${año ?? 'todos'}.xlsx`)
}

export const exportarLibroPagos = async (pagos, { trimestre, año, categoriaLabels } = {}) => {
  const labels = { ...CATEGORIA_GASTO_LABELS, ...(categoriaLabels ?? {}) }
  const datos = trimestre ? filtrarPorTrimestre(pagos, trimestre, año) : pagos
  const ExcelJS = await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  crearHojaEstilizada(wb, 'Gastos', COLUMNAS_GASTOS, filasDeGastos(datos, labels))
  await descargarWorkbook(wb, `pagos_${año ?? 'todos'}.xlsx`)
}

const SECCIONES_RESUMEN = new Set(['RESUMEN', 'RESULTADO NETO', 'DESGLOSE GASTOS POR CATEGORÍA'])

export const exportarBalanceTrimestral = async (cobros, pagos, { trimestre, año, categoriaLabels } = {}) => {
  const labels = { ...CATEGORIA_GASTO_LABELS, ...(categoriaLabels ?? {}) }
  const cobrosFiltrados = trimestre ? filtrarPorTrimestre(cobros, trimestre, año) : cobros
  const pagosFiltrados = trimestre ? filtrarPorTrimestre(pagos, trimestre, año) : pagos

  const filasCobros = filasDeCobros(cobrosFiltrados)
  const filasGastos = filasDeGastos(pagosFiltrados, labels)

  const totalCobrado = cobrosFiltrados
    .filter(c => c.tipo !== 'devolucion')
    .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalDevoluciones = cobrosFiltrados
    .filter(c => c.tipo === 'devolucion')
    .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalGastado = pagosFiltrados.reduce((s, p) => s + parseFloat(p.importe || 0), 0)
  const resultado = totalCobrado - totalDevoluciones - totalGastado

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
        Concepto: labels[cat] ?? cat,
        Importe: total,
      })),
  ]

  const ExcelJS = await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  crearHojaEstilizada(wb, 'Cobros', COLUMNAS_COBROS, filasCobros)
  crearHojaEstilizada(wb, 'Gastos', COLUMNAS_GASTOS, filasGastos)
  const wsResumen = crearHojaEstilizada(wb, 'Resumen', COLUMNAS_RESUMEN, filasResumen)
  filasResumen.forEach((fila, i) => {
    if (SECCIONES_RESUMEN.has(fila.Concepto)) {
      wsResumen.getRow(i + 2).eachCell({ includeEmpty: true }, cell => {
        cell.font = { bold: true }
      })
    }
  })

  const nombreArchivo = trimestre
    ? `balance_T${trimestre}_${año}.xlsx`
    : `balance_${año ?? 'todos'}.xlsx`
  await descargarWorkbook(wb, nombreArchivo)
}
