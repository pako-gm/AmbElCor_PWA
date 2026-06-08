import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargos } from '@/hooks/useEncargos'
import { formatFecha, formatImporte, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

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

function calcularFechaCheckpoint(fechaFin) {
  if (!fechaFin) return null
  const fin = new Date(fechaFin).getTime()
  const checkpoint = new Date(fin - 7 * 86400000)
  return checkpoint.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatFechaCorta(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

const FILTROS = [
  { value: 'activos', label: 'Todos' },
  { value: 'presupuestado', label: 'Presupuestado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_confeccion', label: 'En confección' },
  { value: 'listo', label: 'Listo' },
  { value: 'entregado', label: 'Entregado' },
]

export default function EncargosLista() {
  const navigate = useNavigate()
  const [encargos, setEncargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('activos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = filtroEstado === 'activos'
      ? { excludeEntregados: true }
      : { estado: filtroEstado }
    fetchEncargos(params)
      .then(setEncargos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filtroEstado])

  const filtrados = encargos.filter(e => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const nombre = `${e.clientes?.nombre ?? ''} ${e.clientes?.apellidos ?? ''}`.toLowerCase()
    return nombre.includes(q) || (e.numero ?? '').toLowerCase().includes(q)
  })

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[--text-dark]">Encargos</h1>
          <button
            onClick={() => navigate('/encargos/nuevo')}
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-light]" />
          <input
            type="search"
            placeholder="Buscar por cliente o nº encargo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[--border] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

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
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-[--text-light] text-sm">Cargando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-[--text-light] text-sm">
            {busqueda || filtroEstado ? 'Sin resultados' : 'Aún no hay encargos. ¡Crea el primero!'}
          </div>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[e.estado]}`}>
                      {ESTADO_LABELS[e.estado]}
                    </span>
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
    </PageWrapper>
  )
}
