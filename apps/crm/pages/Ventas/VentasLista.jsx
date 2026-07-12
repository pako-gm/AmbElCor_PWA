import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, ShoppingCart, Info, ChevronDown } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import { fetchVentas } from '@/hooks/useVentas'
import { formatFecha, formatImporte, FORMA_PAGO_LABELS } from '@/utils/formatters'

export default function VentasLista() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [ayudaAbierta, setAyudaAbierta] = useState(false)

  useEffect(() => {
    fetchVentas()
      .then(setVentas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      <div className="w-full px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-6">
        <PageHeader
          titulo="Venta directa al Cliente"
          accion={
            <Button onClick={() => navigate('/ventas/nueva')}>
              <Plus size={16} />
              Nueva venta
            </Button>
          }
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <button
            type="button"
            onClick={() => setAyudaAbierta(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <Info size={24} className="flex-shrink-0 text-blue-500" />
            <span className="font-semibold text-blue-900 flex-1">¿Como vender una prenda?</span>
            <ChevronDown size={16} className={`flex-shrink-0 text-blue-500 transition-transform ${ayudaAbierta ? 'rotate-180' : ''}`} />
          </button>
          {ayudaAbierta && (
            <div className="px-4 pb-4 pl-[42px] space-y-2">
              <p className="text-blue-800">
                Solo pueden venderse los artículos del <Link to="/encargos?tab=catalogo" className="underline font-medium">Catálogo</Link> marcados
                como "Solo venta directa" o "Ambos", que dispongan de stock en el <Link to="/inventario" className="underline font-medium">Inventario</Link>.
              </p>
              <p className="font-semibold text-blue-900">Dar de alta un artículo nuevo para su venta:</p>
              <p className="text-blue-800">1) En Catálogo, márcalo como vendible (solo venta directa / ambos) y enlázalo a un material ya existente (o crea un nuevo material con el botón: "+ Nuevo").</p>
              <p className="text-blue-800">2) Dale entrada de stock a ese material desde el Inventario.</p>
              <p className="text-blue-800">3) Y aparecerá aquí para su venta.</p>
              <p className="font-semibold text-blue-900">Vender una prenda:</p>
              <p className="text-blue-800">1) Pulsar en el botón "+Nueva Prenda".</p>
              <p className="text-blue-800">2) Rellena los campos necesarios y elige un articulo de la lista.</p>
              <p className="text-blue-800">3) Confirma la venta.</p>

            </div>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : ventas.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            titulo="Aún no hay ventas registradas."
            accion={
              <Button onClick={() => navigate('/ventas/nueva')}>
                <Plus size={16} />
                Registrar la primera
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {ventas.map(v => (
              <button
                key={v.id}
                onClick={() => navigate(`/ventas/${v.id}`)}
                className="w-full bg-white rounded-lg border border-[--border] p-4 flex items-center gap-3 text-left hover:border-primary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[--text-dark]">
                    {v.numero} · {v.clientes ? `${v.clientes.nombre} ${v.clientes.apellidos ?? ''}`.trim() : 'Venta directa'}
                  </p>
                  <p className="text-xs text-[--text-light]">
                    {formatFecha(v.fecha)} · {v.num_lineas} {v.num_lineas === 1 ? 'artículo' : 'artículos'} · {FORMA_PAGO_LABELS[v.forma_pago] ?? v.forma_pago}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[--text-dark] flex-shrink-0">
                  {formatImporte(v.total)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
