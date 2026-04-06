import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatFecha, formatImporte, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

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
          encargo_lineas (descripcion, cantidad, prendas_catalogo (nombre)),
          pagos (fecha, importe, tipo)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[--text-medium]">Cargando…</div>
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <p className="text-[--text-medium]">No se encontró el encargo o el enlace no es válido.</p>
    </div>
  )

  const estadoActual = ESTADOS.indexOf(encargo.estado)

  return (
    <div className="min-h-screen bg-[--bg-alt] py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Cabecera */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-xs text-[--text-light] mb-1">Encargo {encargo.numero}</p>
          <h1 className="font-display text-xl text-[--text-dark]">
            {encargo.clientes?.nombre} {encargo.clientes?.apellidos}
          </h1>
          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLORS[encargo.estado]}`}>
            {ESTADO_LABELS[encargo.estado]}
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[--text-medium] mb-4">Estado del encargo</h2>
          <div className="flex items-center gap-1">
            {ESTADOS.map((estado, i) => (
              <div key={estado} className="flex items-center gap-1 flex-1 min-w-0">
                <span className={`flex-1 text-center text-[10px] font-medium px-1 py-1.5 rounded leading-tight ${
                  i <= estadoActual ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {ESTADO_LABELS[estado]}
                </span>
                {i < ESTADOS.length - 1 && (
                  <ChevronRight size={12} className="flex-shrink-0 text-gray-300" />
                )}
              </div>
            ))}
          </div>
          {encargo.fecha_entrega_estimada && (
            <p className="mt-4 text-sm text-[--text-medium]">
              Entrega estimada: <strong>{formatFecha(encargo.fecha_entrega_estimada)}</strong>
            </p>
          )}
        </div>

        {/* Prendas */}
        {encargo.encargo_lineas?.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[--text-medium] mb-3">Prendas incluidas</h2>
            <ul className="space-y-2">
              {encargo.encargo_lineas.map((linea, i) => (
                <li key={i} className="text-sm text-[--text-dark] flex justify-between">
                  <span>{linea.descripcion || linea.prendas_catalogo?.nombre || 'Prenda'}</span>
                  {linea.cantidad > 1 && <span className="text-[--text-light]">×{linea.cantidad}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pagos */}
        {encargo.pagos?.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[--text-medium] mb-3">Pagos realizados</h2>
            <ul className="space-y-2">
              {encargo.pagos.map((pago, i) => (
                <li key={i} className="text-sm flex justify-between text-[--text-dark]">
                  <span>{formatFecha(pago.fecha)} · {pago.tipo}</span>
                  <span className="font-medium">{formatImporte(pago.importe)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
