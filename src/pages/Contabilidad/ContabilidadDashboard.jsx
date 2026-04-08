import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useContabilidad } from '@/hooks/useContabilidad'
import { formatImporte, CATEGORIA_GASTO_LABELS } from '@/utils/formatters'

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL, AÑO_ACTUAL - 1, AÑO_ACTUAL - 2]

const CATEGORIA_COLORES = {
  material:                '#30BAAA',
  cuota_autonomo:          '#C8A96E',
  alquiler:                '#6366F1',
  suministros:             '#F59E0B',
  servicios_profesionales: '#8B5CF6',
  impuestos:               '#EF4444',
  transporte:              '#3B82F6',
  marketing:               '#EC4899',
  seguros:                 '#10B981',
  otros:                   '#9CA3AF',
}

function buildConicGradient(data, totalGastos) {
  if (!totalGastos || data.length === 0) return 'conic-gradient(#E5E7EB 0deg 360deg)'
  let cursor = 0
  const stops = data.map(({ categoria, total }) => {
    const deg = (total / totalGastos) * 360
    const color = CATEGORIA_COLORES[categoria] ?? '#9CA3AF'
    const start = cursor
    cursor += deg
    return `${color} ${start.toFixed(1)}deg ${cursor.toFixed(1)}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

export default function ContabilidadDashboard() {
  const { fetchResumenPorCategoria, fetchCobros, loading } = useContabilidad()
  const [año, setAño] = useState(AÑO_ACTUAL)
  const [trimestre, setTrimestre] = useState(0)
  const [categorias, setCategorias] = useState([])
  const [totalIngresos, setTotalIngresos] = useState(0)

  useEffect(() => {
    const t = trimestre || undefined
    Promise.all([
      fetchResumenPorCategoria(año, t),
      fetchCobros({ año, trimestre: t }),
    ]).then(([cats, cobros]) => {
      setCategorias(cats)
      const neto = cobros
        .filter(c => c.tipo !== 'devolucion')
        .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
      setTotalIngresos(neto)
    })
  }, [año, trimestre])

  const totalGastos = categorias.reduce((s, c) => s + c.total, 0)
  const balance = totalIngresos - totalGastos
  const gradient = buildConicGradient(categorias, totalGastos)
  const maxBar = Math.max(totalIngresos, totalGastos, 1)

  const periodoLabel = trimestre ? `T${trimestre} ${año}` : `Año ${año}`

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Cabecera + selector período */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-[--text-dark]">Contabilidad</h1>
          <div className="flex items-center gap-2">
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
              <option value={0}>Anual</option>
              <option value={1}>T1 (Ene–Mar)</option>
              <option value={2}>T2 (Abr–Jun)</option>
              <option value={3}>T3 (Jul–Sep)</option>
              <option value={4}>T4 (Oct–Dic)</option>
            </select>
          </div>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[--border] rounded-xl p-5">
            <p className="text-xs text-[--text-light] mb-1">Total ingresos</p>
            <p className="text-2xl font-bold text-primary">{formatImporte(totalIngresos)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={12} className="text-primary" />
              <span className="text-[10px] text-[--text-light]">Cobros del período</span>
            </div>
          </div>
          <div className="bg-white border border-[--border] rounded-xl p-5">
            <p className="text-xs text-[--text-light] mb-1">Total gastos</p>
            <p className="text-2xl font-bold text-amber-600">{formatImporte(totalGastos)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingDown size={12} className="text-amber-600" />
              <span className="text-[10px] text-[--text-light]">Todas las categorías</span>
            </div>
          </div>
          <div className="bg-white border border-[--border] rounded-xl p-5">
            <p className="text-xs text-[--text-light] mb-1">Resultado</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatImporte(balance)}
            </p>
            <p className="text-[10px] text-[--text-light] mt-1.5">
              {balance >= 0 ? 'Superávit' : 'Déficit'} del período
            </p>
          </div>
        </div>

        {/* Gráfico de tarta + leyenda */}
        {loading ? (
          <p className="text-sm text-[--text-light] text-center py-12">Cargando...</p>
        ) : (
          <div className="bg-white border border-[--border] rounded-xl p-6">
            <h2 className="font-semibold text-[--text] text-sm mb-5">Desglose de gastos por categoría</h2>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Donut CSS */}
              <div className="relative shrink-0" style={{ width: 184, height: 184 }}>
                <div
                  className="w-full h-full rounded-full"
                  style={{ background: gradient }}
                />
                {/* Agujero central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="bg-white rounded-full flex flex-col items-center justify-center text-center px-2"
                    style={{ width: 104, height: 104 }}
                  >
                    <span className="text-[9px] text-[--text-light] leading-tight">Gastos</span>
                    <span className="text-sm font-bold text-[--text-dark] leading-snug mt-0.5">
                      {formatImporte(totalGastos)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {categorias.length === 0 ? (
                  <p className="text-xs text-[--text-light] col-span-2">Sin gastos registrados en este período.</p>
                ) : (
                  categorias.map(({ categoria, total }) => {
                    const pct = totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : '0.0'
                    const color = CATEGORIA_COLORES[categoria] ?? '#9CA3AF'
                    const label = CATEGORIA_GASTO_LABELS[categoria] ?? categoria
                    return (
                      <div key={categoria} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-[--text-medium] leading-snug">{label}</p>
                          <p className="text-[10px] text-[--text-light]">
                            {formatImporte(total)} · <span className="font-medium">{pct}%</span>
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Barras ingresos vs gastos */}
            {(totalIngresos > 0 || totalGastos > 0) && (
              <div className="mt-6 pt-5 border-t border-[--border] space-y-2.5">
                <p className="text-xs font-medium text-[--text-medium] mb-3">Ingresos vs Gastos</p>
                {[
                  { label: 'Ingresos', value: totalIngresos, barClass: 'bg-primary',    textClass: 'text-primary' },
                  { label: 'Gastos',   value: totalGastos,   barClass: 'bg-amber-400',  textClass: 'text-amber-600' },
                ].map(({ label, value, barClass, textClass }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[10px] text-[--text-light] w-14 shrink-0">{label}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barClass} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.round((value / maxBar) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${textClass} w-24 text-right shrink-0`}>
                      {formatImporte(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/contabilidad/cobros',   label: 'Cobros',   desc: 'Pagos recibidos de clientes',      colorClass: 'text-primary',        borderHover: 'hover:border-primary' },
            { to: '/contabilidad/pagos',    label: 'Gastos',   desc: 'Proveedores y gastos generales',   colorClass: 'text-amber-600',       borderHover: 'hover:border-amber-400' },
            { to: '/contabilidad/reportes', label: 'Reportes', desc: 'Gráficos anuales y exportación',   colorClass: 'text-[--text-medium]', borderHover: 'hover:border-[--text-medium]' },
          ].map(({ to, label, desc, colorClass, borderHover }) => (
            <Link
              key={to}
              to={to}
              className={`bg-white border border-[--border] ${borderHover} rounded-xl p-5 flex items-center justify-between group transition-colors`}
            >
              <div>
                <p className={`font-semibold text-sm ${colorClass}`}>{label}</p>
                <p className="text-xs text-[--text-light] mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-[--text-light] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          ))}
        </div>

      </div>
    </PageWrapper>
  )
}
