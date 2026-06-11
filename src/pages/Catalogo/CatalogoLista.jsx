import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Pencil } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchPrendasCatalogo } from '@/hooks/useCatalogo'
import { formatImporte } from '@/utils/formatters'

export default function CatalogoLista() {
  const navigate = useNavigate()
  const [prendas, setPrendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchPrendasCatalogo()
      .then(setPrendas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtradas = prendas.filter(p => {
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

        {/* Buscador */}
        <div className="relative">
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
                  p.activo ? 'border-[--border]' : 'border-dashed border-gray-200 opacity-50'
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${p.activo ? 'text-[--text-dark]' : 'text-[--text-light]'}`}>
                    {p.nombre}
                  </p>
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
