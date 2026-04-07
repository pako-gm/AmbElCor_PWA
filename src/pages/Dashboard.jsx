import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargos } from '@/hooks/useEncargos'
import { useContabilidad } from '@/hooks/useContabilidad'
import { formatFecha, formatImporte, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

const AÑO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL = new Date().getMonth() // 0-based
const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function calcPct(actual, anterior) {
  if (!anterior) return null
  return Math.round(((actual - anterior) / anterior) * 100)
}

function ComparativaLabel({ actual, anterior, label }) {
  const pct = calcPct(actual, anterior)
  if (anterior === 0) return <p className="text-[10px] text-[--text-light] mt-0.5">— sin datos {label}</p>
  const up = pct >= 0
  return (
    <p className="text-[10px] text-[--text-light] mt-0.5">
      vs {label}: <span className={up ? 'text-green-600' : 'text-red-500'}>{up ? '▲' : '▼'} {Math.abs(pct)}%</span>
    </p>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { fetchCobros, fetchPagosProveedor } = useContabilidad()

  const [encargos, setEncargos] = useState([])
  const [loadingEncargos, setLoadingEncargos] = useState(true)
  const [ingresosMes, setIngresosMes] = useState(0)
  const [gastosMes, setGastosMes] = useState(0)
  const [ingresosMesAnt, setIngresosMesAnt] = useState(0)
  const [gastosMesAnt, setGastosMesAnt] = useState(0)
  const [loadingContable, setLoadingContable] = useState(true)

  useEffect(() => {
    fetchEncargos()
      .then(setEncargos)
      .catch(console.error)
      .finally(() => setLoadingEncargos(false))
  }, [])

  useEffect(() => {
    const mesAnt = MES_ACTUAL === 0 ? 11 : MES_ACTUAL - 1
    const añoMesAnt = MES_ACTUAL === 0 ? AÑO_ACTUAL - 1 : AÑO_ACTUAL

    Promise.all([
      fetchCobros({ año: AÑO_ACTUAL }),
      fetchPagosProveedor({ año: AÑO_ACTUAL === añoMesAnt ? AÑO_ACTUAL : añoMesAnt }),
    ]).then(([cobros, pagos]) => {
      // Cobros también del año anterior si mes actual es enero
      const allCobrosPromise = MES_ACTUAL === 0
        ? fetchCobros({ año: AÑO_ACTUAL - 1 }).then(ant => [...cobros, ...ant])
        : Promise.resolve(cobros)
      const allPagosPromise = MES_ACTUAL === 0
        ? fetchPagosProveedor({ año: AÑO_ACTUAL - 1 }).then(ant => [...pagos, ...ant])
        : Promise.resolve(pagos)

      Promise.all([allCobrosPromise, allPagosPromise]).then(([allCobros, allPagos]) => {
        const sumMes = (arr, mes, año) =>
          arr
            .filter(r => {
              const d = new Date(r.fecha)
              return d.getFullYear() === año && d.getMonth() === mes
            })
            .reduce((s, r) => s + parseFloat(r.importe || 0), 0)

        setIngresosMes(sumMes(allCobros, MES_ACTUAL, AÑO_ACTUAL))
        setGastosMes(sumMes(allPagos, MES_ACTUAL, AÑO_ACTUAL))
        setIngresosMesAnt(sumMes(allCobros, mesAnt, añoMesAnt))
        setGastosMesAnt(sumMes(allPagos, mesAnt, añoMesAnt))
        setLoadingContable(false)
      })
    })
  }, [])

  const activos = encargos.filter(e => e.estado !== 'entregado')
  const listos = encargos.filter(e => e.estado === 'listo')
  const balanceMes = ingresosMes - gastosMes

  const maxContable = Math.max(ingresosMes, gastosMes, 1)
  const pctIngresos = Math.round((ingresosMes / maxContable) * 100)
  const pctGastos = Math.round((gastosMes / maxContable) * 100)

  const mesPasadoNombre = MESES_NOMBRES[MES_ACTUAL === 0 ? 11 : MES_ACTUAL - 1]

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl text-[--text-dark]">Panel</h1>
          <p className="text-xs text-[--text-light] mt-0.5">AmbElCor CRM</p>
        </div>

        {/* Métricas encargos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-[--border] p-4 text-center">
            <p className="text-2xl font-bold text-primary">{loadingEncargos ? '…' : activos.length}</p>
            <p className="text-xs text-[--text-light] mt-0.5">Activos</p>
          </div>
          <div className="bg-white rounded-lg border border-[--border] p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{loadingEncargos ? '…' : listos.length}</p>
            <p className="text-xs text-[--text-light] mt-0.5">Listos</p>
          </div>
          <div className="bg-white rounded-lg border border-[--border] p-4 text-center">
            <p className="text-2xl font-bold text-[--text-dark]">{loadingEncargos ? '…' : encargos.length}</p>
            <p className="text-xs text-[--text-light] mt-0.5">Total</p>
          </div>
        </div>

        {/* Encargos activos recientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">Encargos activos</h2>
            <button
              onClick={() => navigate('/encargos')}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Ver todos →
            </button>
          </div>
          {loadingEncargos ? (
            <p className="text-xs text-[--text-light]">Cargando…</p>
          ) : activos.length === 0 ? (
            <p className="text-xs text-[--text-light]">Sin encargos activos.</p>
          ) : (
            <div className="space-y-2">
              {activos.slice(0, 5).map(e => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/encargos/${e.id}`)}
                  className="w-full bg-white rounded-lg border border-[--border] p-3 text-left flex items-center justify-between hover:border-primary transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[--text-dark]">
                      {e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : '—'}
                    </p>
                    <p className="text-xs text-[--text-light]">
                      {e.numero}
                      {e.fecha_entrega_estimada && ` · ${formatFecha(e.fecha_entrega_estimada)}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[e.estado]}`}>
                    {ESTADO_LABELS[e.estado]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resumen contable del mes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">
              Contabilidad — {MESES_NOMBRES[MES_ACTUAL]}
            </h2>
            <button
              onClick={() => navigate('/contabilidad/reportes')}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Ver reportes →
            </button>
          </div>

          {loadingContable ? (
            <p className="text-xs text-[--text-light]">Cargando…</p>
          ) : (
            <div className="space-y-3">
              {/* Tarjetas ingresos / gastos / balance */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg border border-[--border] p-3">
                  <p className="text-xs text-[--text-light]">Ingresos</p>
                  <p className="text-base font-bold text-primary">{formatImporte(ingresosMes)}</p>
                  <ComparativaLabel actual={ingresosMes} anterior={ingresosMesAnt} label={mesPasadoNombre} />
                </div>
                <div className="bg-white rounded-lg border border-[--border] p-3">
                  <p className="text-xs text-[--text-light]">Gastos</p>
                  <p className="text-base font-bold text-amber-600">{formatImporte(gastosMes)}</p>
                  <ComparativaLabel actual={gastosMes} anterior={gastosMesAnt} label={mesPasadoNombre} />
                </div>
                <div className="bg-white rounded-lg border border-[--border] p-3">
                  <p className="text-xs text-[--text-light]">Balance</p>
                  <p className={`text-base font-bold ${balanceMes >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatImporte(balanceMes)}
                  </p>
                </div>
              </div>

              {/* Mini gráfico barras horizontal */}
              <div className="bg-white rounded-lg border border-[--border] px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[--text-light] w-14 shrink-0">Ingresos</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pctIngresos}%` }} />
                  </div>
                  <span className="text-[10px] text-[--text-medium] w-20 text-right shrink-0">{formatImporte(ingresosMes)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[--text-light] w-14 shrink-0">Gastos</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pctGastos}%` }} />
                  </div>
                  <span className="text-[10px] text-[--text-medium] w-20 text-right shrink-0">{formatImporte(gastosMes)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
