import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargos } from '@/hooks/useEncargos'
import { formatFecha, formatImporte, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

export default function Dashboard() {
  const navigate = useNavigate()
  const [encargos, setEncargos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEncargos()
      .then(setEncargos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activos = encargos.filter(e => e.estado !== 'entregado')
  const listos = encargos.filter(e => e.estado === 'listo')

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl text-[--text-dark]">Panel</h1>
          <p className="text-xs text-[--text-light] mt-0.5">AmbElCor CRM</p>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-[--border] p-4 text-center">
            <p className="text-2xl font-bold text-primary">{loading ? '…' : activos.length}</p>
            <p className="text-xs text-[--text-light] mt-0.5">Activos</p>
          </div>
          <div className="bg-white rounded-lg border border-[--border] p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{loading ? '…' : listos.length}</p>
            <p className="text-xs text-[--text-light] mt-0.5">Listos</p>
          </div>
          <div className="bg-white rounded-lg border border-[--border] p-4 text-center">
            <p className="text-2xl font-bold text-[--text-dark]">{loading ? '…' : encargos.length}</p>
            <p className="text-xs text-[--text-light] mt-0.5">Total</p>
          </div>
        </div>

        {/* Encargos activos recientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">Encargos activos</h2>
            <button
              onClick={() => navigate('/encargos')}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Ver todos →
            </button>
          </div>
          {loading ? (
            <p className="text-xs text-[--text-light]">Cargando…</p>
          ) : activos.length === 0 ? (
            <p className="text-xs text-[--text-light]">Sin encargos activos.</p>
          ) : (
            <div className="space-y-2">
              {activos.slice(0, 5).map(e => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/encargos/${e.id}`)}
                  className="w-full bg-white rounded-lg border border-[--border] p-3 text-left flex items-center justify-between hover:border-primary transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[--text-dark]">
                      {e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : '—'}
                    </p>
                    <p className="text-xs text-[--text-light]">
                      {e.numero}
                      {e.fecha_entrega_estimada && ` · ${formatFecha(e.fecha_entrega_estimada)}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[e.estado]}`}>
                    {ESTADO_LABELS[e.estado]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
