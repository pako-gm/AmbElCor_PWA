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
  presupuestado: 'bg-gray-400 text-white',
  confirmado: 'bg-teal-500 text-white',
  en_confeccion: 'bg-blue-500 text-white',
  listo: 'bg-amber-500 text-white',
  entregado: 'bg-green-600 text-white',
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
  stripe: 'Online',
}
