// Formateo de fechas
export const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// Formateo de importes en euros
export const formatImporte = (importe) => {
  if (importe == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR'
  }).format(importe)
}

// Fecha corta sin año: "11 jun"
export const formatFechaCorta = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

// Cantidades (stock, unidades) en es-ES sin símbolo de moneda
export const formatCantidad = (valor, decimales = 2) => {
  const n = typeof valor === 'number' ? valor : parseFloat(valor)
  if (valor == null || isNaN(n)) return '—'
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  })
}

// Teléfono de 9 dígitos: "612 345 678"; si no encaja, se devuelve tal cual
export const formatTelefono = (telefono) => {
  if (!telefono) return ''
  const limpio = String(telefono).replace(/[\s-]/g, '')
  if (!/^\d{9}$/.test(limpio)) return telefono
  return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`
}

// Generar número de encargo YY/NNN → ENC-YY/NNNN
export const formatNumeroEncargo = (numero) => {
  if (!numero) return '—'
  const parts = String(numero).split('/')
  if (parts.length !== 2) return numero
  const [yr, num] = parts
  return `ENC-${yr}/${num.padStart(4, '0')}`
}

// Etiquetas legibles de estado
export const ESTADO_LABELS = {
  presupuestado: 'Presupuestado',
  confirmado: 'Confirmado',
  en_confeccion: 'En confección',
  listo: 'Listo',
  entregado: 'Entregado',
}

export const ESTADO_COLORS = {
  presupuestado: { color: '#5E6878', backgroundColor: '#EFF1F4', borderColor: '#DDE0E7' },
  confirmado:    { color: '#5E48A8', backgroundColor: '#EFEAFB', borderColor: '#DCD0F2' },
  en_confeccion: { color: '#2F5AA0', backgroundColor: '#E8F0FB', borderColor: '#CFE0F5' },
  listo:         { color: '#8A6228', backgroundColor: '#F6EEDD', borderColor: '#E5D4AD' },
  entregado:     { color: '#0F7A4A', backgroundColor: '#E6F4EC', borderColor: '#C6E4D2' },
}

// Colores de acento para barras del Cronograma (Gantt)
export const ESTADO_BARRA = {
  presupuestado: '#7B8496',
  confirmado:    '#7559C2',
  en_confeccion: '#3D6BB3',
  listo:         '#B07D33',
  entregado:     '#2E9D5B',
}

// Etiquetas de tipo de pago
export const TIPO_PAGO_LABELS = {
  reserva: 'Reserva',
  a_cuenta: 'A cuenta',
  final: 'Final',
  devolucion: 'Devolución',
}

export const FORMA_PAGO_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  bizum: 'Bizum',
  domiciliacion: 'Domiciliación',
  stripe: 'Online',
}

// Formatea código de material: "TEL001" → "TEL-001"
export const formatCodigo = (codigo) => {
  if (!codigo) return ''
  return codigo.replace(/^([A-Za-z]+)(\d+)$/, '$1-$2')
}

export const CATEGORIA_GASTO_LABELS = {
  material: 'Material y suministros confección',
  cuota_autonomo: 'Cuota autónomo (SS)',
  alquiler: 'Alquiler local',
  suministros: 'Suministros (luz, agua, internet)',
  servicios_profesionales: 'Servicios profesionales (gestoría, asesoría)',
  transporte: 'Transporte y mensajería',
  marketing: 'Marketing y publicidad',
  impuestos: 'Impuestos y tasas',
  seguros: 'Seguros',
  otros: 'Otros gastos',
}
