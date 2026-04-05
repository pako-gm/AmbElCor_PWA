import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargos } from '@/hooks/useEncargos'
import { formatFecha, formatImporte, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

const FILTROS = [
  { value: '', label: 'Todos' },
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
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchEncargos({ estado: filtroEstado || undefined })
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
            {filtrados.map(e => (
              <button
                key={e.id}
                onClick={() => navigate(`/encargos/${e.id}`)}
                className="w-full bg-white rounded-lg border border-[--border] p-4 text-left hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-[--text-light] mb-0.5">{e.numero}</p>
                    <p className="font-medium text-[--text-dark] text-sm">
                      {e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : 'Sin cliente'}
                    </p>
                    <p className="text-xs text-[--text-light] mt-1">
                      {e.encargo_lineas?.length ?? 0} prenda{(e.encargo_lineas?.length ?? 0) !== 1 ? 's' : ''}
                      {e.fecha_entrega_estimada && ` · Entrega: ${formatFecha(e.fecha_entrega_estimada)}`}
                    </p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[e.estado]}`}>
                      {ESTADO_LABELS[e.estado]}
                    </span>
                    <p className="text-sm font-semibold text-[--text-dark]">{formatImporte(e.precio_total)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
