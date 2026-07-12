import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { fetchVenta } from '@/hooks/useVentas'
import { formatFecha, formatImporte, FORMA_PAGO_LABELS } from '@/utils/formatters'

export default function VentaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [venta, setVenta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVenta(id)
      .then(setVenta)
      .catch(() => setError('No se pudo cargar la venta.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageWrapper><LoadingState /></PageWrapper>
  if (error || !venta) return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader titulo="Venta" backTo="/ventas" />
        <p className="text-sm text-red-600 mt-4">{error || 'Venta no encontrada.'}</p>
      </div>
    </PageWrapper>
  )

  const margenTotal = venta.venta_lineas.reduce(
    (sum, l) => sum + l.cantidad * (l.precio_unitario_venta - l.precio_unitario_coste), 0
  )

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <PageHeader
          titulo={venta.numero}
          subtitulo={formatFecha(venta.fecha)}
          backTo="/ventas"
          accion={
            <Button variant="secondary" size="sm" onClick={() => navigate(`/ventas/${id}/editar`)}>
              <Pencil size={14} />
              Editar
            </Button>
          }
        />

        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[--text-medium]">Cliente</span>
            <span className="font-medium text-[--text-dark]">
              {venta.clientes ? `${venta.clientes.nombre} ${venta.clientes.apellidos ?? ''}`.trim() : 'Venta directa (sin cliente)'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[--text-medium]">Forma de pago</span>
            <span className="font-medium text-[--text-dark]">{FORMA_PAGO_LABELS[venta.forma_pago] ?? venta.forma_pago}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[--text-medium]">Estado</span>
            <span className="font-medium text-[--text-dark] capitalize">{venta.estado}</span>
          </div>
          {venta.notas && (
            <div className="pt-2 border-t border-[--border] text-sm text-[--text-medium]">{venta.notas}</div>
          )}
        </section>

        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Artículos</h2>
          <div className="space-y-3">
            {venta.venta_lineas.map(l => {
              const margenLinea = l.cantidad * (l.precio_unitario_venta - l.precio_unitario_coste)
              return (
                <div key={l.id} className="flex items-start justify-between gap-3 pb-3 border-b border-[--border] last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <button
                      onClick={() => l.materiales && navigate(`/inventario/${l.materiales.id}`)}
                      className="text-sm font-medium text-[--text-dark] hover:text-primary transition-colors text-left"
                    >
                      {l.descripcion}
                    </button>
                    <p className="text-xs text-[--text-light]">
                      {l.cantidad} × {formatImporte(l.precio_unitario_venta)} · coste {formatImporte(l.precio_unitario_coste)}/ud
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[--text-dark]">
                      {formatImporte(l.cantidad * l.precio_unitario_venta)}
                    </p>
                    <p className="text-xs text-green-600">
                      +{formatImporte(margenLinea)} margen
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[--border]">
            <span className="text-sm font-semibold text-[--text-medium]">Total</span>
            <span className="text-lg font-bold text-[--text-dark]">{formatImporte(venta.total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[--text-medium]">Margen de la venta</span>
            <span className="text-sm font-semibold text-green-600">{formatImporte(margenTotal)}</span>
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}
