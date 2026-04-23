/**
 * Contabilidad.jsx — Módulo de contabilidad Ambelcor
 * Dashboard idéntico al prototipo: Chart.js (bar + doughnut) via CDN dinámico.
 * Stack: React 18 + Tailwind CSS + lucide-react
 *
 * TODO Supabase: sustituir cobrosIniciales / pagosIniciales por queries reales.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle,
  BookOpen, Download, Plus, X, Check,
  AlertCircle, Search,
} from 'lucide-react'

// ─── Carga dinámica de Chart.js desde CDN ─────────────────────────────────────
function loadChartJS() {
  return new Promise((resolve) => {
    if (window.Chart) { resolve(window.Chart); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => resolve(window.Chart)
    document.head.appendChild(s)
  })
}

// ─── Datos de ejemplo (reemplazar por queries Supabase) ──────────────────────
const cobrosIniciales = [
  { id: 1, cliente: 'María José Soler',  ref: 'AMB-0042', concepto: 'Indumentaria valenciana (encargo)', importe: 580,  fecha: '2026-03-15', vence: '2026-04-15', forma: 'Transferencia', estado: 'pendiente', notas: 'Vestit complet amb sos' },
  { id: 2, cliente: 'Ana García Ferrer', ref: 'AMB-0039', concepto: 'Indumentaria valenciana (encargo)', importe: 420,  fecha: '2026-02-20', vence: '2026-03-20', forma: 'Bizum',          estado: 'cobrado',   notas: '' },
  { id: 3, cliente: 'Lola Martínez',     ref: 'AMB-0038', concepto: 'Arreglo / reparación',              importe: 85,   fecha: '2026-02-10', vence: '2026-03-10', forma: 'Efectivo',      estado: 'cobrado',   notas: '' },
  { id: 4, cliente: 'Carmen Ibáñez',     ref: 'AMB-0041', concepto: 'Anticipo / señal',                  importe: 200,  fecha: '2026-03-01', vence: '2026-04-01', forma: 'Bizum',          estado: 'cobrado',   notas: 'Señal vestit novia' },
  { id: 5, cliente: 'Rosa Palau',        ref: 'AMB-0040', concepto: 'Alquiler de traje',                 importe: 150,  fecha: '2026-03-05', vence: '2026-03-25', forma: 'Efectivo',      estado: 'pendiente', notas: 'Falla major' },
  { id: 6, cliente: 'Pilar Sanz',        ref: 'AMB-0043', concepto: 'Liquidación final',                 importe: 320,  fecha: '2026-04-01', vence: '2026-04-30', forma: 'Transferencia', estado: 'pendiente', notas: '' },
  { id: 7, cliente: 'Teresa Blasco',     ref: 'AMB-0044', concepto: 'Indumentaria valenciana (encargo)', importe: 680,  fecha: '2026-04-10', vence: '2026-05-15', forma: 'Transferencia', estado: 'pendiente', notas: '' },
]

const pagosIniciales = [
  { id: 1, proveedor: 'Tejidos Valencia S.L.',     ref: 'TV-2026-031',  categoria: 'Tejidos y materiales',       importe: 240, base: 198.35, iva: 21, fecha: '2026-03-05', pagofecha: '2026-03-10', forma: 'Transferencia', estado: 'pagado',    notas: '' },
  { id: 2, proveedor: 'Bordados Artesanales Paco', ref: 'BAP-056',      categoria: 'Bordados y encajes',         importe: 180, base: 148.76, iva: 21, fecha: '2026-03-12', pagofecha: '',           forma: 'Efectivo',      estado: 'pendiente', notas: '' },
  { id: 3, proveedor: 'Seguridad Social',          ref: 'RETA-2026-03', categoria: 'Cuota autónomo',             importe: 295, base: 295,    iva: 0,  fecha: '2026-03-20', pagofecha: '2026-03-20', forma: 'Domiciliación', estado: 'pagado',    notas: '' },
  { id: 4, proveedor: 'Gestoría Pérez',            ref: 'GP-Q1-2026',   categoria: 'Gestoría / asesoría',        importe: 120, base: 99.17,  iva: 21, fecha: '2026-04-01', pagofecha: '',           forma: 'Transferencia', estado: 'pendiente', notas: '' },
  { id: 5, proveedor: 'Hilos y Avíos Mar',         ref: 'HAM-2026-08',  categoria: 'Hilos, botones y avíos',    importe: 65,  base: 53.72,  iva: 21, fecha: '2026-02-18', pagofecha: '2026-02-18', forma: 'Efectivo',      estado: 'pagado',    notas: '' },
  { id: 6, proveedor: 'Iberdrola',                 ref: 'IBER-0326',    categoria: 'Suministros (luz, agua...)',importe: 89,  base: 73.55,  iva: 21, fecha: '2026-03-28', pagofecha: '2026-03-28', forma: 'Domiciliación', estado: 'pagado',    notas: '' },
]

// ─── Constantes ───────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]

const CONCEPTOS_COBRO = [
  'Indumentaria valenciana (encargo)', 'Arreglo / reparación',
  'Alquiler de traje', 'Venta de piezas sueltas',
  'Anticipo / señal', 'Liquidación final', 'Otro',
]
const CATEGORIAS_PAGO = [
  'Tejidos y materiales', 'Hilos, botones y avíos', 'Bordados y encajes',
  'Maquinaria y equipos', 'Mantenimiento taller', 'Servicios profesionales',
  'Gestoría / asesoría', 'Publicidad y marketing', 'Suministros (luz, agua...)',
  'Cuota autónomo', 'Alquiler local', 'Otros gastos',
]
const FORMAS_COBRO = ['Efectivo', 'Transferencia', 'Bizum', 'Tarjeta']
const FORMAS_PAGO  = ['Transferencia', 'Efectivo', 'Tarjeta', 'Domiciliación']
const TIPOS_IVA    = [
  { valor: 0,  label: '0% — Exento' },
  { valor: 4,  label: '4% — Superreducido' },
  { valor: 10, label: '10% — Reducido' },
  { valor: 21, label: '21% — General' },
]
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const COLORS_GASTOS = ['#534AB7','#1D9E75','#D85A30','#BA7517','#185FA5','#3B6D11','#993C1D','#854F0B','#0F6E56','#A32D2D','#3C3489','#5DCAA5']

// ─── Utilidades ───────────────────────────────────────────────────────────────
const fmt  = n => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD = d => { if (!d) return '—'; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}` }
const isVencido   = c => c.estado === 'pendiente' && c.vence && c.vence < TODAY
const estadoCobro = c => isVencido(c) ? 'vencido' : c.estado

// ─── Hook Chart.js ────────────────────────────────────────────────────────────
function useChart(canvasRef, buildConfig, deps) {
  const chartRef = useRef(null)
  useEffect(() => {
    loadChartJS().then(Chart => {
      if (!canvasRef.current) return
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = new Chart(canvasRef.current, buildConfig(Chart))
    })
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ─── Micro-componentes ────────────────────────────────────────────────────────
const Badge = ({ estado }) => {
  const map = {
    cobrado:   'bg-green-50  text-green-700  border-green-200',
    pagado:    'bg-green-50  text-green-700  border-green-200',
    pendiente: 'bg-amber-50  text-amber-700  border-amber-200',
    vencido:   'bg-red-50    text-red-700    border-red-200',
  }
  const labels = { cobrado: 'Cobrado', pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[estado] ?? map.pendiente}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

const MetricCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</span>
    <span className={`text-xl font-semibold ${color}`}>{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
)

const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
      active ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
    }`}
  >{label}</button>
)

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Formulario cobro ─────────────────────────────────────────────────────────
const FormCobro = ({ nextId, onSave, onClose }) => {
  const [f, setF] = useState({
    cliente: '', ref: `AMB-${String(nextId).padStart(4,'0')}`,
    concepto: CONCEPTOS_COBRO[0], importe: '',
    fecha: TODAY, vence: '', forma: 'Transferencia', estado: 'pendiente', notas: '',
  })
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = () => {
    if (!f.cliente.trim() || !f.importe) return alert('Indica cliente e importe.')
    onSave({ ...f, id: nextId, importe: parseFloat(f.importe) }); onClose()
  }
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400'
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Cliente</label>
          <input className={inp} value={f.cliente} onChange={e=>s('cliente',e.target.value)} placeholder="Nombre del cliente" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Nº encargo / factura</label>
          <input className={inp} value={f.ref} onChange={e=>s('ref',e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Concepto</label>
          <select className={inp} value={f.concepto} onChange={e=>s('concepto',e.target.value)}>
            {CONCEPTOS_COBRO.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="block text-xs text-gray-500 mb-1">Importe (€)</label>
          <input type="number" step="0.01" className={inp} value={f.importe} onChange={e=>s('importe',e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Fecha emisión</label>
          <input type="date" className={inp} value={f.fecha} onChange={e=>s('fecha',e.target.value)} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Fecha vencimiento</label>
          <input type="date" className={inp} value={f.vence} onChange={e=>s('vence',e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Forma de pago</label>
          <select className={inp} value={f.forma} onChange={e=>s('forma',e.target.value)}>
            {FORMAS_COBRO.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select className={inp} value={f.estado} onChange={e=>s('estado',e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="cobrado">Cobrado</option></select></div>
      </div>
      <div className="mb-4"><label className="block text-xs text-gray-500 mb-1">Notas</label>
        <input className={inp} value={f.notas} onChange={e=>s('notas',e.target.value)} placeholder="Observaciones (opcional)" /></div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
        <button onClick={save} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1">
          <Check size={14}/> Guardar cobro</button>
      </div>
    </>
  )
}

// ─── Formulario pago ──────────────────────────────────────────────────────────
const FormPago = ({ nextId, onSave, onClose }) => {
  const [f, setF] = useState({
    proveedor: '', ref: '', categoria: CATEGORIAS_PAGO[0],
    importe: '', base: '', iva: 21,
    fecha: TODAY, pagofecha: '', forma: 'Transferencia', estado: 'pendiente', notas: '',
  })
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = () => {
    if (!f.proveedor.trim() || !f.importe) return alert('Indica proveedor e importe.')
    onSave({ ...f, id: nextId, importe: parseFloat(f.importe), base: parseFloat(f.base)||parseFloat(f.importe), iva: parseInt(f.iva) })
    onClose()
  }
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400'
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Proveedor / Concepto</label>
          <input className={inp} value={f.proveedor} onChange={e=>s('proveedor',e.target.value)} placeholder="Nombre proveedor" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Nº factura proveedor</label>
          <input className={inp} value={f.ref} onChange={e=>s('ref',e.target.value)} placeholder="Referencia" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Categoría</label>
          <select className={inp} value={f.categoria} onChange={e=>s('categoria',e.target.value)}>
            {CATEGORIAS_PAGO.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="block text-xs text-gray-500 mb-1">Importe total (€)</label>
          <input type="number" step="0.01" className={inp} value={f.importe} onChange={e=>s('importe',e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Base imponible (€)</label>
          <input type="number" step="0.01" className={inp} value={f.base} onChange={e=>s('base',e.target.value)} placeholder="0.00" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Tipo IVA</label>
          <select className={inp} value={f.iva} onChange={e=>s('iva',e.target.value)}>
            {TIPOS_IVA.map(t=><option key={t.valor} value={t.valor}>{t.label}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Fecha factura</label>
          <input type="date" className={inp} value={f.fecha} onChange={e=>s('fecha',e.target.value)} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Fecha pago</label>
          <input type="date" className={inp} value={f.pagofecha} onChange={e=>s('pagofecha',e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs text-gray-500 mb-1">Forma de pago</label>
          <select className={inp} value={f.forma} onChange={e=>s('forma',e.target.value)}>
            {FORMAS_PAGO.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select className={inp} value={f.estado} onChange={e=>s('estado',e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option></select></div>
      </div>
      <div className="mb-4"><label className="block text-xs text-gray-500 mb-1">Notas</label>
        <input className={inp} value={f.notas} onChange={e=>s('notas',e.target.value)} placeholder="Observaciones (opcional)" /></div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
        <button onClick={save} className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1">
          <Check size={14}/> Guardar pago</button>
      </div>
    </>
  )
}

// ─── Chart: Ingresos vs Gastos ────────────────────────────────────────────────
function ChartIngresosGastos({ cobros, pagos }) {
  const ref = useRef(null)
  const ingM = useMemo(() => {
    const a = Array(12).fill(0)
    cobros.filter(c=>c.estado==='cobrado').forEach(c=>{ a[new Date(c.fecha).getMonth()]+=c.importe })
    return a
  }, [cobros])
  const gasM = useMemo(() => {
    const a = Array(12).fill(0)
    pagos.filter(p=>p.estado==='pagado').forEach(p=>{ a[new Date(p.fecha).getMonth()]+=p.importe })
    return a
  }, [pagos])

  useChart(ref, () => ({
    type: 'bar',
    data: {
      labels: MESES_CORTO,
      datasets: [
        { label: 'Ingresos', data: ingM.map(v=>Math.round(v*100)/100), backgroundColor: '#1D9E75', borderRadius: 3 },
        { label: 'Gastos',   data: gasM.map(v=>Math.round(v*100)/100), backgroundColor: '#D85A30', borderRadius: 3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 11 }, autoSkip: false }, grid: { color: '#f3f4f6' } },
        y: { ticks: { callback: v => v+'€', font: { size: 10 } }, grid: { color: '#f3f4f6' } },
      },
    },
  }), [ingM, gasM])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-sm font-medium text-gray-800 mb-3">Ingresos vs Gastos</p>
      <div style={{ position: 'relative', height: 200 }}>
        <canvas ref={ref} role="img" aria-label="Ingresos vs gastos mensuales">Datos mensuales.</canvas>
      </div>
    </div>
  )
}

// ─── Chart: Distribución gastos (doughnut) ────────────────────────────────────
function ChartDistribucionGastos({ pagos }) {
  const ref = useRef(null)
  const { cats, vals } = useMemo(() => {
    const map = {}
    pagos.filter(p=>p.estado==='pagado').forEach(p=>{ map[p.categoria]=(map[p.categoria]||0)+p.importe })
    return { cats: Object.keys(map), vals: Object.values(map).map(v=>Math.round(v*100)/100) }
  }, [pagos])

  useChart(ref, () => ({
    type: 'doughnut',
    data: {
      labels: cats,
      datasets: [{ data: vals, backgroundColor: COLORS_GASTOS.slice(0,cats.length), borderWidth: 1, borderColor: '#fff' }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } } },
    },
  }), [cats, vals])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-sm font-medium text-gray-800 mb-3">Distribución de gastos</p>
      <div style={{ position: 'relative', height: 200 }}>
        <canvas ref={ref} role="img" aria-label="Distribución de gastos por categoría">Distribución de gastos.</canvas>
      </div>
    </div>
  )
}

// ─── Chart: Resultado mensual ─────────────────────────────────────────────────
function ChartResultado({ cobros, pagos }) {
  const ref = useRef(null)
  const resM = useMemo(() => {
    const ingM = Array(12).fill(0), gasM = Array(12).fill(0)
    cobros.filter(c=>c.estado==='cobrado').forEach(c=>{ ingM[new Date(c.fecha).getMonth()]+=c.importe })
    pagos.filter(p=>p.estado==='pagado').forEach(p=>{ gasM[new Date(p.fecha).getMonth()]+=p.importe })
    return ingM.map((v,i)=>Math.round((v-gasM[i])*100)/100)
  }, [cobros, pagos])

  useChart(ref, () => ({
    type: 'bar',
    data: {
      labels: MESES_CORTO,
      datasets: [{
        label: 'Resultado',
        data: resM,
        backgroundColor: resM.map(v => v >= 0 ? '#1D9E75' : '#D85A30'),
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 11 }, autoSkip: false }, grid: { color: '#f3f4f6' } },
        y: { ticks: { callback: v => (v<0?'-':'')+Math.abs(v)+'€', font: { size: 10 } }, grid: { color: '#f3f4f6' } },
      },
    },
  }), [resM])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-sm font-medium text-gray-800 mb-3">Resultado por mes (Beneficio / Pérdida)</p>
      <div style={{ position: 'relative', height: 160 }}>
        <canvas ref={ref} role="img" aria-label="Resultado neto mensual">Beneficio o pérdida por mes.</canvas>
      </div>
    </div>
  )
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────
const TabDashboard = ({ cobros, pagos, onGoTab }) => {
  const [year,   setYear]   = useState('2026')
  const [period, setPeriod] = useState('year')

  const filtered = useMemo(() => {
    const ok = d => {
      if (!d) return true
      const dt = new Date(d)
      if (String(dt.getFullYear()) !== year) return false
      if (period === 'year') return true
      return String(Math.floor(dt.getMonth()/3)+1) === period.replace('q','')
    }
    return { cobros: cobros.filter(c=>ok(c.fecha)), pagos: pagos.filter(p=>ok(p.fecha)) }
  }, [cobros, pagos, year, period])

  const totalIng  = filtered.cobros.filter(c=>c.estado==='cobrado').reduce((a,c)=>a+c.importe,0)
  const totalGas  = filtered.pagos.filter(p=>p.estado==='pagado').reduce((a,p)=>a+p.importe,0)
  const resultado = totalIng - totalGas
  const porCobrar = filtered.cobros.filter(c=>c.estado==='pendiente'||isVencido(c)).reduce((a,c)=>a+c.importe,0)
  const vencidos  = filtered.cobros.filter(c=>isVencido(c))

  const pendCob = cobros.filter(c=>c.estado==='pendiente'||isVencido(c)).slice(0,5)
  const pendPag = pagos.filter(p=>p.estado==='pendiente').slice(0,5)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <select value={year} onChange={e=>setYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400 w-24">
          <option>2025</option><option>2026</option>
        </select>
        <select value={period} onChange={e=>setPeriod(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400 w-40">
          <option value="year">Año completo</option>
          <option value="q1">1er trimestre</option>
          <option value="q2">2º trimestre</option>
          <option value="q3">3er trimestre</option>
          <option value="q4">4º trimestre</option>
        </select>
      </div>

      {/* Alerta vencidos */}
      {vencidos.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{vencidos.length} cobro{vencidos.length>1?'s':''} vencido{vencidos.length>1?'s':''} — total {fmt(vencidos.reduce((a,c)=>a+c.importe,0))} €</span>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Ingresos cobrados" value={`${fmt(totalIng)} €`}  sub="Ejercicio actual"    color="text-emerald-600" />
        <MetricCard label="Gastos pagados"    value={`${fmt(totalGas)} €`}  sub="Ejercicio actual"    color="text-rose-600" />
        <MetricCard label="Resultado neto"    value={`${fmt(resultado)} €`} sub="Ingresos − Gastos"   color={resultado>=0?'text-emerald-600':'text-rose-600'} />
        <MetricCard label="Por cobrar"        value={`${fmt(porCobrar)} €`} sub="Pendiente + vencido" color="text-amber-600" />
      </div>

      {/* Gráficos fila 1: barras + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartIngresosGastos cobros={filtered.cobros} pagos={filtered.pagos} />
        <ChartDistribucionGastos pagos={filtered.pagos} />
      </div>

      {/* Cobros pendientes / Pagos próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-800">Cobros pendientes</p>
            <button onClick={()=>onGoTab('cobros')}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-50">Ver todos</button>
          </div>
          {pendCob.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Sin pendientes</p>
            : <table className="w-full text-sm">
                <thead><tr>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium pb-2">Cliente</th>
                  <th className="text-right text-xs text-gray-400 uppercase tracking-wide font-medium pb-2">Importe</th>
                  <th className="text-right text-xs text-gray-400 uppercase tracking-wide font-medium pb-2">Vence</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {pendCob.map(c => {
                    const e = estadoCobro(c)
                    return <tr key={c.id}>
                      <td className="py-2 text-gray-700 font-medium">{c.cliente}</td>
                      <td className={`py-2 text-right font-semibold ${e==='vencido'?'text-rose-600':'text-amber-600'}`}>{fmt(c.importe)} €</td>
                      <td className="py-2 text-right"><Badge estado={e} /></td>
                    </tr>
                  })}
                </tbody>
              </table>
          }
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-800">Pagos próximos</p>
            <button onClick={()=>onGoTab('pagos')}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-50">Ver todos</button>
          </div>
          {pendPag.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Sin pagos pendientes</p>
            : <table className="w-full text-sm">
                <thead><tr>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium pb-2">Proveedor</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium pb-2">Categoría</th>
                  <th className="text-right text-xs text-gray-400 uppercase tracking-wide font-medium pb-2">Importe</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {pendPag.map(p=><tr key={p.id}>
                    <td className="py-2 text-gray-700 font-medium">{p.proveedor}</td>
                    <td className="py-2 text-xs text-gray-400">{p.categoria}</td>
                    <td className="py-2 text-right font-semibold text-rose-600">{fmt(p.importe)} €</td>
                  </tr>)}
                </tbody>
              </table>
          }
        </div>
      </div>

      {/* Resultado mensual */}
      <ChartResultado cobros={filtered.cobros} pagos={filtered.pagos} />
    </div>
  )
}

// ─── Tab: Cobros ──────────────────────────────────────────────────────────────
const TabCobros = ({ cobros, onMarkCobrado, onNew }) => {
  const [filtro, setFiltro] = useState('todos')
  const [busca,  setBusca]  = useState('')

  const lista = useMemo(() => cobros.filter(c => {
    const e = estadoCobro(c)
    if (filtro !== 'todos' && e !== filtro) return false
    if (busca) { const q=busca.toLowerCase(); return c.cliente.toLowerCase().includes(q)||c.ref.toLowerCase().includes(q) }
    return true
  }), [cobros, filtro, busca])

  const totalFiltro = lista.reduce((a,c)=>a+c.importe,0)
  const cobrado     = lista.filter(c=>c.estado==='cobrado').reduce((a,c)=>a+c.importe,0)
  const pendiente   = lista.filter(c=>c.estado==='pendiente'&&!isVencido(c)).reduce((a,c)=>a+c.importe,0)
  const vencido     = lista.filter(c=>isVencido(c)).reduce((a,c)=>a+c.importe,0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {['todos','pendiente','cobrado','vencido'].map(f=>(
            <Chip key={f} label={f==='todos'?'Todos':f.charAt(0).toUpperCase()+f.slice(1)} active={filtro===f} onClick={()=>setFiltro(f)} />
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 w-44"
            placeholder="Buscar cliente..." value={busca} onChange={e=>setBusca(e.target.value)} />
        </div>
        <button onClick={onNew} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <Plus size={14}/> Nuevo cobro
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard label="Total"     value={`${fmt(totalFiltro)} €`} />
        <MetricCard label="Cobrado"   value={`${fmt(cobrado)} €`}   color="text-emerald-600" />
        <MetricCard label="Pendiente" value={`${fmt(pendiente)} €`} color="text-amber-600" />
        <MetricCard label="Vencido"   value={`${fmt(vencido)} €`}   color="text-rose-600" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {lista.length === 0
          ? <p className="text-center text-gray-400 text-sm py-8">No hay registros</p>
          : <>
              <div className="block lg:hidden divide-y divide-gray-50">
                {lista.map(c=>{const e=estadoCobro(c);return(
                  <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{c.cliente}</p>
                      <p className="text-xs text-gray-400">{c.ref} · {fmtD(c.vence)}</p>
                      <p className="text-xs text-gray-400 truncate">{c.concepto}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`font-semibold text-sm ${e==='cobrado'?'text-emerald-600':e==='vencido'?'text-rose-600':'text-amber-600'}`}>{fmt(c.importe)} €</span>
                      <Badge estado={e} />
                      {e!=='cobrado'&&<button onClick={()=>onMarkCobrado(c.id)} className="text-xs text-emerald-600 border border-emerald-200 rounded px-2 py-0.5 hover:bg-emerald-50">Cobrar</button>}
                    </div>
                  </div>
                )})}
              </div>
              <table className="hidden lg:table w-full text-sm">
                <thead><tr className="border-b border-gray-50">
                  {['Cliente','Ref.','Concepto','Importe','Vencimiento','Forma','Estado',''].map(h=>(
                    <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-4 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(c=>{const e=estadoCobro(c);return(
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.cliente}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{c.ref}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[10rem] truncate">{c.concepto}</td>
                      <td className={`px-4 py-3 font-semibold ${e==='cobrado'?'text-emerald-600':e==='vencido'?'text-rose-600':'text-amber-600'}`}>{fmt(c.importe)} €</td>
                      <td className={`px-4 py-3 text-xs ${e==='vencido'?'text-rose-600 font-medium':'text-gray-400'}`}>{fmtD(c.vence)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.forma}</td>
                      <td className="px-4 py-3"><Badge estado={e} /></td>
                      <td className="px-4 py-3">
                        {e!=='cobrado'&&<button onClick={()=>onMarkCobrado(c.id)} className="text-xs text-emerald-600 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-50 whitespace-nowrap">Marcar cobrado</button>}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </>
        }
      </div>
    </div>
  )
}

// ─── Tab: Pagos ───────────────────────────────────────────────────────────────
const TabPagos = ({ pagos, onMarkPagado, onNew }) => {
  const [filtro, setFiltro] = useState('todos')
  const [busca,  setBusca]  = useState('')

  const lista = useMemo(() => pagos.filter(p => {
    if (filtro!=='todos'&&p.estado!==filtro) return false
    if (busca) { const q=busca.toLowerCase(); return p.proveedor.toLowerCase().includes(q)||p.categoria.toLowerCase().includes(q) }
    return true
  }), [pagos, filtro, busca])

  const total     = lista.reduce((a,p)=>a+p.importe,0)
  const pagado    = lista.filter(p=>p.estado==='pagado').reduce((a,p)=>a+p.importe,0)
  const pendiente = lista.filter(p=>p.estado==='pendiente').reduce((a,p)=>a+p.importe,0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {['todos','pendiente','pagado'].map(f=>(
            <Chip key={f} label={f==='todos'?'Todos':f.charAt(0).toUpperCase()+f.slice(1)} active={filtro===f} onClick={()=>setFiltro(f)} />
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 w-44"
            placeholder="Buscar proveedor..." value={busca} onChange={e=>setBusca(e.target.value)} />
        </div>
        <button onClick={onNew} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700">
          <Plus size={14}/> Nuevo pago
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Total"     value={`${fmt(total)} €`} />
        <MetricCard label="Pagado"    value={`${fmt(pagado)} €`}    color="text-emerald-600" />
        <MetricCard label="Pendiente" value={`${fmt(pendiente)} €`} color="text-amber-600" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {lista.length === 0
          ? <p className="text-center text-gray-400 text-sm py-8">No hay registros</p>
          : <>
              <div className="block lg:hidden divide-y divide-gray-50">
                {lista.map(p=>(
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{p.proveedor}</p>
                      <p className="text-xs text-gray-400">{p.categoria}</p>
                      <p className="text-xs text-gray-400">{fmtD(p.fecha)} · IVA {p.iva}%</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`font-semibold text-sm ${p.estado==='pagado'?'text-emerald-600':'text-rose-600'}`}>{fmt(p.importe)} €</span>
                      <Badge estado={p.estado} />
                      {p.estado!=='pagado'&&<button onClick={()=>onMarkPagado(p.id)} className="text-xs text-violet-600 border border-violet-200 rounded px-2 py-0.5 hover:bg-violet-50">Pagar</button>}
                    </div>
                  </div>
                ))}
              </div>
              <table className="hidden lg:table w-full text-sm">
                <thead><tr className="border-b border-gray-50">
                  {['Proveedor','Categoría','Base imp.','IVA','Total','Fecha','Estado',''].map(h=>(
                    <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-4 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(p=>(
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.proveedor}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.categoria}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmt(p.base)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.iva}%</td>
                      <td className="px-4 py-3 font-semibold text-rose-600">{fmt(p.importe)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtD(p.fecha)}</td>
                      <td className="px-4 py-3"><Badge estado={p.estado} /></td>
                      <td className="px-4 py-3">
                        {p.estado!=='pagado'&&<button onClick={()=>onMarkPagado(p.id)} className="text-xs text-violet-600 border border-violet-200 rounded-lg px-2 py-1 hover:bg-violet-50 whitespace-nowrap">Marcar pagado</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
        }
      </div>
    </div>
  )
}

// ─── Tab: Libro diario ────────────────────────────────────────────────────────
const TabLibro = ({ cobros, pagos }) => {
  const [mes,  setMes]  = useState('')
  const [tipo, setTipo] = useState('')

  const rows = useMemo(() => {
    const res = []
    cobros.forEach(c => {
      if (tipo==='gasto') return
      if (mes) { const m=new Date(c.fecha).getMonth(); if (MESES_LARGO[m]!==mes) return }
      res.push({ fecha:c.fecha, tipo:'ingreso', desc:`${c.concepto} — ${c.cliente}`, ref:c.ref, base:c.importe, iva:0, total:c.importe, forma:c.forma, estado:c.estado })
    })
    pagos.forEach(p => {
      if (tipo==='ingreso') return
      if (mes) { const m=new Date(p.fecha).getMonth(); if (MESES_LARGO[m]!==mes) return }
      res.push({ fecha:p.fecha, tipo:'gasto', desc:`${p.categoria} — ${p.proveedor}`, ref:p.ref, base:p.base, iva:p.iva, total:p.importe, forma:p.forma, estado:p.estado })
    })
    return res.sort((a,b)=>a.fecha.localeCompare(b.fecha))
  }, [cobros, pagos, mes, tipo])

  const totalIng  = rows.filter(r=>r.tipo==='ingreso').reduce((a,r)=>a+r.total,0)
  const totalGas  = rows.filter(r=>r.tipo==='gasto').reduce((a,r)=>a+r.total,0)
  const resultado = totalIng - totalGas

  const exportCSV = () => {
    let csv = 'AMBELCOR — Libro de ingresos y gastos\n\n'
    csv += 'INGRESOS (COBROS)\nFecha,Cliente,Referencia,Concepto,Importe,Forma pago,Estado\n'
    cobros.forEach(c=>{ csv+=`${fmtD(c.fecha)},${c.cliente},${c.ref},"${c.concepto}",${fmt(c.importe)},${c.forma},${estadoCobro(c)}\n` })
    csv += '\nGASTOS (PAGOS A PROVEEDORES)\nFecha,Proveedor,Referencia,Categoría,Base imponible,IVA%,Total,Forma pago,Estado\n'
    pagos.forEach(p=>{ csv+=`${fmtD(p.fecha)},${p.proveedor},${p.ref},"${p.categoria}",${fmt(p.base)},${p.iva}%,${fmt(p.importe)},${p.forma},${p.estado}\n` })
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download='ambelcor-contabilidad-gestoria.csv'; a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          value={mes} onChange={e=>setMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {MESES_LARGO.map(m=><option key={m}>{m}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
        </select>
        <button onClick={exportCSV}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
          <Download size={14}/> Exportar para gestoría
        </button>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {rows.length === 0
          ? <p className="text-center text-gray-400 text-sm py-8">No hay apuntes</p>
          : <>
              <div className="block lg:hidden divide-y divide-gray-50">
                {rows.map((r,i)=>(
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.tipo==='ingreso'?'bg-emerald-400':'bg-rose-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{r.desc}</p>
                      <p className="text-xs text-gray-400">{fmtD(r.fecha)} · {r.forma}</p>
                    </div>
                    <span className={`text-sm font-semibold ${r.tipo==='ingreso'?'text-emerald-600':'text-rose-600'}`}>
                      {r.tipo==='ingreso'?'+':'-'}{fmt(r.total)} €
                    </span>
                  </div>
                ))}
              </div>
              <table className="hidden lg:table w-full text-sm">
                <thead><tr className="border-b border-gray-50">
                  {['Fecha','Tipo','Descripción','Ref.','Base','IVA%','Total','Forma','Estado'].map(h=>(
                    <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-4 py-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r,i)=>(
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtD(r.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          r.tipo==='ingreso'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>{r.tipo==='ingreso'?'Ingreso':'Gasto'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[13rem] truncate">{r.desc}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.ref}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmt(r.base)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.iva}%</td>
                      <td className={`px-4 py-3 font-semibold text-xs ${r.tipo==='ingreso'?'text-emerald-600':'text-rose-600'}`}>
                        {r.tipo==='ingreso'?'+':'-'}{fmt(r.total)} €
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.forma}</td>
                      <td className="px-4 py-3"><Badge estado={r.estado==='cobrado'||r.estado==='pagado'?r.estado:'pendiente'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap gap-4 justify-end px-4 py-3 border-t border-gray-50 text-sm">
                <span className="text-gray-500">Ingresos: <b className="text-emerald-600">{fmt(totalIng)} €</b></span>
                <span className="text-gray-500">Gastos: <b className="text-rose-600">{fmt(totalGas)} €</b></span>
                <span className="font-semibold text-gray-700">
                  Resultado: <b style={{color:resultado>=0?'#059669':'#e11d48'}}>{fmt(resultado)} €</b>
                </span>
              </div>
            </>
        }
      </div>
    </div>
  )
}

// ─── Componente raíz ──────────────────────────────────────────────────────────
export default function Contabilidad() {
  const [tab,        setTab]  = useState('dashboard')
  const [cobros, setCobros]   = useState(cobrosIniciales)
  const [pagos,  setPagos]    = useState(pagosIniciales)
  const [modalCobro, setMC]   = useState(false)
  const [modalPago,  setMP]   = useState(false)

  const nextCId = cobros.length ? Math.max(...cobros.map(c=>c.id))+1 : 1
  const nextPId = pagos.length  ? Math.max(...pagos.map(p=>p.id))+1  : 1

  const addCobro    = useCallback(c => setCobros(p=>[...p,c]),              [])
  const addPago     = useCallback(p => setPagos(prev=>[...prev,p]),         [])
  const markCobrado = useCallback(id=>setCobros(p=>p.map(c=>c.id===id?{...c,estado:'cobrado'}:c)),[])
  const markPagado  = useCallback(id=>setPagos(p=>p.map(c=>c.id===id?{...c,estado:'pagado'}:c)), [])

  const exportCSV = () => {
    let csv='AMBELCOR — Libro de ingresos y gastos\n\n'
    csv+='INGRESOS (COBROS)\nFecha,Cliente,Referencia,Concepto,Importe,Forma pago,Estado\n'
    cobros.forEach(c=>{csv+=`${fmtD(c.fecha)},${c.cliente},${c.ref},"${c.concepto}",${fmt(c.importe)},${c.forma},${estadoCobro(c)}\n`})
    csv+='\nGASTOS (PAGOS A PROVEEDORES)\nFecha,Proveedor,Referencia,Categoría,Base imponible,IVA%,Total,Forma pago,Estado\n'
    pagos.forEach(p=>{csv+=`${fmtD(p.fecha)},${p.proveedor},${p.ref},"${p.categoria}",${fmt(p.base)},${p.iva}%,${fmt(p.importe)},${p.forma},${p.estado}\n`})
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download='ambelcor-contabilidad-gestoria.csv'; a.click()
  }

  const TABS = [
    { id: 'dashboard', label: 'Dashboard',   Icon: LayoutDashboard },
    { id: 'cobros',    label: 'Cobros',       Icon: ArrowDownCircle  },
    { id: 'pagos',     label: 'Pagos',        Icon: ArrowUpCircle    },
    { id: 'libro',     label: 'Libro diario', Icon: BookOpen         },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Ambelcor</span>
            <span className="text-gray-300 text-sm">·</span>
            <span className="text-gray-500 text-sm">Contabilidad</span>
            <button onClick={exportCSV}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700">
              <Download size={12}/> Exportar Excel
            </button>
          </div>
          <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-1">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={()=>setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  tab===id ? 'border-violet-600 text-violet-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab==='dashboard' && <TabDashboard cobros={cobros} pagos={pagos} onGoTab={setTab} />}
        {tab==='cobros'    && <TabCobros    cobros={cobros} onMarkCobrado={markCobrado} onNew={()=>setMC(true)} />}
        {tab==='pagos'     && <TabPagos     pagos={pagos}   onMarkPagado={markPagado}   onNew={()=>setMP(true)} />}
        {tab==='libro'     && <TabLibro     cobros={cobros} pagos={pagos} />}
      </main>

      <Modal open={modalCobro} title="Nuevo cobro" onClose={()=>setMC(false)}>
        <FormCobro nextId={nextCId} onSave={addCobro} onClose={()=>setMC(false)} />
      </Modal>
      <Modal open={modalPago} title="Nuevo pago / gasto" onClose={()=>setMP(false)}>
        <FormPago nextId={nextPId} onSave={addPago} onClose={()=>setMP(false)} />
      </Modal>
    </div>
  )
}
