import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Download, Plus, Trash2, X, ArrowRight } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useContabilidad } from '@/hooks/useContabilidad'
import {
  formatFecha, formatImporte,
  FORMA_PAGO_LABELS, CATEGORIA_GASTO_LABELS,
} from '@/utils/formatters'
import { validarTelefono, validarEmail, normalizarTelefono } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'
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

const formVacio = {
  proveedor_id: '', fecha: new Date().toISOString().slice(0, 10),
  concepto: '', importe: '', forma_pago: 'efectivo', referencia: '',
  categoria: 'material', base_imponible: '', iva_porcentaje: 21, iva_importe: '',
  desglosarIva: false,
}

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

function StatCard({ label, value, tone = 'ink' }) {
  const tones = { green: 'text-green-600', red: 'text-red-500', amber: 'text-amber-600', ink: 'text-[--text-dark]' }
  return (
    <div className="bg-white border border-[--border] rounded-xl p-4">
      <p className="text-xs text-[--text-light] mb-1">{label}</p>
      <p className={`text-xl font-bold ${tones[tone]}`}>{value}</p>
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

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-[--border] rounded-lg pl-7 pr-3 py-1.5 text-xs w-40"
      />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[--text-light]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>
    </div>
  )
}

// ─── Gráfico donut SVG ────────────────────────────────────────────────────────

function DonutChart({ data, total }) {
  const R = 52, SW = 16, Cf = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-[220px] mx-auto">
        <svg viewBox="0 0 140 140" className="w-full h-auto">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#E5E7EB" strokeWidth={SW} />
            {data.map((d, i) => {
              const len = (d.value / total) * Cf
              const seg = (
                <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={d.color}
                  strokeWidth={SW} strokeDasharray={`${len} ${Cf - len}`} strokeDashoffset={-acc} />
              )
              acc += len
              return seg
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[9px] text-[--text-light]">Gastos</span>
          <span className="text-xs font-bold text-[--text-dark]">{formatImporte(total)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-start gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-sm shrink-0 mt-0.5" style={{ background: d.color }} />
            <div className="min-w-0">
              <p className="text-[10px] text-[--text-medium] leading-tight truncate">{d.label}</p>
              <p className="text-[9px] text-[--text-light]">
                {formatImporte(d.value)} · {((d.value / total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
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

function DashboardPanel({ año }) {
  const { fetchCobros, fetchPagosProveedor, loading } = useContabilidad()
  const [cobros, setCobros] = useState([])
  const [pagos, setPagos] = useState([])

  useEffect(() => {
    Promise.all([
      fetchCobros({ año }),
      fetchPagosProveedor({ año }),
    ]).then(([c, p]) => {
      setCobros(c)
      setPagos(p)
    })
  }, [año])

  const ingresosCobrados = useMemo(() =>
    cobros.filter(c => c.estado === 'cobrado' && c.tipo !== 'devolucion')
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
    cobros.filter(c => c.tipo !== 'devolucion').forEach(c => {
      const mes = new Date(c.fecha + 'T00:00:00').getMonth()
      data[mes].ing += parseFloat(c.importe || 0)
    })
    pagos.forEach(p => {
      const mes = new Date(p.fecha + 'T00:00:00').getMonth()
      data[mes].gas += parseFloat(p.importe || 0)
    })
    return data
  }, [cobros, pagos])

  const categoriaData = useMemo(() => {
    const mapa = {}
    pagos.forEach(p => {
      const cat = p.categoria ?? 'otros'
      mapa[cat] = (mapa[cat] ?? 0) + parseFloat(p.importe || 0)
    })
    return Object.entries(mapa)
      .map(([cat, value]) => ({
        label: CATEGORIA_GASTO_LABELS[cat] ?? cat,
        value,
        color: CATEGORIA_COLORES[cat] ?? '#9CA3AF',
      }))
      .sort((a, b) => b.value - a.value)
  }, [pagos])

  const totalGastosCat = categoriaData.reduce((s, d) => s + d.value, 0)
  const resultado = ingresosCobrados - gastosPagados
  const maxV = Math.max(1, ...mesesData.map(m => Math.max(m.ing, m.gas)))
  const H = 200

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Ingresos cobrados" value={formatImporte(ingresosCobrados)} tone="green" />
        <StatCard label="Gastos pagados"    value={formatImporte(gastosPagados)}    tone="red" />
        <StatCard label="Resultado neto"    value={formatImporte(resultado)}        tone={resultado >= 0 ? 'green' : 'red'} />
        <StatCard label="Por cobrar"        value={formatImporte(porCobrar)}        tone="amber" />
      </div>

      {loading ? (
        <p className="text-sm text-[--text-light] text-center py-8">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Barras mensuales */}
            <div className="bg-white border border-[--border] rounded-xl p-5">
              <p className="text-xs font-semibold text-[--text-medium] mb-4">Evolución mensual</p>
              <div className="flex items-end gap-1" style={{ height: H + 24 }}>
                {mesesData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full flex items-end justify-center gap-px" style={{ height: H }}>
                      <div
                        className="flex-1 bg-primary/80 rounded-t-sm transition-all"
                        style={{ height: (d.ing / maxV) * H }}
                        title={`Ingresos ${MESES_LABELS[i]}: ${formatImporte(d.ing)}`}
                      />
                      <div
                        className="flex-1 bg-amber-400/80 rounded-t-sm transition-all"
                        style={{ height: (d.gas / maxV) * H }}
                        title={`Gastos ${MESES_LABELS[i]}: ${formatImporte(d.gas)}`}
                      />
                    </div>
                    <span className="text-[8px] text-[--text-light] mt-1">{MESES_LABELS[i]}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-[--text-light]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-primary/80" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-amber-400/80" /> Gastos
                </span>
              </div>
            </div>

            {/* Donut */}
            <div className="bg-white border border-[--border] rounded-xl p-5">
              <p className="text-xs font-semibold text-[--text-medium] mb-4">Gastos por categoría</p>
              {categoriaData.length === 0 ? (
                <p className="text-xs text-[--text-light]">Sin gastos registrados.</p>
              ) : (
                <DonutChart data={categoriaData} total={totalGastosCat} />
              )}
            </div>
          </div>

          {/* Listas pendientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[--border] rounded-xl p-5">
              <p className="text-xs font-semibold text-[--text-medium] mb-3">Cobros pendientes</p>
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
              <p className="text-xs font-semibold text-[--text-medium] mb-3">Pagos pendientes</p>
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

function CobrosPanel({ año }) {
  const toast = useToast()
  const { fetchCobros, marcarEstadoCobro, loading } = useContabilidad()
  const [cobros, setCobros] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [q, setQ] = useState('')
  const [trimestre, setTrimestre] = useState(0)

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

  const handleMarcar = async (id) => {
    try {
      await marcarEstadoCobro(id, 'cobrado')
      toast.success('Cobro marcado como cobrado.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar el cobro.')
    }
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
          <select
            value={trimestre}
            onChange={e => setTrimestre(Number(e.target.value))}
            className="border border-[--border] rounded-lg px-2.5 py-1.5 text-xs bg-white"
          >
            <option value={0}>Anual</option>
            <option value={1}>T1</option>
            <option value={2}>T2</option>
            <option value={3}>T3</option>
            <option value={4}>T4</option>
          </select>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente…" />
          <button
            onClick={() => exportarLibroCobros(cobros, { trimestre: trimestre || undefined, año })}
            className="flex items-center gap-1.5 border border-[--border] bg-white text-[--text-medium] px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
          >
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total"     value={formatImporte(totalAll)}      tone="ink" />
        <StatCard label="Cobrado"   value={formatImporte(totalCobrado)}  tone="green" />
        <StatCard label="Pendiente" value={formatImporte(totalPendiente)}tone="amber" />
        <StatCard label="Vencido"   value={formatImporte(totalVencido)}  tone="red" />
      </div>

      {loading ? (
        <p className="text-sm text-[--text-light] text-center py-10">Cargando...</p>
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_110px_90px_100px_80px_90px_110px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-[10px] font-semibold uppercase tracking-wide text-[--text-light]">
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
                className={`grid md:grid-cols-[1fr_110px_90px_100px_80px_90px_110px] gap-1 md:gap-3 px-4 py-3 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 ? 'bg-gray-50/40' : ''}`}
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
                <span className={`text-right font-semibold ${c.tipo === 'devolucion' ? 'text-red-500' : 'text-[--text]'}`}>
                  {formatImporte(c.importe)}
                </span>
                <div className="flex items-center gap-2">
                  <EstadoPill estado={c.estado} map={ESTADO_COBRO} />
                  {c.estado !== 'cobrado' && (
                    <button
                      onClick={() => handleMarcar(c.id)}
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
    </div>
  )
}

// ─── PAGOS ────────────────────────────────────────────────────────────────────

function PagosPanel({ año }) {
  const toast = useToast()
  const {
    fetchPagosProveedor, registrarPagoProveedor, eliminarPagoProveedor,
    marcarEstadoPago, fetchProveedores, crearProveedor, loading,
  } = useContabilidad()

  const [pagos, setPagos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [q, setQ] = useState('')
  const [trimestre, setTrimestre] = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [errForm, setErrForm] = useState('')
  const [modalEliminar, setModalEliminar] = useState(null)
  const [modalProveedor, setModalProveedor] = useState(false)
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', telefono: '', email: '' })
  const [guardandoProv, setGuardandoProv] = useState(false)
  const [errProveedor, setErrProveedor] = useState('')

  const cargar = () => fetchPagosProveedor({ año, trimestre: trimestre || undefined }).then(setPagos)
  useEffect(() => { cargar() }, [año, trimestre])
  useEffect(() => { fetchProveedores().then(setProveedores) }, [])

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

  const handleGuardar = async () => {
    if (!form.concepto.trim()) return setErrForm('El concepto es obligatorio.')
    if (!form.importe || isNaN(form.importe)) return setErrForm('Importe inválido.')
    setErrForm('')
    setGuardando(true)
    try {
      await registrarPagoProveedor({
        proveedor_id: form.proveedor_id || null,
        fecha: form.fecha, concepto: form.concepto,
        importe: parseFloat(form.importe), forma_pago: form.forma_pago,
        referencia: form.referencia || null, categoria: form.categoria,
        base_imponible: form.base_imponible !== '' ? parseFloat(form.base_imponible) : null,
        iva_porcentaje: form.desglosarIva ? parseFloat(form.iva_porcentaje) : null,
        iva_importe: form.iva_importe !== '' ? parseFloat(form.iva_importe) : null,
      })
      setForm(formVacio)
      setMostrarForm(false)
      toast.success('Gasto registrado.')
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

  const handleCrearProveedor = async () => {
    if (!nuevoProveedor.nombre.trim()) return
    if (nuevoProveedor.telefono && !validarTelefono(nuevoProveedor.telefono)) {
      setErrProveedor('El teléfono debe tener 9 dígitos.')
      return
    }
    if (nuevoProveedor.email && !validarEmail(nuevoProveedor.email)) {
      setErrProveedor('El email no es válido.')
      return
    }
    setErrProveedor('')
    setGuardandoProv(true)
    try {
      const prov = await crearProveedor({
        ...nuevoProveedor,
        telefono: nuevoProveedor.telefono ? normalizarTelefono(nuevoProveedor.telefono) : nuevoProveedor.telefono,
      })
      setProveedores(prev => [...prev, prov].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setForm(f => ({ ...f, proveedor_id: prov.id }))
      setModalProveedor(false)
      setNuevoProveedor({ nombre: '', telefono: '', email: '' })
    } catch (e) {
      setErrProveedor(e.message || 'Error al crear el proveedor.')
    } finally { setGuardandoProv(false) }
  }

  const handleMarcarPagado = async (id) => {
    try {
      await marcarEstadoPago(id, 'pagado')
      toast.success('Gasto marcado como pagado.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar el gasto.')
    }
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
          <select
            value={trimestre}
            onChange={e => setTrimestre(Number(e.target.value))}
            className="border border-[--border] rounded-lg px-2.5 py-1.5 text-xs bg-white"
          >
            <option value={0}>Anual</option>
            <option value={1}>T1</option>
            <option value={2}>T2</option>
            <option value={3}>T3</option>
            <option value={4}>T4</option>
          </select>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar proveedor…" />
          <button
            onClick={() => exportarLibroPagos(pagos, { trimestre: trimestre || undefined, año })}
            className="flex items-center gap-1.5 border border-[--border] bg-white text-[--text-medium] px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
          >
            <Download size={13} /> Excel
          </button>
          <button
            onClick={() => setMostrarForm(v => !v)}
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs hover:bg-primary-dark transition-colors"
          >
            <Plus size={13} /> Registrar gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total"     value={formatImporte(totalAll)}      tone="ink" />
        <StatCard label="Pagado"    value={formatImporte(totalPagado)}   tone="green" />
        <StatCard label="Pendiente" value={formatImporte(totalPendiente)}tone="amber" />
      </div>

      {/* Formulario inline */}
      {mostrarForm && (
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
                <button onClick={() => setModalProveedor(true)}
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
                {Object.entries(CATEGORIA_GASTO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Concepto *</label>
              <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
                placeholder="Descripción del gasto"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
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
                      onChange={e => handleBaseIvaChange('base_imponible', e.target.value)}
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[--text-light] mb-1">% IVA</label>
                    <input type="number" min="0" step="0.5" value={form.iva_porcentaje}
                      onChange={e => handleBaseIvaChange('iva_porcentaje', e.target.value)}
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
                  <label className="block text-xs text-[--text-light] mb-1">Importe (€) *</label>
                  <input type="number" min="0" step="0.50" value={form.importe}
                    onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
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
              <input type="text" value={form.referencia} onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                placeholder="Nº factura, albarán…"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          {errForm && <p className="text-xs text-red-500">{errForm}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setMostrarForm(false); setForm(formVacio); setErrForm('') }}
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
        <p className="text-sm text-[--text-light] text-center py-10">Cargando...</p>
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[90px_130px_120px_1fr_70px_55px_90px_80px_36px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-[10px] font-semibold uppercase tracking-wide text-[--text-light]">
            <span>Fecha</span><span>Proveedor</span><span>Categoría</span><span>Concepto</span>
            <span className="text-right">Base</span><span className="text-right">IVA%</span>
            <span className="text-right">Total</span><span>Estado</span><span />
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[--text-light] text-center py-10">Sin gastos que coincidan.</p>
          ) : rows.map((p, i) => (
            <div key={p.id}
              className={`grid md:grid-cols-[90px_130px_120px_1fr_70px_55px_90px_80px_36px] gap-1 md:gap-2 px-4 py-3 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 ? 'bg-gray-50/40' : ''}`}
            >
              <span className="text-xs text-[--text-light]">{formatFecha(p.fecha)}</span>
              <span className="text-[--text] truncate">{p.proveedores?.nombre ?? <em className="text-[--text-light] not-italic text-xs">—</em>}</span>
              <span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[--text-light]">
                  {CATEGORIA_GASTO_LABELS[p.categoria] ?? p.categoria ?? '—'}
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
                  <button onClick={() => handleMarcarPagado(p.id)}
                    className="text-[10px] text-green-600 hover:underline whitespace-nowrap">
                    ✓ Pagar
                  </button>
                )}
              </div>
              <button onClick={() => setModalEliminar({ id: p.id, concepto: p.concepto })}
                className="text-gray-300 hover:text-red-400 transition-colors justify-self-end">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-[--text] mb-2">Eliminar gasto</h3>
            <p className="text-sm text-[--text-medium] mb-6">
              ¿Eliminar <strong>{modalEliminar.concepto}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(null)}
                className="flex-1 border border-[--border] rounded-md px-4 py-2 text-sm text-[--text-medium] hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 bg-red-500 text-white rounded-md px-4 py-2 text-sm hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalProveedor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[--text]">Nuevo proveedor</h3>
              <button onClick={() => setModalProveedor(false)}>
                <X size={18} className="text-[--text-light]" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre *" value={nuevoProveedor.nombre}
                onChange={e => setNuevoProveedor(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
              <input type="tel" placeholder="Teléfono" value={nuevoProveedor.telefono}
                onChange={e => setNuevoProveedor(p => ({ ...p, telefono: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
              <input type="email" placeholder="Email" value={nuevoProveedor.email}
                onChange={e => setNuevoProveedor(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm" />
              {errProveedor && <p className="text-xs text-red-500">{errProveedor}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalProveedor(false)}
                className="flex-1 border border-[--border] rounded-md px-4 py-2 text-sm text-[--text-medium] hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleCrearProveedor} disabled={guardandoProv || !nuevoProveedor.nombre.trim()}
                className="flex-1 bg-primary text-white rounded-md px-4 py-2 text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
                {guardandoProv ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
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
        </select>
        <button
          onClick={() => exportarLibroDiario(rows, { año, mes: mes !== 'todos' ? mes : undefined })}
          className="ml-auto flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs hover:bg-primary-dark transition-colors"
        >
          <Download size={13} /> Exportar para gestoría
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[--text-light] text-center py-10">Cargando...</p>
      ) : (
        <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[90px_70px_1fr_100px_80px_50px_90px_90px_80px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-[10px] font-semibold uppercase tracking-wide text-[--text-light]">
            <span>Fecha</span><span>Tipo</span><span>Descripción</span><span>Ref.</span>
            <span className="text-right">Base</span><span className="text-right">IVA%</span>
            <span className="text-right">Total</span><span>Forma</span><span>Estado</span>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[--text-light] text-center py-10">Sin asientos que coincidan.</p>
          ) : rows.map((e, i) => (
            <div key={e.id}
              className={`grid md:grid-cols-[90px_70px_1fr_100px_80px_50px_90px_90px_80px] gap-1 md:gap-2 px-4 py-3 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 ? 'bg-gray-50/40' : ''}`}
            >
              <span className="text-xs text-[--text-light]">{formatFecha(e.fecha)}</span>
              <span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${e.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {e.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
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
                {e.tipo === 'gasto' ? '−' : ''}{formatImporte(e.total)}
              </span>
              <span className="text-xs text-[--text-light]">{FORMA_PAGO_LABELS[e.forma_pago] ?? e.forma_pago ?? '—'}</span>
              <EstadoPill estado={e.estado} map={e.tipo === 'ingreso' ? ESTADO_COBRO : ESTADO_PAGO} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function ContabilidadDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true })
  const [año, setAño] = useState(AÑO_ACTUAL)

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-2xl text-[--text-dark]">Contabilidad</h1>
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
        </div>

        <SubNav tab={tab} setTab={setTab} />

        {tab === 'dashboard' && <DashboardPanel año={año} />}
        {tab === 'cobros'    && <CobrosPanel    año={año} />}
        {tab === 'pagos'     && <PagosPanel     año={año} />}
        {tab === 'libro'     && <LibroPanel     año={año} />}
      </div>
    </PageWrapper>
  )
}
