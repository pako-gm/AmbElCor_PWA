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

// Generar número de encargo YY/NNN
export const formatNumeroEncargo = (numero) => numero ?? '—'

// Etiquetas legibles de estado
export const ESTADO_LABELS = {
  presupuestado: 'Presupuestado',
  confirmado: 'Confirmado',
  en_confeccion: 'En confección',
  listo: 'Listo',
  entregado: 'Entregado',
}

export const ESTADO_COLORS = {
  presupuestado: 'bg-muted text-white',
  confirmado: 'bg-primary text-white',
  en_confeccion: 'bg-violet text-white',
  listo: 'bg-amber text-white',
  entregado: 'bg-green text-white',
}

// Etiquetas de tipo de pago
export const TIPO_PAGO_LABELS = {
  señal: 'Señal',
  parcial: 'Parcial',
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
