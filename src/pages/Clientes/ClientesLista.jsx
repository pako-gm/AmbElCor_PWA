import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchClientes } from '@/hooks/useClientes'
import { formatTelefono } from '@/utils/formatters'

export default function ClientesLista() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchClientes()
      .then(setClientes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtrados = clientes.filter(c => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const nombre = `${c.nombre ?? ''} ${c.apellidos ?? ''}`.toLowerCase()
    return nombre.includes(q) || (c.telefono ?? '').includes(q) || (c.email ?? '').toLowerCase().includes(q)
  })

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[--text-dark]">Clientes</h1>
          <button
            onClick={() => navigate('/clientes/nuevo')}
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
            type="text"
            placeholder="Buscar por nombre, teléfono o email…"
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
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-[--text-light] text-sm">
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'Aún no hay clientes. ¡Crea el primero!'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/clientes/${c.id}`)}
                className="w-full bg-white rounded-lg border border-[--border] p-4 text-left hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[--text-dark] text-sm">
                      {`${c.nombre} ${c.apellidos ?? ''}`.trim()}
                    </p>
                    <p className="text-xs text-[--text-light] mt-0.5">
                      {[formatTelefono(c.telefono), c.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </p>
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
