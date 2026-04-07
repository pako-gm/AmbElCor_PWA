import jsPDF from 'jspdf'
import { formatFecha, formatImporte, TIPO_PAGO_LABELS, FORMA_PAGO_LABELS } from './formatters'
import logoUrl from '@/public/img/negro-logo-ambelcor.jpg'

const PRIMARY = [48, 186, 170] // #30BAAA

async function cargarLogo() {
  const resp = await fetch(logoUrl)
  const blob = await resp.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

// titulo: etiqueta del documento (ej. 'PRESUPUESTO')
// rightLines: array de strings con info del documento (nº, fecha, etc.)
function addHeader(doc, titulo, rightLines, logoData) {
  // Logo sin fondo de color
  let textX = 14
  if (logoData) {
    doc.addImage(logoData, 'JPEG', 14, 4, 14, 14)
    textX = 30
  }

  // Texto marca en negro/gris
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Amb el Cor', textX, 12)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Taller de Costura Artesanal', textX, 18)

  // Derecha: etiqueta del documento + líneas de info
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 196, 8, { align: 'right' })

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let ry = 14
  rightLines.forEach(line => {
    doc.text(line, 196, ry, { align: 'right' })
    ry += 5
  })

  // Línea separadora gruesa teal
  const lineY = Math.max(24, ry + 2)
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(1.5)
  doc.line(0, lineY, 210, lineY)
  doc.setLineWidth(0.2)
  doc.setDrawColor(0, 0, 0)

  doc.setTextColor(40, 40, 40)
  return lineY + 7
}

function addInfo(doc, y, label, value) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(label, 14, y)
  const labelWidth = doc.getTextWidth(label)
  doc.setFont('helvetica', 'normal')
  doc.text(value ?? '—', 14 + labelWidth + 3, y)
  return y + 6
}

function addLineasTable(doc, lineas, y) {
  // Cabecera tabla
  doc.setFillColor(245, 245, 245)
  doc.rect(14, y, 182, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Descripción', 16, y + 5.5)
  doc.text('Cantidad', 122, y + 5.5, { align: 'right' })
  doc.text('Precio unit.', 154, y + 5.5, { align: 'right' })
  doc.text('Subtotal', 196, y + 5.5, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'normal')
  lineas.forEach((l, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 252, 251)
      doc.rect(14, y - 2, 182, 8, 'F')
    }
    const desc = l.descripcion || l.prendas_catalogo?.nombre || '—'
    const subtotal = (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1)
    doc.text(doc.splitTextToSize(desc, 100)[0], 16, y + 3.5)
    doc.text(String(l.cantidad ?? 1), 122, y + 3.5, { align: 'right' })
    doc.text(formatImporte(l.precio_unitario), 154, y + 3.5, { align: 'right' })
    doc.text(formatImporte(subtotal), 196, y + 3.5, { align: 'right' })
    y += 8
  })

  return y
}

export async function generarPresupuestoPDF(encargo) {
  const logoData = await cargarLogo()
  const doc = new jsPDF()

  const rightLines = [
    `Nº: ${encargo.numero ?? '—'}`,
    `Fecha: ${formatFecha(encargo.fecha_encargo)}`,
    ...(encargo.fecha_entrega_estimada
      ? [`Entrega est.: ${formatFecha(encargo.fecha_entrega_estimada)}`]
      : []),
  ]
  let y = addHeader(doc, 'PRESUPUESTO', rightLines, logoData)

  // Datos cliente
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Cliente', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const nombreCliente = encargo.clientes
    ? `${encargo.clientes.nombre} ${encargo.clientes.apellidos ?? ''}`.trim()
    : '—'
  doc.text(nombreCliente, 14, y)
  if (encargo.clientes?.telefono) { y += 5; doc.text(encargo.clientes.telefono, 14, y) }
  y += 10

  // Líneas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Detalle del Presupuesto', 14, y)
  y += 6
  y = addLineasTable(doc, encargo.encargo_lineas ?? [], y)
  y += 4

  // Total
  doc.setFillColor(...PRIMARY)
  doc.rect(140, y, 56, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL', 144, y + 7)
  doc.text(formatImporte(encargo.precio_total), 195, y + 7, { align: 'right' })
  doc.setTextColor(40, 40, 40)
  y += 18

  // Notas
  if (encargo.notas) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('Notas: ' + encargo.notas, 14, y)
    y += 10
  }

  // Pie
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Presupuesto válido por 30 días. Todos los precios son con IVA incluido. AmbElCor — Taller de Costura artesanal.', 14, 285)

  const nombreFichero = `presupuesto-${(encargo.numero ?? 'encargo').replace('/', '-')}.pdf`
  doc.save(nombreFichero)
}

export async function generarFacturaPDF(encargo, datosFiscales) {
  const logoData = await cargarLogo()
  const doc = new jsPDF()

  const rightLines = [
    `Factura nº: ${encargo.numero ?? '—'}`,
    `Fecha: ${formatFecha(encargo.fecha_entrega_real ?? encargo.fecha_encargo)}`,
  ]
  let y = addHeader(doc, 'FACTURA', rightLines, logoData)

  // Datos emisor (Carmen)
  if (datosFiscales) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(datosFiscales.nombre ?? '', 14, y)
    doc.setFont('helvetica', 'normal')
    if (datosFiscales.nif) { y += 5; doc.text('NIF: ' + datosFiscales.nif, 14, y) }
    if (datosFiscales.direccion) { y += 5; doc.text(datosFiscales.direccion, 14, y) }
    if (datosFiscales.telefono) { y += 5; doc.text(datosFiscales.telefono, 14, y) }
    if (datosFiscales.email) { y += 5; doc.text(datosFiscales.email, 14, y) }
    y += 8
  }

  // Cliente
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Cliente', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const nombreCliente = encargo.clientes
    ? `${encargo.clientes.nombre} ${encargo.clientes.apellidos ?? ''}`.trim()
    : '—'
  doc.text(nombreCliente, 14, y)
  y += 10

  // Líneas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Servicios', 14, y)
  y += 6
  y = addLineasTable(doc, encargo.encargo_lineas ?? [], y)
  y += 4

  // Total encargo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Total encargo:', 140, y)
  doc.setFont('helvetica', 'normal')
  doc.text(formatImporte(encargo.precio_total), 195, y, { align: 'right' })
  y += 10

  // Pagos recibidos
  if (encargo.pagos?.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Pagos recibidos', 14, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    encargo.pagos.forEach(p => {
      const linea = `${formatFecha(p.fecha)}  ${TIPO_PAGO_LABELS[p.tipo] ?? p.tipo}  ${FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago}`
      doc.text(linea, 16, y)
      doc.text(formatImporte(p.importe), 195, y, { align: 'right' })
      y += 6
    })
    y += 2

    const totalPagado = encargo.pagos.reduce((s, p) => s + parseFloat(p.importe), 0)
    doc.setFont('helvetica', 'bold')
    doc.text('Total cobrado:', 140, y)
    doc.text(formatImporte(totalPagado), 195, y, { align: 'right' })
    y += 10
  }

  // Total final (recuadro)
  doc.setFillColor(...PRIMARY)
  doc.rect(130, y, 66, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL FACTURA', 134, y + 8)
  doc.text(formatImporte(encargo.precio_total), 195, y + 8, { align: 'right' })
  doc.setTextColor(40, 40, 40)
  y += 20

  // IBAN si disponible
  if (datosFiscales?.iban) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Transferencia bancaria: ' + datosFiscales.iban, 14, y)
  }

  // Pie
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Todos los precios son con IVA incluido. AmbElCor — Taller de Costura artesanal. Gracias por su confianza.', 14, 285)

  const nombreFichero = `factura-${(encargo.numero ?? 'encargo').replace('/', '-')}.pdf`
  doc.save(nombreFichero)
}
