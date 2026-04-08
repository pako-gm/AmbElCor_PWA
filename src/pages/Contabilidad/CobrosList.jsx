import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useContabilidad } from '@/hooks/useContabilidad'
import { formatFecha, formatImporte, TIPO_PAGO_LABELS, FORMA_PAGO_LABELS } from '@/utils/formatters'
import { exportarLibroCobros } from '@/utils/exportExcel'

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL, AÑO_ACTUAL - 1, AÑO_ACTUAL - 2]

export default function CobrosList() {
  const { fetchCobros, loading } = useContabilidad()
  const [cobros, setCobros] = useState([])
  const [año, setAño] = useState(AÑO_ACTUAL)
  const [trimestre, setTrimestre] = useState(0) // 0 = todos

  useEffect(() => {
    fetchCobros({ año, trimestre: trimestre || undefined }).then(setCobros)
  }, [año, trimestre])

  const totalCobrado = cobros
    .filter(c => c.tipo !== 'devolucion')
    .reduce((s, c) => s + parseFloat(c.importe || 0), 0)

  const totalDevoluciones = cobros
    .filter(c => c.tipo === 'devolucion')
    .reduce((s, c) => s + parseFloat(c.importe || 0), 0)

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
      {/* Cabecera filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="font-display text-2xl text-[--text-dark] mr-auto">Cobros a Clientes</h1>
        <select
          value={año}
          onChange={e => setAño(Number(e.target.value))}
          className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
        >
          {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={trimestre}
          onChange={e => setTrimestre(Number(e.target.value))}
          className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value={0}>Todos</option>
          <option value={1}>T1 (Ene–Mar)</option>
          <option value={2}>T2 (Abr–Jun)</option>
          <option value={3}>T3 (Jul–Sep)</option>
          <option value={4}>T4 (Oct–Dic)</option>
        </select>

        <button
          onClick={() => exportarLibroCobros(cobros, { trimestre: trimestre || undefined, año })}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
        >
          <Download size={15} />
          Exportar Excel
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
          <p className="text-xs text-[--text-light] mb-0.5">Total cobrado</p>
          <p className="text-base font-bold text-primary">{formatImporte(totalCobrado)}</p>
        </div>
        <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
          <p className="text-xs text-[--text-light] mb-0.5">Devoluciones</p>
          <p className="text-base font-bold text-red-500">{formatImporte(totalDevoluciones)}</p>
        </div>
        <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
          <p className="text-xs text-[--text-light] mb-0.5">Neto</p>
          <p className="text-base font-bold text-[--text]">{formatImporte(totalCobrado - totalDevoluciones)}</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-[--text-light] text-center py-12">Cargando...</p>
      ) : cobros.length === 0 ? (
        <p className="text-sm text-[--text-light] text-center py-12">No hay cobros en este período.</p>
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          {/* Cabecera tabla (solo desktop) */}
          <div className="hidden md:grid grid-cols-[100px_120px_1fr_100px_110px_100px] gap-4 px-4 py-3 bg-gray-50 border-b border-[--border] text-xs font-semibold text-[--text-light] uppercase tracking-wide">
            <span>Fecha</span>
            <span>Nº Encargo</span>
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Forma pago</span>
            <span className="text-right">Importe</span>
          </div>

          {cobros.map((c, i) => {
            const cliente = c.encargos?.clientes
              ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
              : '—'
            return (
              <div
                key={c.id}
                className={`grid md:grid-cols-[100px_120px_1fr_100px_110px_100px] gap-1 md:gap-4 px-4 py-3 text-sm border-b border-[--border] last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
              >
                <span className="text-[--text-light] text-xs md:text-sm">{formatFecha(c.fecha)}</span>
                <span>
                  {c.encargos?.id ? (
                    <Link to={`/encargos/${c.encargos.id}`} className="text-primary hover:underline font-medium">
                      {c.encargos.numero}
                    </Link>
                  ) : '—'}
                </span>
                <span className="text-[--text]">{cliente}</span>
                <span className={`text-xs font-medium ${c.tipo === 'devolucion' ? 'text-red-500' : 'text-[--text-medium]'}`}>
                  {TIPO_PAGO_LABELS[c.tipo] ?? c.tipo}
                </span>
                <span className="text-[--text-light] text-xs md:text-sm">{FORMA_PAGO_LABELS[c.forma_pago] ?? c.forma_pago}</span>
                <span className={`md:text-right font-semibold ${c.tipo === 'devolucion' ? 'text-red-500' : 'text-[--text]'}`}>
                  {c.tipo === 'devolucion' ? '−' : ''}{formatImporte(c.importe)}
                </span>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </PageWrapper>
  )
}
