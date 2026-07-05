// Definición única de los tipos de notificación de la campana de avisos.
// Compartido entre el hook agregador (useAvisos) y la sección de Ajustes,
// para que ambos coincidan en claves y etiquetas.

export const TIPOS_NOTIFICACION = [
  { clave: 'cobros',   label: 'Cobros pendientes', descripcion: 'Cobros a clientas pendientes o vencidos.' },
  { clave: 'pagos',    label: 'Pagos pendientes',  descripcion: 'Gastos a proveedores aún sin pagar.' },
  { clave: 'stock',    label: 'Stock bajo',        descripcion: 'Materiales por debajo del mínimo.' },
  { clave: 'entregas', label: 'Entregas',          descripcion: 'Encargos con entrega hoy o atrasada.' },
  { clave: 'citas',    label: 'Citas de hoy',      descripcion: 'Citas programadas para el día.' },
]

// Clave en la tabla key-value `configuracion_app`.
export const CONFIG_KEY_NOTIFICACIONES = 'notificaciones_activas'

// Convierte el valor almacenado (JSON string) en un objeto { clave: bool }.
// Por defecto, todo activo cuando falta el valor o una clave concreta.
export function parsePreferencias(valor) {
  let guardado = {}
  if (valor) {
    try { guardado = JSON.parse(valor) } catch { guardado = {} }
  }
  return Object.fromEntries(
    TIPOS_NOTIFICACION.map(t => [t.clave, guardado[t.clave] !== false])
  )
}
