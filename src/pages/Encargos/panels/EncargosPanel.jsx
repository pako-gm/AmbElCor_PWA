import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { fetchEncargos } from '@/hooks/useEncargos'
import { formatFecha, formatFechaCorta, formatImporte } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'

function calcularProgreso(fechaInicio, fechaFin) {
  if (!fechaFin) return null
  const inicio = new Date(fechaInicio).getTime()
  const fin = new Date(fechaFin).getTime()
  const hoy = Date.now()
  const total = fin - inicio
  if (total <= 0) return null
  const avance = ((hoy - inicio) / total) * 100
  const diasRestantes = Math.ceil((fin - hoy) / 86400000)
  return { pct: Math.max(0, avance), diasRestantes, vencido: hoy > fin }
}

const FILTROS = [
  { value: 'activos', label: 'Todos' },
  { value: 'presupuestado', label: 'Presupuestado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_confeccion', label: 'En confección' },
  { value: 'listo', label: 'Listo' },
]

export default function EncargosPanel() {
  const navigate = useNavigate()
  const [encargos, setEncargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('activos')
  const [busqueda, setBusqueda] = useState('')
  const [verEntregados, setVerEntregados] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = filtroEstado === 'activos'
      ? (verEntregados ? {} : { excludeEntregados: true })
      : { estado: filtroEstado }
    fetchEncargos(params)
      .then(setEncargos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filtroEstado, verEntregados])

  const filtrados = encargos
    .filter(e => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      const nombre = `${e.clientes?.nombre ?? ''} ${e.clientes?.apellidos ?? ''}`.toLowerCase()
      return nombre.includes(q) || (e.numero ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const fa = a.fecha_entrega_estimada
      const fb = b.fecha_entrega_estimada
      if (!fa && !fb) return 0
      if (!fa) return 1
      if (!fb) return -1
      return fa.localeCompare(fb)
    })

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <SearchInput
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por cliente o nº encargo…"
      />

      {/* Filtros de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === f.value
                ? 'bg-primary text-white'
                : 'bg-white border border-[--border] text-[--text-medium] hover:border-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
        {filtroEstado === 'activos' && (
          <button
            onClick={() => setVerEntregados(v => !v)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              verEntregados
                ? 'bg-primary text-white'
                : 'bg-white border border-[--border] text-[--text-medium] hover:border-primary'
            }`}
          >
            {verEntregados ? 'Ocultar entregados' : 'Mostrar entregados'}
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <LoadingState />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          titulo={busqueda || filtroEstado !== 'activos' ? 'Sin resultados' : 'Aún no hay encargos.'}
          accion={!busqueda && filtroEstado === 'activos' && (
            <Button onClick={() => navigate('/encargos/nuevo')}>
              <Plus size={16} />
              Crear el primero
            </Button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map(e => {
            const prog = calcularProgreso(e.fecha_encargo, e.fecha_entrega_estimada)
            const marcoAviso = prog
              ? Math.max(0, Math.min(100,
                  ((new Date(e.fecha_entrega_estimada).getTime() - 7 * 86400000 - new Date(e.fecha_encargo).getTime())
                   / (new Date(e.fecha_entrega_estimada).getTime() - new Date(e.fecha_encargo).getTime())) * 100
                ))
              : 0
            return (
              <button
                key={e.id}
                onClick={() => navigate(`/encargos/${e.id}`)}
                className="w-full bg-white rounded-lg border border-[--border] p-4 text-left hover:border-primary transition-colors"
              >
                {/* Fila 1: número + badge estado */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[--text-light]">{e.numero}</p>
                  <Badge estado={e.estado} />
                </div>

                {/* Fila 2: nombre + prendas (izq) e importe (der) */}
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <p className="font-medium text-[--text-dark] text-sm truncate">
                      {e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : 'Sin cliente'}
                    </p>
                    <p className="text-xs text-[--text-light] flex-shrink-0">
                      {e.encargo_lineas?.length ?? 0} prenda{(e.encargo_lineas?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[--text-dark] flex-shrink-0">
                    {formatImporte(e.precio_total)}
                  </p>
                </div>

                {/* Fila 3: timeline o fecha de entrega */}
                {e.estado === 'entregado' ? (
                  <div className="mt-2 text-[10px] text-[--text-light]">
                    Entregado el: <span className="font-medium">{formatFecha(e.fecha_entrega_real)}</span>
                  </div>
                ) : prog ? (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-[--text-light] mb-0.5">
                      <span>inicio: {formatFechaCorta(e.fecha_encargo)}</span>
                      {prog.vencido ? (
                        <span className="text-red-500 font-medium">{Math.abs(prog.diasRestantes)} días de retraso</span>
                      ) : (
                        <span>entrega: {formatFechaCorta(e.fecha_entrega_estimada)}</span>
                      )}
                    </div>

                    {/* Barra de progreso con cursor */}
                    <div className="relative h-2 rounded-full bg-gray-200 overflow-visible mx-12">
                      {/* Parte verde (hasta hoy) */}
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(prog.pct, 100)}%` }}
                      />

                      {/* Parte roja (desde checkpoint al final, si pasó el checkpoint) */}
                      {prog.pct > marcoAviso && !prog.vencido && (
                        <div
                          className="absolute top-0 h-full bg-red-500 rounded-full"
                          style={{
                            left: `${marcoAviso}%`,
                            right: '0',
                            width: `${Math.min(100 - marcoAviso, 100)}%`
                          }}
                        />
                      )}

                      {/* Rojo total si vencido */}
                      {prog.vencido && (
                        <div className="absolute top-0 left-0 right-0 h-full bg-red-500 rounded-full" />
                      )}

                      {/* Cursor (círculo) en posición actual */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm transition-all"
                        style={{ left: `${Math.min(prog.pct, 100)}%` }}
                      />

                      {/* Checkpoint (línea vertical ámbar) - siempre visible */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${marcoAviso}%` }}
                      >
                        <div className="w-0.5 h-4 bg-amber-400" />
                        <span className="text-[8px] text-amber-600 font-medium whitespace-nowrap mt-0.5">
                          {'<7 días'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
