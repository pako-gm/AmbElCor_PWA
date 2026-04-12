import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Pencil } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchPrendasCatalogo, toggleActivoPrenda } from '@/hooks/useCatalogo'
import { formatImporte } from '@/utils/formatters'

export default function CatalogoLista() {
  const navigate = useNavigate()
  const [prendas, setPrendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivas, setMostrarInactivas] = useState(false)

  const cargar = () => {
    setLoading(true)
    fetchPrendasCatalogo()
      .then(setPrendas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const handleToggleActivo = async (id, activo) => {
    setPrendas(prev => prev.map(p => p.id === id ? { ...p, activo } : p))
    await toggleActivoPrenda(id, activo).catch(() => cargar())
  }

  const filtradas = prendas.filter(p => {
    if (!mostrarInactivas && !p.activo) return false
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (p.nombre ?? '').toLowerCase().includes(q) ||
      (p.descripcion ?? '').toLowerCase().includes(q)
  })

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[--text-dark]">Catálogo</h1>
          <button
            onClick={() => navigate('/catalogo/nueva')}
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} />
            Nueva prenda
          </button>
        </div>

        {/* Buscador + filtro */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-light]" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[--border] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[--text-light] hover:text-[--text-dark]"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => setMostrarInactivas(v => !v)}
            className={`text-xs px-3 py-2 rounded-md border transition-colors whitespace-nowrap ${
              mostrarInactivas
                ? 'bg-primary text-white border-primary'
                : 'border-[--border] text-[--text-medium] hover:border-primary hover:text-primary'
            }`}
          >
            {mostrarInactivas ? 'Ocultar inactivas' : 'Ver inactivas'}
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-[--text-light] text-sm">Cargando…</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12 text-[--text-light] text-sm">
            {busqueda ? 'Sin resultados.' : 'Aún no hay prendas en el catálogo.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map(p => (
              <div
                key={p.id}
                className={`bg-white rounded-lg border p-4 flex items-center gap-3 transition-colors ${
                  p.activo ? 'border-[--border]' : 'border-dashed border-gray-200 opacity-60'
                }`}
              >
                {/* Toggle activo */}
                <button
                  onClick={() => handleToggleActivo(p.id, !p.activo)}
                  title={p.activo ? 'Desactivar' : 'Activar'}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                    p.activo ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    p.activo ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[--text-dark] truncate">{p.nombre}</p>
                  {p.descripcion && (
                    <p className="text-xs text-[--text-light] truncate">{p.descripcion}</p>
                  )}
                </div>

                {/* Precio */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[--text-dark]">
                    {formatImporte(p.precio_base)}
                  </p>
                  {p.descuento > 0 && (
                    <p className="text-xs text-green-600">−{p.descuento}%</p>
                  )}
                </div>

                {/* Editar */}
                <button
                  onClick={() => navigate(`/catalogo/${p.id}`)}
                  className="text-[--text-light] hover:text-primary transition-colors p-1"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
