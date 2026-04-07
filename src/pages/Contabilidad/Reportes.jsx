import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useContabilidad } from '@/hooks/useContabilidad'
import { formatImporte } from '@/utils/formatters'
import { exportarLibroCobros, exportarLibroPagos, exportarBalanceTrimestral } from '@/utils/exportExcel'

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL, AÑO_ACTUAL - 1, AÑO_ACTUAL - 2]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function Reportes() {
  const { fetchResumenAnual, fetchCobros, fetchPagosProveedor, loading } = useContabilidad()
  const [año, setAño] = useState(AÑO_ACTUAL)
  const [trimestre, setTrimestre] = useState(1)
  const [resumen, setResumen] = useState([])

  useEffect(() => {
    fetchResumenAnual(año).then(setResumen)
  }, [año])

  const totalCobros = resumen.reduce((s, m) => s + m.cobros, 0)
  const totalGastos = resumen.reduce((s, m) => s + m.gastos, 0)
  const resultado = totalCobros - totalGastos

  const maxValor = Math.max(...resumen.map(m => Math.max(m.cobros, m.gastos)), 1)

  const handleExportCobros = async () => {
    const cobros = await fetchCobros({ año, trimestre })
    exportarLibroCobros(cobros, { trimestre, año })
  }

  const handleExportPagos = async () => {
    const pagos = await fetchPagosProveedor({ año, trimestre })
    exportarLibroPagos(pagos, { trimestre, año })
  }

  const handleExportBalance = async () => {
    const [cobros, pagos] = await Promise.all([
      fetchCobros({ año, trimestre }),
      fetchPagosProveedor({ año, trimestre }),
    ])
    exportarBalanceTrimestral(cobros, pagos, { trimestre, año })
  }

  return (
    <PageWrapper title="Reportes">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {/* Selector año */}
        <div className="flex items-center gap-3 mb-8">
          <label className="text-sm text-[--text-medium] font-medium">Año:</label>
          <select
            value={año}
            onChange={e => setAño(Number(e.target.value))}
            className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
          >
            {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Gráfico de barras CSS */}
        {loading ? (
          <p className="text-sm text-[--text-light] text-center py-12">Cargando...</p>
        ) : (
          <div className="bg-white border border-[--border] rounded-xl p-6 mb-6">
            <div className="flex items-center gap-6 mb-6">
              <span className="flex items-center gap-2 text-xs text-[--text-medium]">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Cobros
              </span>
              <span className="flex items-center gap-2 text-xs text-[--text-medium]">
                <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Gastos
              </span>
            </div>

            <div className="flex items-end gap-1 md:gap-2 h-48">
              {resumen.map((m) => {
                const altCobros = Math.round((m.cobros / maxValor) * 100)
                const altGastos = Math.round((m.gastos / maxValor) * 100)
                return (
                  <div key={m.mes} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex items-end gap-0.5 h-40">
                      <div
                        className="flex-1 bg-primary rounded-t transition-all duration-500"
                        style={{ height: `${altCobros}%`, minHeight: altCobros > 0 ? '2px' : '0' }}
                        title={`Cobros: ${formatImporte(m.cobros)}`}
                      />
                      <div
                        className="flex-1 bg-amber-400 rounded-t transition-all duration-500"
                        style={{ height: `${altGastos}%`, minHeight: altGastos > 0 ? '2px' : '0' }}
                        title={`Gastos: ${formatImporte(m.gastos)}`}
                      />
                    </div>
                    <span className="text-[10px] text-[--text-light] mt-1">{MESES[m.mes - 1]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resumen anual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[--border] rounded-xl p-4">
            <p className="text-xs text-[--text-light] mb-1">Total cobrado {año}</p>
            <p className="text-xl font-bold text-primary">{formatImporte(totalCobros)}</p>
          </div>
          <div className="bg-white border border-[--border] rounded-xl p-4">
            <p className="text-xs text-[--text-light] mb-1">Total gastado {año}</p>
            <p className="text-xl font-bold text-amber-600">{formatImporte(totalGastos)}</p>
          </div>
          <div className="bg-white border border-[--border] rounded-xl p-4">
            <p className="text-xs text-[--text-light] mb-1">Resultado {año}</p>
            <p className={`text-xl font-bold ${resultado >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatImporte(resultado)}
            </p>
          </div>
        </div>

        {/* Sección exportación */}
        <div className="bg-white border border-[--border] rounded-xl p-6">
          <h3 className="font-semibold text-[--text] mb-4">Exportar libros contables</h3>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Trimestre</label>
              <select
                value={trimestre}
                onChange={e => setTrimestre(Number(e.target.value))}
                className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value={1}>T1 — Ene, Feb, Mar</option>
                <option value={2}>T2 — Abr, May, Jun</option>
                <option value={3}>T3 — Jul, Ago, Sep</option>
                <option value={4}>T4 — Oct, Nov, Dic</option>
              </select>
            </div>

            <button
              onClick={handleExportBalance}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
            >
              <Download size={15} />
              Balance trimestral completo
            </button>

            <button
              onClick={handleExportCobros}
              className="flex items-center gap-2 border border-[--border] bg-white text-[--text-medium] px-4 py-2 rounded-md text-sm hover:border-primary hover:text-primary transition-colors"
            >
              <Download size={15} />
              Libro de Cobros
            </button>

            <button
              onClick={handleExportPagos}
              className="flex items-center gap-2 border border-[--border] bg-white text-[--text-medium] px-4 py-2 rounded-md text-sm hover:border-primary hover:text-primary transition-colors"
            >
              <Download size={15} />
              Libro de Gastos
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
