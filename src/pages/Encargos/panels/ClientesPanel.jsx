import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { fetchClientes } from '@/hooks/useClientes'
import { formatTelefono } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'

export default function ClientesPanel() {
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
    <div className="space-y-4">
      {/* Buscador */}
      <SearchInput
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por nombre, teléfono o email…"
      />

      {/* Lista */}
      {loading ? (
        <LoadingState />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          titulo={busqueda ? 'Sin resultados para esa búsqueda.' : 'Aún no hay clientes.'}
          accion={!busqueda && (
            <Button onClick={() => navigate('/clientes/nuevo')}>
              <Plus size={16} />
              Crear el primero
            </Button>
          )}
        />
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
  )
}
