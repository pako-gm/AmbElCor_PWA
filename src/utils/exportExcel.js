import * as XLSX from 'xlsx'

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
    Concepto: c.tipo,
    Importe: c.importe,
    'Forma de pago': c.forma_pago,
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
    Concepto: p.concepto,
    Importe: p.importe,
    'Forma de pago': p.forma_pago,
    Referencia: p.referencia ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pagos')
  XLSX.writeFile(wb, `pagos_${año ?? 'todos'}.xlsx`)
}
