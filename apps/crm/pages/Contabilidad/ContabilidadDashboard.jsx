import { useState, useEffect, useMemo, Fragment } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Download, Plus, Pencil, Trash2, ArrowRight, ChevronLeft } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useContabilidad, rangoTrimestre } from '@/hooks/useContabilidad'
import { fetchVentas } from '@/hooks/useVentas'
import {
  formatFecha, formatImporte,
  FORMA_PAGO_LABELS, CATEGORIA_GASTO_LABELS,
} from '@/utils/formatters'
import { sanitizers } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'
import LoadingState from '@/components/ui/LoadingState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { exportarLibroCobros, exportarLibroPagos, exportarLibroDiario } from '@/utils/exportExcel'

// ─── Constantes ───────────────────────────────────────────────────────────────

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL, AÑO_ACTUAL - 1, AÑO_ACTUAL - 2]
const FORMAS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'bizum']
const MESES_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const NOMBRES_MES = {
  '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio',
  '07':'Julio','08':'Agosto','09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre',
}

const CATEGORIA_COLORES = {
  material: '#1fb39a', cuota_autonomo: '#8b5cd6', alquiler: '#c2872a',
  suministros: '#9b1f8c', servicios_profesionales: '#4f86d6', transporte: '#d6537d',
  marketing: '#5b7088', impuestos: '#e0563f', seguros: '#10B981', otros: '#9CA3AF',
}

const ESTADO_COBRO = {
  cobrado:   { label: 'Cobrado',   cls: 'bg-green-100 text-green-700' },
  pendiente: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  vencido:   { label: 'Vencido',   cls: 'bg-red-100 text-red-600' },
}

const ESTADO_PAGO = {
  pagado:    { label: 'Pagado',    cls: 'bg-green-100 text-green-700' },
  pendiente: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
}

const ESTADO_PERDIDA = {
  condonado: { label: 'Condonado', cls: 'bg-gray-100 text-gray-600' },
}

const formVacio = {
  proveedor_id: '', fecha: new Date().toISOString().slice(0, 10),
  concepto: '', importe: '', forma_pago: 'efectivo', referencia: '',
  categoria: 'material', base_imponible: '', iva_porcentaje: 21, iva_importe: '',
  desglosarIva: false, estado: 'pagado',
}

// Clave de sessionStorage para conservar el gasto en curso mientras se da de
// alta un proveedor nuevo en la pantalla Proveedores y se vuelve a Registrar gasto.
const GASTO_BORRADOR_KEY = 'ambelcor:gasto_borrador'

// ─── Componentes compartidos ──────────────────────────────────────────────────

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'bg-gray-100 text-[--text-medium] hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, tone = 'ink', hint }) {
  const tones = { green: 'text-green-600', red: 'text-red-500', amber: 'text-amber-600', ink: 'text-[--text-dark]' }
  return (
    <div className="bg-white border border-[--border] rounded-xl p-4">
      <p className="text-xs text-[--text-light] mb-1">{label}</p>
      <p className={`text-xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-[10px] text-[--text-light] mt-1">{hint}</p>}
    </div>
  )
}

function EstadoPill({ estado, map }) {
  const info = map[estado]
  if (!info) return <span className="text-xs text-[--text-light]">{estado}</span>
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${info.cls}`}>
      {info.label}
    </span>
  )
}

function SearchInput({ value, onChange, placeholder, full }) {
  return (
    <div className={`relative ${full ? 'w-full' : ''}`}>
      <input
        value={value}
        onChange={e => onChange(sanitizers.texto(e.target.value))}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`border border-[--border] rounded-lg pl-7 pr-3 py-1.5 text-xs ${full ? 'w-full' : 'w-40'}`}
      />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[--text-light]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>
    </div>
  )
}

// ─── Escala "bonita" para el eje Y ────────────────────────────────────────────

function escalaEjeY(maxValor) {
  if (!maxValor || maxValor <= 0) return { max: 100, paso: 20 }
  const pasos = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000]
  for (const paso of pasos) {
    const max = Math.ceil(maxValor / paso) * paso
    if (max / paso <= 8) return { max, paso }
  }
  const paso = Math.ceil(maxValor / 8)
  return { max: paso * 8, paso }
}

// ─── Gráfico de barras Ingresos vs Gastos (con ejes) ──────────────────────────

const COLOR_ING = '#1FB39A'
const COLOR_GAS = '#F07979'

function BarChart({ data }) {
  const [hover, setHover] = useState(null)
  const maxValor = Math.max(0, ...data.flatMap(d => [d.ing, d.gas]))
  const { max, paso } = escalaEjeY(maxValor)
  const ticks = []
  for (let v = max; v >= 0; v -= paso) ticks.push(v)
  const H = 220

  return (
    <div>
      <div className="flex" style={{ height: H }}>
        {/* Eje Y */}
        <div className="flex flex-col justify-between pr-2 text-[9px] text-[--text-light] text-right w-10 shrink-0">
          {ticks.map(t => (
            <span key={t} className="leading-none -mt-1">{t}€</span>
          ))}
        </div>
        {/* Zona de barras + rejilla */}
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((t, i) => (
              <div key={t} className={`h-0 border-t ${i === ticks.length - 1 ? 'border-[--text-light]/50' : 'border-[--border]'}`} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-1.5" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const onMove = (e, label, value, color) => {
                const r = e.currentTarget.closest('.relative').getBoundingClientRect()
                setHover({ x: e.clientX - r.left, y: e.clientY - r.top, label, value, color })
              }
              return (
                <div key={i} className="flex-1 h-full flex items-end justify-center gap-0.5">
                  <div className="flex-1 rounded-t-sm transition-all cursor-pointer"
                    onMouseMove={e => onMove(e, `Ingresos ${MESES_LABELS[i]}`, d.ing, COLOR_ING)}
                    style={{ height: `${(d.ing / max) * 100}%`, background: COLOR_ING }} />
                  <div className="flex-1 rounded-t-sm transition-all cursor-pointer"
                    onMouseMove={e => onMove(e, `Gastos ${MESES_LABELS[i]}`, d.gas, COLOR_GAS)}
                    style={{ height: `${(d.gas / max) * 100}%`, background: COLOR_GAS }} />
                </div>
              )
            })}
          </div>
          {hover && (
            <div className="absolute z-10 pointer-events-none flex items-center gap-2 rounded-md bg-[--text-dark] text-white text-xs px-2.5 py-1.5 shadow-lg whitespace-nowrap"
              style={{ left: hover.x, top: hover.y, transform: 'translate(-50%, calc(-100% - 8px))' }}>
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: hover.color }} />
              <span>{hover.label}</span>
              <span className="font-semibold">{formatImporte(hover.value)}</span>
            </div>
          )}
        </div>
      </div>
      {/* Eje X */}
      <div className="flex pl-10">
        {MESES_LABELS.map((m, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-[--text-light] mt-1.5">{m}</span>
        ))}
      </div>
      {/* Leyenda */}
      <div className="flex gap-4 mt-3 pl-10 text-[10px] text-[--text-light]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_ING }} /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_GAS }} /> Gastos
        </span>
      </div>
    </div>
  )
}

// ─── Gráfico donut SVG ────────────────────────────────────────────────────────

function DonutChart({ data, total }) {
  const R = 52, SW = 26, Cf = 2 * Math.PI * R
  let acc = 0
  const [hover, setHover] = useState(null)
  return (
    <div className="flex items-center gap-6 w-full h-full">
      <div className="w-1/2 flex justify-center shrink-0">
        <div className="relative w-[200px]" onMouseLeave={() => setHover(null)}>
        <svg viewBox="0 0 140 140" className="w-full h-auto">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#E5E7EB" strokeWidth={SW} />
            {data.map((d, i) => {
              const len = (d.value / total) * Cf
              const seg = (
                <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={d.color}
                  strokeWidth={SW} strokeDasharray={`${len} ${Cf - len}`} strokeDashoffset={-acc}
                  className="cursor-pointer"
                  onMouseMove={e => {
                    const r = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                    setHover({ i, x: e.clientX - r.left, y: e.clientY - r.top })
                  }} />
              )
              acc += len
              return seg
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-[--text-light]">Gastos</span>
          <span className="text-sm font-bold text-[--text-dark]">{formatImporte(total)}</span>
        </div>
        {hover && data[hover.i] && (
          <div className="absolute z-10 pointer-events-none flex items-center gap-2 rounded-md bg-[--text-dark] text-white text-xs px-2.5 py-1.5 shadow-lg whitespace-nowrap"
            style={{ left: hover.x, top: hover.y, transform: 'translate(-50%, calc(-100% - 8px))' }}>
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: data[hover.i].color }} />
            <span>{data[hover.i].label}</span>
            <span className="font-semibold">{formatImporte(data[hover.i].value)}</span>
          </div>
        )}
        </div>
      </div>
      <ul className="w-1/2 min-w-0 space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((d, i) => (
          <li key={i} className="flex items-start gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: d.color }} />
            <div className="min-w-0">
              <p className="text-[11px] text-[--text-medium] truncate">{d.label}</p>
              <p className="text-[10px] text-[--text-light]">
                {formatImporte(d.value)} · {((d.value / total) * 100).toFixed(1)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── SubNav tabs ──────────────────────────────────────────────────────────────

function SubNav({ tab, setTab }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'cobros',    label: 'Cobros' },
    { key: 'pagos',     label: 'Pagos' },
    { key: 'libro',     label: 'Libro diario' },
  ]
  return (
    <div className="flex items-center gap-0 mb-6 border-b border-[--border]">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            tab === t.key
              ? 'border-primary text-primary'
              : 'border-transparent text-[--text-medium] hover:text-[--text]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardPanel({ año, trimestre, setTab, labelsMap = {}, coloresMap = {} }) {
  const { fetchCobros, fetchPagosProveedor, loading } = useContabilidad()
  const [cobros, setCobros] = useState([])
  const [pagos, setPagos] = useState([])
  const [ventas, setVentas] = useState([])

  useEffect(() => {
    const { desde, hasta } = trimestre
      ? rangoTrimestre(año, trimestre)
      : { desde: `${año}-01-01`, hasta: `${año}-12-31` }
    Promise.all([
      fetchCobros({ año, trimestre: trimestre || undefined }),
      fetchPagosProveedor({ año, trimestre: trimestre || undefined }),
      fetchVentas({ desde, hasta }),
    ]).then(([c, p, v]) => {
      setCobros(c)
      setPagos(p)
      setVentas(v)
    })
  }, [año, trimestre])

  const totalVentas = useMemo(() =>
    ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0)
  , [ventas])

  const ingresosCobrados = useMemo(() =>
    cobros.filter(c => c.estado === 'cobrado' && c.tipo !== 'devolucion' && c.tipo !== 'ajuste_redondeo')
      .reduce((s, c) => s + parseFloat(c.importe || 0), 0) + totalVentas
  , [cobros, totalVentas])

  const perdidasRedondeo = useMemo(() =>
    cobros.filter(c => c.tipo === 'ajuste_redondeo')
      .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  , [cobros])

  const gastosPagados = useMemo(() =>
    pagos.filter(p => p.estado === 'pagado')
      .reduce((s, p) => s + parseFloat(p.importe || 0), 0)
  , [pagos])

  const porCobrar = useMemo(() =>
    cobros.filter(c => c.estado === 'pendiente' || c.estado === 'vencido')
      .reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  , [cobros])

  const vencidos = useMemo(() => cobros.filter(c => c.estado === 'vencido'), [cobros])

  const cobrosPend = useMemo(() =>
    cobros.filter(c => c.estado !== 'cobrado')
      .sort((a, b) => (a.fecha_vencimiento || '9999').localeCompare(b.fecha_vencimiento || '9999'))
      .slice(0, 5)
  , [cobros])

  const pagosPend = useMemo(() => pagos.filter(p => p.estado === 'pendiente').slice(0, 5), [pagos])

  const mesesData = useMemo(() => {
    const data = Array.from({ length: 12 }, () => ({ ing: 0, gas: 0 }))
    cobros.filter(c => c.tipo !== 'devolucion' && c.tipo !== 'ajuste_redondeo').forEach(c => {
      const mes = new Date(c.fecha + 'T00:00:00').getMonth()
      data[mes].ing += parseFloat(c.importe || 0)
    })
    ventas.forEach(v => {
      const mes = new Date(v.fecha + 'T00:00:00').getMonth()
      data[mes].ing += parseFloat(v.total || 0)
    })
    pagos.forEach(p => {
      const mes = new Date(p.fecha + 'T00:00:00').getMonth()
      data[mes].gas += parseFloat(p.importe || 0)
    })
    return data
  }, [cobros, pagos, ventas])

  const categoriaData = useMemo(() => {
    const mapa = {}
    pagos.forEach(p => {
      const cat = p.categoria ?? 'otros'
      mapa[cat] = (mapa[cat] ?? 0) + parseFloat(p.importe || 0)
    })
    return Object.entries(mapa)
      .map(([cat, value]) => ({
        label: labelsMap[cat] ?? CATEGORIA_GASTO_LABELS[cat] ?? cat,
        value,
        color: coloresMap[cat] ?? CATEGORIA_COLORES[cat] ?? '#9CA3AF',
      }))
      .sort((a, b) => b.value - a.value)
  }, [pagos, labelsMap, coloresMap])

  const totalGastosCat = categoriaData.reduce((s, d) => s + d.value, 0)
  const resultado = ingresosCobrados - gastosPagados - perdidasRedondeo

  return (
    <div className="space-y-6">
      {vencidos.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">
            ⚠ {vencidos.length} cobro{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''}
          </span>
          <span className="text-red-500">
            — total {formatImporte(vencidos.reduce((s, c) => s + parseFloat(c.importe || 0), 0))}
          </span>
        </div>
      )}

      {perdidasRedondeo > 0 && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
          <span className="font-semibold">↩ Pérdidas por redondeo este periodo</span>
          <span className="text-gray-500">— total {formatImporte(perdidasRedondeo)}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Ingresos cobrados" value={formatImporte(ingresosCobrados)} tone="green" hint="Incl. ventas directas" />
        <StatCard label="Gastos pagados"    value={formatImporte(gastosPagados)}    tone="red"   hint="Ejercicio actual" />
        <StatCard label="Resultado neto"    value={formatImporte(resultado)}        tone={resultado >= 0 ? 'green' : 'red'} hint="Ingresos − Gastos" />
        <StatCard label="Por cobrar"        value={formatImporte(porCobrar)}        tone="amber" hint="Pendiente + vencido" />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Ingresos vs Gastos */}
            <div className="bg-white border border-[--border] rounded-xl p-5">
              <p className="font-display text-lg text-[--text-dark] mb-4">Ingresos vs Gastos</p>
              <BarChart data={mesesData} />
            </div>

            {/* Distribución de gastos */}
            <div className="bg-white border border-[--border] rounded-xl p-5 flex flex-col">
              <p className="font-display text-lg text-[--text-dark] mb-4">Distribución de gastos</p>
              {categoriaData.length === 0 ? (
                <p className="text-xs text-[--text-light]">Sin gastos registrados.</p>
              ) : (
                <div className="flex-1 flex items-center">
                  <DonutChart data={categoriaData} total={totalGastosCat} />
                </div>
              )}
            </div>
          </div>

          {/* Listas pendientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[--border] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[--text-medium]">Cobros pendientes</p>
                <button
                  onClick={() => setTab('cobros')}
                  className="text-xs border border-[--border] bg-white text-[--text-medium] px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  Ver todos
                </button>
              </div>
              {cobrosPend.length === 0 ? (
                <p className="text-xs text-[--text-light]">Sin cobros pendientes.</p>
              ) : (
                <ul className="space-y-2.5">
                  {cobrosPend.map(c => {
                    const cliente = c.encargos?.clientes
                      ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
                      : '—'
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate text-[--text]">{cliente}</p>
                          {c.fecha_vencimiento && (
                            <p className="text-[10px] text-[--text-light]">
                              Vence {formatFecha(c.fecha_vencimiento)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-[--text]">{formatImporte(c.importe)}</span>
                          <EstadoPill estado={c.estado} map={ESTADO_COBRO} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="bg-white border border-[--border] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[--text-medium]">Pagos pendientes</p>
                <button
                  onClick={() => setTab('pagos')}
                  className="text-xs border border-[--border] bg-white text-[--text-medium] px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  Ver todos
                </button>
              </div>
              {pagosPend.length === 0 ? (
                <p className="text-xs text-[--text-light]">Sin pagos pendientes.</p>
              ) : (
                <ul className="space-y-2.5">
                  {pagosPend.map(p => (
                    <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-[--text]">{p.proveedores?.nombre ?? 'Sin proveedor'}</p>
                        <p className="text-[10px] text-[--text-light] truncate">{p.concepto}</p>
                      </div>
                      <span className="font-semibold text-amber-600 shrink-0">{formatImporte(p.importe)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── COBROS ───────────────────────────────────────────────────────────────────

function CobrosPanel({ año, trimestre }) {
  const toast = useToast()
  const { fetchCobros, marcarEstadoCobro, loading } = useContabilidad()
  const [cobros, setCobros] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [q, setQ] = useState('')
  const [modalCobrar, setModalCobrar] = useState(null)

  const cargar = () => fetchCobros({ año, trimestre: trimestre || undefined }).then(setCobros)
  useEffect(() => { cargar() }, [año, trimestre])

  const rows = cobros.filter(c => {
    if (filtro !== 'todos' && c.estado !== filtro) return false
    if (!q.trim()) return true
    const cliente = c.encargos?.clientes
      ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.toLowerCase()
      : ''
    return cliente.includes(q.toLowerCase())
  })

  const totalAll      = cobros.reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalCobrado  = cobros.filter(c => c.estado === 'cobrado').reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalPendiente= cobros.filter(c => c.estado === 'pendiente').reduce((s, c) => s + parseFloat(c.importe || 0), 0)
  const totalVencido  = cobros.filter(c => c.estado === 'vencido').reduce((s, c) => s + parseFloat(c.importe || 0), 0)

  const handleMarcar = async () => {
    if (!modalCobrar) return
    try {
      await marcarEstadoCobro(modalCobrar.id, 'cobrado')
      toast.success('Cobro marcado como cobrado.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar el cobro.')
    }
    setModalCobrar(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {[['todos','Todos'],['pendiente','Pendiente'],['cobrado','Cobrado'],['vencido','Vencido']].map(([k,l]) => (
            <Chip key={k} active={filtro === k} onClick={() => setFiltro(k)}>{l}</Chip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[--text-light]">Descargar Informe</span>
          <ArrowRight size={14} className="text-[--text-light]" />
          <button
            onClick={() => exportarLibroCobros(cobros, { trimestre: trimestre || undefined, año })}
            className="flex items-center gap-1.5 border border-[--border] bg-white text-[--text-medium] px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
          >
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total"     value={formatImporte(totalAll)}      tone="ink"   hint="Cobrado + pendiente" />
        <StatCard label="Cobrado"   value={formatImporte(totalCobrado)}  tone="green" hint="Ya ingresado" />
        <StatCard label="Pendiente" value={formatImporte(totalPendiente)}tone="amber" hint="En plazo" />
        <StatCard label="Vencido"   value={formatImporte(totalVencido)}  tone="red"   hint="Fuera de plazo" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente…" full />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(150px,1.5fr)_110px_90px_100px_80px_90px_110px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-[10px] font-semibold uppercase tracking-wide text-[--text-light]">
            <span>Cliente</span><span>Nº Encargo</span><span>Fecha</span>
            <span>Vencimiento</span><span>Forma</span><span className="text-right">Importe</span>
            <span>Estado</span>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[--text-light] text-center py-10">Sin cobros que coincidan.</p>
          ) : rows.map((c, i) => {
            const cliente = c.encargos?.clientes
              ? `${c.encargos.clientes.nombre} ${c.encargos.clientes.apellidos ?? ''}`.trim()
              : '—'
            return (
              <div
                key={c.id}
                className={`grid md:grid-cols-[minmax(150px,1.5fr)_110px_90px_100px_80px_90px_110px] gap-1 md:gap-3 px-4 py-3 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 ? 'bg-gray-50/40' : ''}`}
              >
                <span className="font-medium text-[--text] truncate">{cliente}</span>
                <span>
                  {c.encargos?.id ? (
                    <Link to={`/encargos/${c.encargos.id}`} className="text-primary hover:underline text-xs font-medium">
                      {c.encargos.numero}
                    </Link>
                  ) : '—'}
                </span>
                <span className="text-xs text-[--text-light]">{formatFecha(c.fecha)}</span>
                <span className={`text-xs ${c.estado === 'vencido' ? 'text-red-600 font-semibold' : 'text-[--text-light]'}`}>
                  {c.fecha_vencimiento ? formatFecha(c.fecha_vencimiento) : '—'}
                </span>
                <span className="text-xs text-[--text-light]">{FORMA_PAGO_LABELS[c.forma_pago] ?? c.forma_pago}</span>
                <span className={`text-right font-semibold ${c.tipo === 'devolucion' || c.tipo === 'ajuste_redondeo' ? 'text-red-500' : 'text-[--text]'}`}>
                  {formatImporte(c.importe)}
                </span>
                <div className="flex items-center gap-2">
                  <EstadoPill estado={c.estado} map={ESTADO_COBRO} />
                  {c.estado !== 'cobrado' && (
                    <button
                      onClick={() => setModalCobrar({
                        id: c.id,
                        cliente,
                        numero: c.encargos?.numero,
                        importe: c.importe,
                      })}
                      className="text-[10px] text-green-600 hover:underline whitespace-nowrap"
                    >
                      ✓ Cobrar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!modalCobrar}
        title="Confirmar cobro"
        description={modalCobrar
          ? `Marcar como cobrado: ${modalCobrar.cliente}${modalCobrar.numero ? ` · ${modalCobrar.numero}` : ''} · ${formatImporte(modalCobrar.importe)}`
          : ''}
        confirmLabel="Cobrar"
        cancelLabel="Cancelar"
        tone="primary"
        onConfirm={handleMarcar}
        onCancel={() => setModalCobrar(null)}
      />
    </div>
  )
}

// ─── PAGOS ────────────────────────────────────────────────────────────────────

function PagosPanel({ año, trimestre, categorias = [], labelsMap = {} }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    fetchPagosProveedor, registrarPagoProveedor, actualizarPagoProveedor,
    eliminarPagoProveedor, marcarEstadoPago, fetchProveedores, loading,
  } = useContabilidad()

  const [pagos, setPagos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [q, setQ] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [errForm, setErrForm] = useState('')
  const [errCampos, setErrCampos] = useState({})
  const [modalEliminar, setModalEliminar] = useState(null)
  const [modalPagar, setModalPagar] = useState(null)
  const [editando, setEditando] = useState(null)

  const cargar = () => fetchPagosProveedor({ año, trimestre: trimestre || undefined }).then(setPagos)
  useEffect(() => { cargar() }, [año, trimestre])
  useEffect(() => { fetchProveedores().then(setProveedores) }, [])

  // Al volver de dar de alta un proveedor: recupera el gasto en curso y, si se
  // creó un proveedor, lo deja seleccionado en el formulario.
  useEffect(() => {
    const creado = searchParams.get('proveedorCreado')
    const volver = searchParams.get('volverGasto')
    if (!creado && !volver) return
    const raw = sessionStorage.getItem(GASTO_BORRADOR_KEY)
    if (raw) {
      try {
        const borrador = JSON.parse(raw)
        setForm({ ...formVacio, ...borrador, ...(creado ? { proveedor_id: creado } : {}) })
        setMostrarForm(true)
      } catch { /* borrador corrupto: se ignora */ }
    }
    sessionStorage.removeItem(GASTO_BORRADOR_KEY)
    setSearchParams({ tab: 'pagos' }, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guarda el gasto en curso y navega a Proveedores para dar de alta uno nuevo.
  const irANuevoProveedor = () => {
    sessionStorage.setItem(GASTO_BORRADOR_KEY, JSON.stringify(form))
    navigate('/inventario?tab=proveedores&nuevo=gasto')
  }

  const rows = pagos.filter(p =>
    (filtro === 'todos' || p.estado === filtro) &&
    (q.trim() === '' || (p.proveedores?.nombre ?? '').toLowerCase().includes(q.toLowerCase()))
  )

  const totalAll      = pagos.reduce((s, p) => s + parseFloat(p.importe || 0), 0)
  const totalPagado   = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + parseFloat(p.importe || 0), 0)
  const totalPendiente= pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + parseFloat(p.importe || 0), 0)

  const handleBaseIvaChange = (campo, valor) => {
    setForm(f => {
      const next = { ...f, [campo]: valor }
      if (next.desglosarIva && next.base_imponible !== '') {
        const base = parseFloat(next.base_imponible) || 0
        const pct  = parseFloat(next.iva_porcentaje) || 0
        const iva  = Math.round(base * pct) / 100
        next.iva_importe = iva.toFixed(2)
        next.importe = (base + iva).toFixed(2)
      }
      return next
    })
  }

  const cancelarForm = () => {
    setMostrarForm(false); setForm(formVacio); setEditando(null); setErrForm(''); setErrCampos({})
  }

  const iniciarEdicion = (pago) => {
    setForm({
      proveedor_id: pago.proveedores?.id ?? '',
      fecha: pago.fecha,
      concepto: pago.concepto ?? '',
      importe: pago.importe != null ? String(pago.importe) : '',
      forma_pago: pago.forma_pago ?? 'efectivo',
      referencia: pago.referencia ?? '',
      categoria: pago.categoria ?? 'material',
      base_imponible: pago.base_imponible != null ? String(pago.base_imponible) : '',
      iva_porcentaje: pago.iva_porcentaje != null ? pago.iva_porcentaje : 21,
      iva_importe: pago.iva_importe != null ? String(pago.iva_importe) : '',
      desglosarIva: pago.iva_porcentaje != null && pago.base_imponible != null,
      estado: pago.estado ?? 'pagado',
    })
    setEditando(pago.id)
    setMostrarForm(false)
    setErrForm(''); setErrCampos({})
  }

  const handleGuardar = async () => {
    const nuevosErrs = {}
    if (!form.concepto.trim()) nuevosErrs.concepto = 'El concepto es obligatorio.'
    if (!form.importe || isNaN(form.importe)) nuevosErrs.importe = 'Importe inválido.'
    if (Object.keys(nuevosErrs).length > 0) { setErrCampos(nuevosErrs); return }
    setErrCampos({})
    setErrForm('')
    setGuardando(true)
    try {
      const payload = {
        proveedor_id: form.proveedor_id || null,
        fecha: form.fecha, concepto: form.concepto,
        importe: parseFloat(form.importe), forma_pago: form.forma_pago,
        referencia: form.referencia || null, categoria: form.categoria,
        base_imponible: form.base_imponible !== '' ? parseFloat(form.base_imponible) : null,
        iva_porcentaje: form.desglosarIva ? parseFloat(form.iva_porcentaje) : null,
        iva_importe: form.iva_importe !== '' ? parseFloat(form.iva_importe) : null,
        estado: form.estado || 'pagado',
      }
      if (editando) {
        await actualizarPagoProveedor(editando, payload)
        toast.success('Gasto actualizado.')
      } else {
        await registrarPagoProveedor(payload)
        toast.success('Gasto registrado.')
      }
      setForm(formVacio)
      setMostrarForm(false)
      setEditando(null)
      await cargar()
    } catch (e) { setErrForm(e.message) }
    finally { setGuardando(false) }
  }

  const handleEliminar = async () => {
    if (!modalEliminar) return
    try {
      await eliminarPagoProveedor(modalEliminar.id)
      toast.success('Gasto eliminado.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo eliminar el gasto.')
    }
    setModalEliminar(null)
  }


  const handleMarcarPagado = async () => {
    if (!modalPagar) return
    try {
      await marcarEstadoPago(modalPagar.id, 'pagado')
      toast.success('Gasto marcado como pagado.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar el gasto.')
    }
    setModalPagar(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {[['todos','Todos'],['pendiente','Pendiente'],['pagado','Pagado']].map(([k,l]) => (
            <Chip key={k} active={filtro === k} onClick={() => setFiltro(k)}>{l}</Chip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[--text-light]">Descargar Informe</span>
          <ArrowRight size={14} className="text-[--text-light]" />
          <button
            onClick={() => exportarLibroPagos(pagos, { trimestre: trimestre || undefined, año, categoriaLabels: labelsMap })}
            className="flex items-center gap-1.5 border border-[--border] bg-white text-[--text-medium] px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
          >
            <Download size={13} /> Excel
          </button>
          <button
            onClick={() => setMostrarForm(v => {
              const next = !v
              if (next) { setForm(formVacio); setEditando(null); setErrForm(''); setErrCampos({}) }
              return next
            })}
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs hover:bg-primary-dark transition-colors"
          >
            <Plus size={13} /> Registrar gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total"     value={formatImporte(totalAll)}      tone="ink"   hint="Pagado + pendiente" />
        <StatCard label="Pagado"    value={formatImporte(totalPagado)}   tone="green" hint="Ya abonado" />
        <StatCard label="Pendiente" value={formatImporte(totalPendiente)}tone="amber" hint="Sin pagar" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar proveedor…" full />
        </div>
      </div>

      {/* Formulario nuevo gasto */}
      {mostrarForm && !editando && (
        <div className="bg-white border border-[--border] rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-[--text] text-sm">Nuevo gasto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Proveedor (opcional)</label>
              <div className="flex gap-2">
                <select value={form.proveedor_id} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}
                  className="flex-1 border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">— Sin proveedor —</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <button onClick={irANuevoProveedor}
                  title="Dar de alta un proveedor nuevo"
                  className="text-xs border border-dashed border-[--border] px-2 rounded-md text-[--text-light] hover:border-primary hover:text-primary transition-colors">
                  ＋
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Categoría *</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                {(categorias.length
                  ? categorias.map(c => [c.clave, c.etiqueta])
                  : Object.entries(CATEGORIA_GASTO_LABELS)
                ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-xs mb-1 ${errCampos.concepto ? 'text-red-500' : 'text-[--text-light]'}`}>Concepto *</label>
              <input type="text" value={form.concepto}
                onChange={e => { setForm(f => ({ ...f, concepto: sanitizers.texto(e.target.value) })); if (errCampos.concepto) setErrCampos(p => ({ ...p, concepto: undefined })) }}
                placeholder="Descripción del gasto"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errCampos.concepto ? 'border-red-400' : 'border-[--border]'}`} />
              {errCampos.concepto && <p className="text-xs text-red-500 mt-1">{errCampos.concepto}</p>}
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <label className="text-xs text-[--text-light]">Desglosar IVA</label>
                <button type="button"
                  onClick={() => setForm(f => {
                    const d = !f.desglosarIva
                    return d ? { ...f, desglosarIva: true } : { ...f, desglosarIva: false, base_imponible: '', iva_importe: '' }
                  })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.desglosarIva ? 'bg-primary' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.desglosarIva ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              {form.desglosarIva ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[--text-light] mb-1">Base (€)</label>
                    <input type="number" min="0" step="0.50" value={form.base_imponible}
                      onChange={e => handleBaseIvaChange('base_imponible', sanitizers.decimal(e.target.value))}
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[--text-light] mb-1">% IVA</label>
                    <input type="number" min="0" step="0.5" value={form.iva_porcentaje}
                      onChange={e => handleBaseIvaChange('iva_porcentaje', sanitizers.decimal(e.target.value))}
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[--text-light] mb-1">Total (auto)</label>
                    <input type="number" value={form.importe} readOnly
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={`block text-xs mb-1 ${errCampos.importe ? 'text-red-500' : 'text-[--text-light]'}`}>Importe (€) *</label>
                  <input type="number" min="0" step="0.50" value={form.importe}
                    onChange={e => { setForm(f => ({ ...f, importe: sanitizers.decimal(e.target.value) })); if (errCampos.importe) setErrCampos(p => ({ ...p, importe: undefined })) }}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errCampos.importe ? 'border-red-400' : 'border-[--border]'}`} />
                  {errCampos.importe && <p className="text-xs text-red-500 mt-1">{errCampos.importe}</p>}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Forma de pago</label>
              <select value={form.forma_pago} onChange={e => setForm(f => ({ ...f, forma_pago: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                {FORMAS_PAGO.map(fp => <option key={fp} value={fp}>{FORMA_PAGO_LABELS[fp]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Referencia</label>
              <input type="text" value={form.referencia} onChange={e => setForm(f => ({ ...f, referencia: sanitizers.texto(e.target.value) }))}
                placeholder="Nº factura, albarán…"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente de pago</option>
              </select>
            </div>
          </div>
          {errForm && <p className="text-xs text-red-500">{errForm}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={cancelarForm}
              className="px-4 py-2 text-sm rounded-md border border-[--border] text-[--text-medium] hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={guardando}
              className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[88px_minmax(120px,1.5fr)_120px_minmax(150px,1.7fr)_66px_52px_86px_80px_60px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-[10px] font-semibold uppercase tracking-wide text-[--text-light]">
            <span>Fecha</span><span>Proveedor</span><span>Categoría</span><span>Concepto</span>
            <span className="text-right">Base</span><span className="text-right">IVA%</span>
            <span className="text-right">Total</span><span>Estado</span><span />
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[--text-light] text-center py-10">Sin gastos que coincidan.</p>
          ) : rows.map((p, i) => (
            <Fragment key={p.id}>
              <div
                className={`grid md:grid-cols-[88px_minmax(120px,1.5fr)_120px_minmax(150px,1.7fr)_66px_52px_86px_80px_60px] gap-1 md:gap-2 px-4 py-3 text-sm border-b border-[--border] items-center ${editando === p.id ? 'bg-primary/5' : i % 2 ? 'bg-gray-50/40' : ''}`}
              >
                <span className="text-xs text-[--text-light]">{formatFecha(p.fecha)}</span>
                <span className="text-[--text] truncate">{p.proveedores?.nombre ?? <em className="text-[--text-light] not-italic text-xs">—</em>}</span>
                <span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[--text-light]">
                    {labelsMap[p.categoria] ?? CATEGORIA_GASTO_LABELS[p.categoria] ?? p.categoria ?? '—'}
                  </span>
                </span>
                <span className="text-[--text-medium] truncate">{p.concepto}</span>
                <span className="text-right text-xs text-[--text-light]">
                  {p.base_imponible != null ? formatImporte(p.base_imponible) : '—'}
                </span>
                <span className="text-right text-xs text-[--text-light]">
                  {p.iva_porcentaje != null && p.base_imponible != null ? `${p.iva_porcentaje}%` : '—'}
                </span>
                <span className="text-right font-semibold text-amber-700">{formatImporte(p.importe)}</span>
                <div className="flex items-center gap-1.5">
                  <EstadoPill estado={p.estado} map={ESTADO_PAGO} />
                  {p.estado === 'pendiente' && (
                    <button onClick={() => setModalPagar({ id: p.id, concepto: p.concepto, importe: p.importe })}
                      className="text-[10px] text-green-600 hover:underline whitespace-nowrap">
                      ✓ Pagar
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 justify-self-end">
                  <button onClick={() => editando === p.id ? cancelarForm() : iniciarEdicion(p)}
                    aria-label={`Editar gasto ${p.concepto}`}
                    className={`transition-colors ${editando === p.id ? 'text-primary' : 'text-gray-300 hover:text-primary'}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setModalEliminar({ id: p.id, concepto: p.concepto })}
                    aria-label={`Eliminar gasto ${p.concepto}`}
                    className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {editando === p.id && (
                <div className="border-b border-[--border] bg-slate-50 px-5 py-5 space-y-4">
                  <h3 className="font-semibold text-[--text] text-sm">Editar gasto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Proveedor (opcional)</label>
                      <div className="flex gap-2">
                        <select value={form.proveedor_id} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}
                          className="flex-1 border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                          <option value="">— Sin proveedor —</option>
                          {proveedores.map(prov => <option key={prov.id} value={prov.id}>{prov.nombre}</option>)}
                        </select>
                        <button onClick={irANuevoProveedor}
                          title="Dar de alta un proveedor nuevo"
                          className="text-xs border border-dashed border-[--border] px-2 rounded-md text-[--text-light] hover:border-primary hover:text-primary transition-colors">
                          ＋
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Fecha</label>
                      <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Categoría *</label>
                      <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                        {(categorias.length
                          ? categorias.map(c => [c.clave, c.etiqueta])
                          : Object.entries(CATEGORIA_GASTO_LABELS)
                        ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${errCampos.concepto ? 'text-red-500' : 'text-[--text-light]'}`}>Concepto *</label>
                      <input type="text" value={form.concepto}
                        onChange={e => { setForm(f => ({ ...f, concepto: sanitizers.texto(e.target.value) })); if (errCampos.concepto) setErrCampos(prev => ({ ...prev, concepto: undefined })) }}
                        placeholder="Descripción del gasto"
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errCampos.concepto ? 'border-red-400' : 'border-[--border]'}`} />
                      {errCampos.concepto && <p className="text-xs text-red-500 mt-1">{errCampos.concepto}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <label className="text-xs text-[--text-light]">Desglosar IVA</label>
                        <button type="button"
                          onClick={() => setForm(f => {
                            const d = !f.desglosarIva
                            return d ? { ...f, desglosarIva: true } : { ...f, desglosarIva: false, base_imponible: '', iva_importe: '' }
                          })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.desglosarIva ? 'bg-primary' : 'bg-gray-200'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.desglosarIva ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {form.desglosarIva ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-[--text-light] mb-1">Base (€)</label>
                            <input type="number" min="0" step="0.50" value={form.base_imponible}
                              onChange={e => handleBaseIvaChange('base_imponible', sanitizers.decimal(e.target.value))}
                              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-[--text-light] mb-1">% IVA</label>
                            <input type="number" min="0" step="0.5" value={form.iva_porcentaje}
                              onChange={e => handleBaseIvaChange('iva_porcentaje', sanitizers.decimal(e.target.value))}
                              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-[--text-light] mb-1">Total (auto)</label>
                            <input type="number" value={form.importe} readOnly
                              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className={`block text-xs mb-1 ${errCampos.importe ? 'text-red-500' : 'text-[--text-light]'}`}>Importe (€) *</label>
                          <input type="number" min="0" step="0.50" value={form.importe}
                            onChange={e => { setForm(f => ({ ...f, importe: sanitizers.decimal(e.target.value) })); if (errCampos.importe) setErrCampos(prev => ({ ...prev, importe: undefined })) }}
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errCampos.importe ? 'border-red-400' : 'border-[--border]'}`} />
                          {errCampos.importe && <p className="text-xs text-red-500 mt-1">{errCampos.importe}</p>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Forma de pago</label>
                      <select value={form.forma_pago} onChange={e => setForm(f => ({ ...f, forma_pago: e.target.value }))}
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                        {FORMAS_PAGO.map(fp => <option key={fp} value={fp}>{FORMA_PAGO_LABELS[fp]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Referencia</label>
                      <input type="text" value={form.referencia} onChange={e => setForm(f => ({ ...f, referencia: sanitizers.texto(e.target.value) }))}
                        placeholder="Nº factura, albarán…"
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Estado</label>
                      <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white">
                        <option value="pagado">Pagado</option>
                        <option value="pendiente">Pendiente de pago</option>
                      </select>
                    </div>
                  </div>
                  {errForm && <p className="text-xs text-red-500">{errForm}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelarForm}
                      className="px-4 py-2 text-sm rounded-md border border-[--border] text-[--text-medium] hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleGuardar} disabled={guardando}
                      className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                      {guardando ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!modalEliminar}
        title="Eliminar gasto"
        description={modalEliminar ? `¿Eliminar "${modalEliminar.concepto}"? Esta acción no se puede deshacer.` : ''}
        onConfirm={handleEliminar}
        onCancel={() => setModalEliminar(null)}
      />

      <ConfirmDialog
        open={!!modalPagar}
        title="Confirmar pago"
        description={modalPagar
          ? `Marcar como pagado: ${modalPagar.concepto} · ${formatImporte(modalPagar.importe)}`
          : ''}
        confirmLabel="Pagar"
        cancelLabel="Cancelar"
        tone="primary"
        onConfirm={handleMarcarPagado}
        onCancel={() => setModalPagar(null)}
      />
    </div>
  )
}

// ─── LIBRO DIARIO ─────────────────────────────────────────────────────────────

function LibroPanel({ año }) {
  const { fetchLibroDiario, loading } = useContabilidad()
  const [entries, setEntries] = useState([])
  const [mes, setMes] = useState('todos')
  const [tipo, setTipo] = useState('todos')

  useEffect(() => {
    fetchLibroDiario({ año }).then(setEntries)
  }, [año])

  const mesesPresentes = useMemo(() =>
    [...new Set(entries.map(e => e.fecha?.slice(5, 7)).filter(Boolean))].sort()
  , [entries])

  const rows = entries.filter(e =>
    (tipo === 'todos' || e.tipo === tipo) &&
    (mes === 'todos' || e.fecha?.slice(5, 7) === mes)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={mes} onChange={e => setMes(e.target.value)}
          className="border border-[--border] rounded-lg px-3 py-1.5 text-xs bg-white">
          <option value="todos">Todos los meses</option>
          {mesesPresentes.map(m => <option key={m} value={m}>{NOMBRES_MES[m]}</option>)}
        </select>
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="border border-[--border] rounded-lg px-3 py-1.5 text-xs bg-white">
          <option value="todos">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
          <option value="perdida">Pérdidas</option>
        </select>
        <button
          onClick={() => exportarLibroDiario(rows, { año, mes: mes !== 'todos' ? mes : undefined })}
          className="ml-auto flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs hover:bg-primary-dark transition-colors"
        >
          <Download size={13} /> Exportar para gestoría
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[90px_70px_minmax(160px,1.8fr)_100px_80px_50px_90px_90px_80px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-[10px] font-semibold uppercase tracking-wide text-[--text-light]">
            <span>Fecha</span><span>Tipo</span><span>Descripción</span><span>Ref.</span>
            <span className="text-right">Base</span><span className="text-right">IVA%</span>
            <span className="text-right">Total</span><span>Forma</span><span>Estado</span>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[--text-light] text-center py-10">Sin asientos que coincidan.</p>
          ) : rows.map((e, i) => (
            <div key={e.id}
              className={`grid md:grid-cols-[90px_70px_minmax(160px,1.8fr)_100px_80px_50px_90px_90px_80px] gap-1 md:gap-2 px-4 py-3 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 ? 'bg-gray-50/40' : ''}`}
            >
              <span className="text-xs text-[--text-light]">{formatFecha(e.fecha)}</span>
              <span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${e.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : e.tipo === 'perdida' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-600'}`}>
                  {e.tipo === 'ingreso' ? 'Ingreso' : e.tipo === 'perdida' ? 'Pérdida' : 'Gasto'}
                </span>
              </span>
              <span className="font-medium text-[--text] truncate">{e.descripcion}</span>
              <span className="text-xs text-[--text-light]">{e.referencia ?? '—'}</span>
              <span className="text-right text-xs text-[--text-light]">
                {e.base != null ? formatImporte(e.base) : '—'}
              </span>
              <span className="text-right text-xs text-[--text-light]">
                {e.iva != null ? `${e.iva}%` : '—'}
              </span>
              <span className={`text-right font-semibold ${e.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                {e.tipo !== 'ingreso' ? '−' : ''}{formatImporte(e.total)}
              </span>
              <span className="text-xs text-[--text-light]">{FORMA_PAGO_LABELS[e.forma_pago] ?? e.forma_pago ?? '—'}</span>
              <EstadoPill estado={e.estado} map={e.tipo === 'ingreso' ? ESTADO_COBRO : e.tipo === 'perdida' ? ESTADO_PERDIDA : ESTADO_PAGO} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function ContabilidadDashboard() {
  const navigate = useNavigate()
  const { fetchCategoriasGasto } = useContabilidad()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true })
  const [año, setAño] = useState(AÑO_ACTUAL)
  const [trimestre, setTrimestre] = useState(0)
  const [categorias, setCategorias] = useState([])

  // Categorías de gasto gestionadas desde Ajustes. Si la tabla aún no existe,
  // los paneles caen al fallback estático (CATEGORIA_GASTO_LABELS/COLORES).
  useEffect(() => { fetchCategoriasGasto().then(setCategorias).catch(() => {}) }, [fetchCategoriasGasto])

  const labelsMap = useMemo(
    () => Object.fromEntries(categorias.map(c => [c.clave, c.etiqueta])),
    [categorias],
  )
  const coloresMap = useMemo(
    () => Object.fromEntries(categorias.map(c => [c.clave, c.color])),
    [categorias],
  )

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (tab !== 'dashboard' ? setTab('dashboard') : navigate('/encargos'))}
              aria-label="Volver"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-[--border] rounded-lg bg-white text-[--text-medium] hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="font-display text-2xl text-[--text-dark]">Contabilidad</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[--text-light]">Selecciona el año</span>
              <ArrowRight size={14} className="text-[--text-light]" />
              <select
                value={año}
                onChange={e => setAño(Number(e.target.value))}
                className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
              >
                {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {(tab === 'dashboard' || tab === 'cobros' || tab === 'pagos') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[--text-light]">Selecciona el Trimestre</span>
                <ArrowRight size={14} className="text-[--text-light]" />
                <select
                  value={trimestre}
                  onChange={e => setTrimestre(Number(e.target.value))}
                  className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value={0}>Anual</option>
                  <option value={1}>T1</option>
                  <option value={2}>T2</option>
                  <option value={3}>T3</option>
                  <option value={4}>T4</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <SubNav tab={tab} setTab={setTab} />

        {tab === 'dashboard' && <DashboardPanel año={año} trimestre={trimestre} setTab={setTab} labelsMap={labelsMap} coloresMap={coloresMap} />}
        {tab === 'cobros'    && <CobrosPanel    año={año} trimestre={trimestre} />}
        {tab === 'pagos'     && <PagosPanel     año={año} trimestre={trimestre} categorias={categorias} labelsMap={labelsMap} />}
        {tab === 'libro'     && <LibroPanel     año={año} />}
      </div>
    </PageWrapper>
  )
}
