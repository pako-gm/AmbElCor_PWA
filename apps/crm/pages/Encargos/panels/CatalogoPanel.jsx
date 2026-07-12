import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Tag, Euro } from 'lucide-react'
import { fetchPrendasCatalogo } from '@/hooks/useCatalogo'
import { formatImporte } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'

export default function CatalogoPanel() {
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
    <div className="space-y-4">
      {/* Buscador */}
      <SearchInput
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por nombre…"
      />

      {/* Lista */}
      {loading ? (
        <LoadingState />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Tag}
          titulo={busqueda ? 'Sin resultados.' : 'Aún no hay prendas en el catálogo.'}
          accion={!busqueda && (
            <Button onClick={() => navigate('/catalogo/nueva')}>
              <Plus size={16} />
              Crear la primera
            </Button>
          )}
        />
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
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${p.activo ? 'text-[--text-dark]' : 'text-[--text-light]'}`}>
                    {p.nombre}
                  </p>
                  {p.tipo_uso !== 'solo_encargo' && (
                    <span
                      className="inline-flex items-center gap-1 flex-shrink-0 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      title="Disponible para venta directa"
                    >
                      <Euro size={12} strokeWidth={2.5} />
                      Venta directa
                    </span>
                  )}
                </div>
                {p.descripcion && (
                  <p className="text-xs text-[--text-light] truncate">{p.descripcion}</p>
                )}
              </div>

              {/* Precio */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[--text-dark]">
                  {formatImporte(p.precio_base)}
                </p>
              </div>

              {/* Editar */}
              <button
                onClick={() => navigate(`/catalogo/${p.id}`)}
                className="text-[--text-light] hover:text-primary transition-colors p-1"
                title="Editar"
                aria-label={`Editar ${p.nombre}`}
              >
                <Pencil size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
