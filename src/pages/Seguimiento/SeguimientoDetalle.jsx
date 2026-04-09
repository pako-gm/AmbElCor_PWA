import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatFecha, formatImporte, ESTADO_LABELS } from '@/utils/formatters'

const ESTADOS = ['presupuestado', 'confirmado', 'en_confeccion', 'listo', 'entregado']

export default function SeguimientoDetalle() {
  const { token } = useParams()
  const [encargo, setEncargo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase
        .from('encargos')
        .select(`
          id, numero, estado, fecha_encargo, fecha_entrega_estimada,
          clientes (nombre, apellidos),
          encargo_lineas (descripcion, cantidad, precio_unitario, prendas_catalogo (nombre)),
          historial_estados (estado_nuevo, fecha)
        `)
        .eq('token_publico', token)
        .maybeSingle()
      setLoading(false)
      if (error || !data) {
        setNotFound(true)
      } else {
        setEncargo(data)
      }
    }
    cargar()
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando…</div>
  )
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <p className="text-gray-500">No se encontró el encargo o el enlace no es válido.</p>
    </div>
  )

  const estadoActual = ESTADOS.indexOf(encargo.estado)

  // Fechas por estado: presupuestado = fecha_encargo, resto desde historial
  const fechasPorEstado = {}
  if (encargo.fecha_encargo) fechasPorEstado['presupuestado'] = encargo.fecha_encargo
  ;(encargo.historial_estados ?? []).forEach(h => {
    if (h.estado_nuevo && h.fecha) fechasPorEstado[h.estado_nuevo] = h.fecha
  })

  const lineas = encargo.encargo_lineas ?? []
  const total = lineas.reduce((sum, l) =>
    sum + parseFloat(l.precio_unitario || 0) * (l.cantidad || 1), 0)

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Cabecera */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">{encargo.numero}</p>
          <h1 className="text-2xl font-semibold text-gray-800">
            {encargo.clientes?.nombre} {encargo.clientes?.apellidos}
          </h1>
        </div>

        {/* Timeline vertical */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {encargo.fecha_entrega_estimada && (
            <p className="text-xs text-gray-400 mb-5">
              Entrega prevista: {formatFecha(encargo.fecha_entrega_estimada)}
            </p>
          )}
          <div>
            {ESTADOS.map((estado, i) => {
              const isCompleted = i < estadoActual
              const isCurrent = i === estadoActual
              const isFuture = i > estadoActual
              const isLast = i === ESTADOS.length - 1
              const fecha = fechasPorEstado[estado]

              return (
                <div key={estado} className="flex gap-4">
                  {/* Icono + línea vertical */}
                  <div className="flex flex-col items-center">
                    {isCompleted && (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#30BAAA] flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-[#30BAAA]" />
                      </div>
                    )}
                    {isFuture && (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${isCompleted ? 'bg-gray-700' : 'bg-gray-200'}`}
                        style={{ minHeight: '24px' }}
                      />
                    )}
                  </div>

                  {/* Texto */}
                  <div className={`${isLast ? 'pb-0' : 'pb-6'}`}>
                    <p className={`font-medium text-sm ${
                      isFuture ? 'text-gray-400' :
                      isCurrent ? 'text-[#30BAAA]' :
                      'text-gray-700'
                    }`}>
                      {ESTADO_LABELS[estado]}
                    </p>
                    {isCompleted && fecha && (
                      <p className="text-xs text-gray-400">{formatFecha(fecha)}</p>
                    )}
                    {isCurrent && fecha && (
                      <p className="text-xs text-[#30BAAA]">Estado actual · desde {formatFecha(fecha)}</p>
                    )}
                    {isCurrent && !fecha && (
                      <p className="text-xs text-[#30BAAA]">Estado actual</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prendas */}
        {lineas.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-4">
              Prendas ({lineas.length})
            </h2>
            <div className="space-y-3">
              {lineas.map((linea, i) => {
                const nombre = linea.descripcion || linea.prendas_catalogo?.nombre || 'Prenda'
                const subtotal = parseFloat(linea.precio_unitario || 0) * (linea.cantidad || 1)
                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {nombre}{linea.cantidad > 1 ? ` ×${linea.cantidad}` : ''}
                    </span>
                    {linea.precio_unitario && (
                      <span className="text-gray-700">{formatImporte(subtotal)}</span>
                    )}
                  </div>
                )
              })}
              {total > 0 && (
                <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-[#30BAAA]">{formatImporte(total)}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
