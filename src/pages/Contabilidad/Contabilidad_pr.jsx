/**
 * Contabilidad.jsx — Módulo de contabilidad para Ambelcor
 * Gestión de cobros a clientes y pagos a proveedores.
 * Stack: React 18 + Tailwind CSS + shadcn/ui (lucide-react)
 *
 * Integración Supabase: sustituir los arrays `cobrosIniciales` / `pagosIniciales`
 * por queries a las tablas `cobros` y `pagos`.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle,
  BookOpen, Download, Plus, X, Check,
  TrendingUp, TrendingDown, Clock, AlertCircle,
  ChevronRight, Search, Filter
} from 'lucide-react'

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
  { id: 1, proveedor: 'Tejidos Valencia S.L.',       ref: 'TV-2026-031',  categoria: 'Tejidos y materiales',       importe: 240, base: 198.35, iva: 21, fecha: '2026-03-05', pagofecha: '2026-03-10', forma: 'Transferencia', estado: 'pagado',    notas: '' },
  { id: 2, proveedor: 'Bordados Artesanales Paco',   ref: 'BAP-056',      categoria: 'Bordados y encajes',         importe: 180, base: 148.76, iva: 21, fecha: '2026-03-12', pagofecha: '',           forma: 'Efectivo',      estado: 'pendiente', notas: '' },
  { id: 3, proveedor: 'Seguridad Social',            ref: 'RETA-2026-03', categoria: 'Cuota autónomo',             importe: 295, base: 295,    iva: 0,  fecha: '2026-03-20', pagofecha: '2026-03-20', forma: 'Domiciliación', estado: 'pagado',    notas: '' },
  { id: 4, proveedor: 'Gestoría Pérez',              ref: 'GP-Q1-2026',   categoria: 'Gestoría / asesoría',        importe: 120, base: 99.17,  iva: 21, fecha: '2026-04-01', pagofecha: '',           forma: 'Transferencia', estado: 'pendiente', notas: '' },
  { id: 5, proveedor: 'Hilos y Avíos Mar',           ref: 'HAM-2026-08',  categoria: 'Hilos, botones y avíos',    importe: 65,  base: 53.72,  iva: 21, fecha: '2026-02-18', pagofecha: '2026-02-18', forma: 'Efectivo',      estado: 'pagado',    notas: '' },
  { id: 6, proveedor: 'Iberdrola',                   ref: 'IBER-0326',    categoria: 'Suministros (luz, agua...)',importe: 89,  base: 73.55,  iva: 21, fecha: '2026-03-28', pagofecha: '2026-03-28', forma: 'Domiciliación', estado: 'pagado',    notas: '' },
]

// ─── Constantes ───────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]

const CONCEPTOS_COBRO = [
  'Indumentaria valenciana (encargo)',
  'Arreglo / reparación',
  'Alquiler de traje',
  'Venta de piezas sueltas',
  'Anticipo / señal',
  'Liquidación final',
  'Otro',
]

const CATEGORIAS_PAGO = [
  'Tejidos y materiales',
  'Hilos, botones y avíos',
  'Bordados y encajes',
  'Maquinaria y equipos',
  'Mantenimiento taller',
  'Servicios profesionales',
  'Gestoría / asesoría',
  'Publicidad y marketing',
  'Suministros (luz, agua...)',
  'Cuota autónomo',
  'Alquiler local',
  'Otros gastos',
]

const FORMAS_COBRO  = ['Efectivo', 'Transferencia', 'Bizum', 'Tarjeta']
const FORMAS_PAGO   = ['Transferencia', 'Efectivo', 'Tarjeta', 'Domiciliación']
const TIPOS_IVA     = [
  { valor: 0,  label: '0% — Exento' },
  { valor: 4,  label: '4% — Superreducido' },
  { valor: 10, label: '10% — Reducido' },
  { valor: 21, label: '21% — General' },
]

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Utilidades ───────────────────────────────────────────────────────────────
const fmt  = n => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD = d => { if (!d) return '—'; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}` }
const isVencido = c => c.estado === 'pendiente' && c.vence && c.vence < TODAY
const estadoCobro = c => isVencido(c) ? 'vencido' : c.estado

// ─── Micro-componentes ────────────────────────────────────────────────────────
const Badge = ({ estado }) => {
  const map = {
    cobrado:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    pagado:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    pendiente: 'bg-amber-50   text-amber-700   border-amber-200',
    vencido:   'bg-red-50     text-red-700     border-red-200',
  }
  const labels = { cobrado: 'Cobrado', pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[estado] || map.pendiente}`}>
      {labels[estado] || estado}
    </span>
  )
}

const MetricCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    <span className={`text-xl font-semibold ${color}`}>{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
)

const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
      active
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
)

// ─── Modal genérico ───────────────────────────────────────────────────────────
const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Formulario de cobro ──────────────────────────────────────────────────────
const FormCobro = ({ nextId, onSave, onClose }) => {
  const [form, setForm] = useState({
    cliente: '', ref: `AMB-${String(nextId).padStart(4, '0')}`,
    concepto: CONCEPTOS_COBRO[0], importe: '',
    fecha: TODAY, vence: '',
    forma: 'Transferencia', estado: 'pendiente', notas: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.cliente.trim() || !form.importe) return alert('Indica cliente e importe.')
    onSave({ ...form, id: nextId, importe: parseFloat(form.importe) })
    onClose()
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Cliente</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nombre del cliente" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nº encargo / factura</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.ref} onChange={e => set('ref', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Concepto</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.concepto} onChange={e => set('concepto', e.target.value)}>
            {CONCEPTOS_COBRO.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Importe (€)</label>
          <input type="number" step="0.01" min="0"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.importe} onChange={e => set('importe', e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha emisión</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha vencimiento</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.vence} onChange={e => set('vence', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Forma de pago</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.forma} onChange={e => set('forma', e.target.value)}>
            {FORMAS_COBRO.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.estado} onChange={e => set('estado', e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="cobrado">Cobrado</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Notas</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones (opcional)" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
        <button onClick={handleSave} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
          <Check size={14} /> Guardar cobro
        </button>
      </div>
    </>
  )
}

// ─── Formulario de pago ───────────────────────────────────────────────────────
const FormPago = ({ nextId, onSave, onClose }) => {
  const [form, setForm] = useState({
    proveedor: '', ref: '', categoria: CATEGORIAS_PAGO[0],
    importe: '', base: '', iva: 21,
    fecha: TODAY, pagofecha: '',
    forma: 'Transferencia', estado: 'pendiente', notas: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.proveedor.trim() || !form.importe) return alert('Indica proveedor e importe.')
    onSave({
      ...form, id: nextId,
      importe: parseFloat(form.importe),
      base: parseFloat(form.base) || parseFloat(form.importe),
      iva: parseInt(form.iva),
    })
    onClose()
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Proveedor / Concepto</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Nombre proveedor" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nº factura proveedor</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.ref} onChange={e => set('ref', e.target.value)} placeholder="Referencia" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Categoría</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS_PAGO.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Importe total (€)</label>
          <input type="number" step="0.01" min="0"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.importe} onChange={e => set('importe', e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Base imponible (€)</label>
          <input type="number" step="0.01" min="0"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.base} onChange={e => set('base', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo IVA</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.iva} onChange={e => set('iva', e.target.value)}>
            {TIPOS_IVA.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha factura</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha pago</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.pagofecha} onChange={e => set('pagofecha', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Forma de pago</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.forma} onChange={e => set('forma', e.target.value)}>
            {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            value={form.estado} onChange={e => set('estado', e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Notas</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones (opcional)" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
        <button onClick={handleSave} className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-1">
          <Check size={14} /> Guardar pago
        </button>
      </div>
    </>
  )
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────
const TabDashboard = ({ cobros, pagos }) => {
  const totalIng  = cobros.filter(c => c.estado === 'cobrado').reduce((a, c) => a + c.importe, 0)
  const totalGas  = pagos.filter(p => p.estado === 'pagado').reduce((a, p) => a + p.importe, 0)
  const resultado = totalIng - totalGas
  const porCobrar = cobros.filter(c => c.estado === 'pendiente' || isVencido(c)).reduce((a, c) => a + c.importe, 0)
  const vencidos  = cobros.filter(c => isVencido(c))

  // Datos mensuales para mini-bars
  const ingM = Array(12).fill(0)
  const gasM = Array(12).fill(0)
  cobros.filter(c => c.estado === 'cobrado').forEach(c => { ingM[new Date(c.fecha).getMonth()] += c.importe })
  pagos.filter(p => p.estado === 'pagado').forEach(p => { gasM[new Date(p.fecha).getMonth()] += p.importe })
  const maxVal = Math.max(...ingM, ...gasM, 1)

  const pendCob = cobros.filter(c => c.estado === 'pendiente' || isVencido(c)).slice(0, 5)
  const pendPag = pagos.filter(p => p.estado === 'pendiente').slice(0, 5)

  return (
    <div className="space-y-4">
      {vencidos.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{vencidos.length} cobro{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''} — total {fmt(vencidos.reduce((a,c)=>a+c.importe,0))} €</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Ingresos cobrados" value={`${fmt(totalIng)} €`} sub="Ejercicio actual" color="text-emerald-600" />
        <MetricCard label="Gastos pagados"    value={`${fmt(totalGas)} €`} sub="Ejercicio actual" color="text-rose-600" />
        <MetricCard label="Resultado neto"    value={`${fmt(resultado)} €`} sub="Ingresos − Gastos" color={resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <MetricCard label="Por cobrar"        value={`${fmt(porCobrar)} €`} sub="Pendiente + vencido" color="text-amber-600" />
      </div>

      {/* Mini gráfico mensual */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Evolución mensual</p>
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {MESES.map((mes, i) => (
            <div key={mes} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5" style={{ height: 64 }}>
                <div className="flex-1 bg-emerald-400 rounded-t opacity-80 self-end transition-all"
                  style={{ height: `${(ingM[i] / maxVal) * 100}%` }} />
                <div className="flex-1 bg-rose-400 rounded-t opacity-80 self-end transition-all"
                  style={{ height: `${(gasM[i] / maxVal) * 100}%` }} />
              </div>
              <span className="text-[9px] text-gray-400">{mes}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />Ingresos</span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" />Gastos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cobros pendientes */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3 flex items-center gap-1">
            <Clock size={12} /> Cobros pendientes
          </p>
          {pendCob.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Sin pendientes</p>
            : <div className="space-y-2">
                {pendCob.map(c => {
                  const e = estadoCobro(c)
                  return (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{c.cliente}</p>
                        <p className="text-xs text-gray-400">{fmtD(c.vence)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`font-semibold ${e === 'vencido' ? 'text-rose-600' : 'text-amber-600'}`}>{fmt(c.importe)} €</span>
                        <Badge estado={e} />
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </div>

        {/* Pagos pendientes */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3 flex items-center gap-1">
            <Clock size={12} /> Pagos pendientes
          </p>
          {pendPag.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Sin pagos pendientes</p>
            : <div className="space-y-2">
                {pendPag.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.proveedor}</p>
                      <p className="text-xs text-gray-400">{p.categoria}</p>
                    </div>
                    <span className="font-semibold text-rose-600 ml-2">{fmt(p.importe)} €</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Cobros ──────────────────────────────────────────────────────────────
const TabCobros = ({ cobros, onMarkCobrado, onNew }) => {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => cobros.filter(c => {
    const e = estadoCobro(c)
    if (filtro !== 'todos' && e !== filtro) return false
    if (busca) {
      const q = busca.toLowerCase()
      return c.cliente.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q)
    }
    return true
  }), [cobros, filtro, busca])

  const totalFiltro = lista.reduce((a, c) => a + c.importe, 0)
  const cobrado     = lista.filter(c => c.estado === 'cobrado').reduce((a, c) => a + c.importe, 0)
  const pendiente   = lista.filter(c => c.estado === 'pendiente' && !isVencido(c)).reduce((a, c) => a + c.importe, 0)
  const vencido     = lista.filter(c => isVencido(c)).reduce((a, c) => a + c.importe, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {['todos','pendiente','cobrado','vencido'].map(f => (
            <Chip key={f} label={f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              active={filtro === f} onClick={() => setFiltro(f)} />
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 w-44"
            placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Nuevo cobro
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard label="Total"     value={`${fmt(totalFiltro)} €`} />
        <MetricCard label="Cobrado"   value={`${fmt(cobrado)} €`}   color="text-emerald-600" />
        <MetricCard label="Pendiente" value={`${fmt(pendiente)} €`} color="text-amber-600" />
        <MetricCard label="Vencido"   value={`${fmt(vencido)} €`}   color="text-rose-600" />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {lista.length === 0
          ? <p className="text-center text-gray-400 text-sm py-8">No hay registros</p>
          : (
            <>
              {/* Vista móvil: cards */}
              <div className="block lg:hidden divide-y divide-gray-50">
                {lista.map(c => {
                  const e = estadoCobro(c)
                  return (
                    <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{c.cliente}</p>
                        <p className="text-xs text-gray-400">{c.ref} · {fmtD(c.vence)}</p>
                        <p className="text-xs text-gray-400 truncate">{c.concepto}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`font-semibold text-sm ${e === 'cobrado' ? 'text-emerald-600' : e === 'vencido' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {fmt(c.importe)} €
                        </span>
                        <Badge estado={e} />
                        {e !== 'cobrado' && (
                          <button onClick={() => onMarkCobrado(c.id)}
                            className="text-xs text-emerald-600 border border-emerald-200 rounded px-2 py-0.5 hover:bg-emerald-50 transition-colors">
                            Cobrar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vista escritorio: tabla */}
              <table className="hidden lg:table w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Cliente','Ref.','Concepto','Importe','Vencimiento','Forma','Estado',''].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(c => {
                    const e = estadoCobro(c)
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.cliente}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{c.ref}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-40 truncate">{c.concepto}</td>
                        <td className={`px-4 py-3 font-semibold ${e === 'cobrado' ? 'text-emerald-600' : e === 'vencido' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {fmt(c.importe)} €
                        </td>
                        <td className={`px-4 py-3 text-xs ${e === 'vencido' ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>{fmtD(c.vence)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{c.forma}</td>
                        <td className="px-4 py-3"><Badge estado={e} /></td>
                        <td className="px-4 py-3">
                          {e !== 'cobrado' && (
                            <button onClick={() => onMarkCobrado(c.id)}
                              className="text-xs text-emerald-600 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-50 transition-colors whitespace-nowrap">
                              Marcar cobrado
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )
        }
      </div>
    </div>
  )
}

// ─── Tab: Pagos ───────────────────────────────────────────────────────────────
const TabPagos = ({ pagos, onMarkPagado, onNew }) => {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => pagos.filter(p => {
    if (filtro !== 'todos' && p.estado !== filtro) return false
    if (busca) {
      const q = busca.toLowerCase()
      return p.proveedor.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q)
    }
    return true
  }), [pagos, filtro, busca])

  const total    = lista.reduce((a, p) => a + p.importe, 0)
  const pagado   = lista.filter(p => p.estado === 'pagado').reduce((a, p) => a + p.importe, 0)
  const pendiente= lista.filter(p => p.estado === 'pendiente').reduce((a, p) => a + p.importe, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {['todos','pendiente','pagado'].map(f => (
            <Chip key={f} label={f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              active={filtro === f} onClick={() => setFiltro(f)} />
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 w-44"
            placeholder="Buscar proveedor..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
          <Plus size={14} /> Nuevo pago
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
          : (
            <>
              {/* Vista móvil */}
              <div className="block lg:hidden divide-y divide-gray-50">
                {lista.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{p.proveedor}</p>
                      <p className="text-xs text-gray-400">{p.categoria}</p>
                      <p className="text-xs text-gray-400">{fmtD(p.fecha)} · IVA {p.iva}%</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`font-semibold text-sm ${p.estado === 'pagado' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmt(p.importe)} €
                      </span>
                      <Badge estado={p.estado} />
                      {p.estado !== 'pagado' && (
                        <button onClick={() => onMarkPagado(p.id)}
                          className="text-xs text-violet-600 border border-violet-200 rounded px-2 py-0.5 hover:bg-violet-50 transition-colors">
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista escritorio */}
              <table className="hidden lg:table w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Proveedor','Categoría','Base imp.','IVA','Total','Fecha','Estado',''].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.proveedor}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.categoria}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmt(p.base)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.iva}%</td>
                      <td className="px-4 py-3 font-semibold text-rose-600">{fmt(p.importe)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtD(p.fecha)}</td>
                      <td className="px-4 py-3"><Badge estado={p.estado} /></td>
                      <td className="px-4 py-3">
                        {p.estado !== 'pagado' && (
                          <button onClick={() => onMarkPagado(p.id)}
                            className="text-xs text-violet-600 border border-violet-200 rounded-lg px-2 py-1 hover:bg-violet-50 transition-colors whitespace-nowrap">
                            Marcar pagado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        }
      </div>
    </div>
  )
}

// ─── Tab: Libro diario ────────────────────────────────────────────────────────
const TabLibro = ({ cobros, pagos }) => {
  const [mes, setMes] = useState('')
  const [tipo, setTipo] = useState('')

  const mesesNombre = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const rows = useMemo(() => {
    const res = []
    cobros.forEach(c => {
      if (tipo === 'gasto') return
      if (mes) { const m = new Date(c.fecha).getMonth(); if (mesesNombre[m] !== mes) return }
      res.push({ fecha: c.fecha, tipo: 'ingreso', desc: `${c.concepto} — ${c.cliente}`, ref: c.ref, base: c.importe, iva: 0, total: c.importe, forma: c.forma, estado: c.estado })
    })
    pagos.forEach(p => {
      if (tipo === 'ingreso') return
      if (mes) { const m = new Date(p.fecha).getMonth(); if (mesesNombre[m] !== mes) return }
      res.push({ fecha: p.fecha, tipo: 'gasto', desc: `${p.categoria} — ${p.proveedor}`, ref: p.ref, base: p.base, iva: p.iva, total: p.importe, forma: p.forma, estado: p.estado })
    })
    return res.sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [cobros, pagos, mes, tipo])

  const totalIng = rows.filter(r => r.tipo === 'ingreso').reduce((a, r) => a + r.total, 0)
  const totalGas = rows.filter(r => r.tipo === 'gasto').reduce((a, r) => a + r.total, 0)
  const resultado = totalIng - totalGas

  const exportCSV = () => {
    let csv = 'AMBELCOR — Libro de ingresos y gastos\n\n'
    csv += 'INGRESOS (COBROS)\nFecha,Cliente,Referencia,Concepto,Importe,Forma pago,Estado\n'
    cobros.forEach(c => { csv += `${fmtD(c.fecha)},${c.cliente},${c.ref},"${c.concepto}",${fmt(c.importe)},${c.forma},${estadoCobro(c)}\n` })
    csv += '\nGASTOS (PAGOS A PROVEEDORES)\nFecha,Proveedor,Referencia,Categoría,Base imponible,IVA%,Total,Forma pago,Estado\n'
    pagos.forEach(p => { csv += `${fmtD(p.fecha)},${p.proveedor},${p.ref},"${p.categoria}",${fmt(p.base)},${p.iva}%,${fmt(p.importe)},${p.forma},${p.estado}\n` })
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'ambelcor-contabilidad-gestoria.csv'; a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          value={mes} onChange={e => setMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {mesesNombre.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
        </select>
        <button onClick={exportCSV}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
          <Download size={14} /> Exportar para gestoría
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {rows.length === 0
          ? <p className="text-center text-gray-400 text-sm py-8">No hay apuntes</p>
          : (
            <>
              {/* Móvil */}
              <div className="block lg:hidden divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.tipo === 'ingreso' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{r.desc}</p>
                      <p className="text-xs text-gray-400">{fmtD(r.fecha)} · {r.forma}</p>
                    </div>
                    <span className={`text-sm font-semibold ${r.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {r.tipo === 'ingreso' ? '+' : '-'}{fmt(r.total)} €
                    </span>
                  </div>
                ))}
              </div>

              {/* Escritorio */}
              <table className="hidden lg:table w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Fecha','Tipo','Descripción','Ref.','Base','IVA%','Total','Forma','Estado'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtD(r.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          r.tipo === 'ingreso'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>{r.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-52 truncate">{r.desc}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.ref}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmt(r.base)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.iva}%</td>
                      <td className={`px-4 py-3 font-semibold text-xs ${r.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.tipo === 'ingreso' ? '+' : '-'}{fmt(r.total)} €
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.forma}</td>
                      <td className="px-4 py-3"><Badge estado={r.estado === 'cobrado' || r.estado === 'pagado' ? r.estado : 'pendiente'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        }
        {/* Totales */}
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-end px-4 py-3 border-t border-gray-50 text-sm">
            <span className="text-gray-500">Ingresos: <b className="text-emerald-600">{fmt(totalIng)} €</b></span>
            <span className="text-gray-500">Gastos: <b className="text-rose-600">{fmt(totalGas)} €</b></span>
            <span className="font-semibold text-gray-700">
              Resultado: <b style={{ color: resultado >= 0 ? '#059669' : '#e11d48' }}>{fmt(resultado)} €</b>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Contabilidad() {
  const [tab, setTab] = useState('dashboard')
  const [cobros, setCobros] = useState(cobrosIniciales)
  const [pagos, setPagos]   = useState(pagosIniciales)
  const [modalCobro, setModalCobro] = useState(false)
  const [modalPago,  setModalPago]  = useState(false)

  const nextCId = cobros.length ? Math.max(...cobros.map(c => c.id)) + 1 : 1
  const nextPId = pagos.length  ? Math.max(...pagos.map(p => p.id))  + 1 : 1

  const addCobro = useCallback(c => setCobros(prev => [...prev, c]), [])
  const addPago  = useCallback(p => setPagos(prev => [...prev, p]),   [])

  const markCobrado = useCallback(id => {
    setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'cobrado' } : c))
  }, [])

  const markPagado = useCallback(id => {
    setPagos(prev => prev.map(p => p.id === id ? { ...p, estado: 'pagado' } : p))
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'cobros',    label: 'Cobros',        icon: ArrowDownCircle  },
    { id: 'pagos',     label: 'Pagos',         icon: ArrowUpCircle    },
    { id: 'libro',     label: 'Libro diario',  icon: BookOpen         },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">Ambelcor</span>
              <span className="text-gray-400 text-sm"> · Contabilidad</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-px scrollbar-none">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  tab === id
                    ? 'border-violet-600 text-violet-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab === 'dashboard' && <TabDashboard cobros={cobros} pagos={pagos} />}
        {tab === 'cobros'    && <TabCobros cobros={cobros} onMarkCobrado={markCobrado} onNew={() => setModalCobro(true)} />}
        {tab === 'pagos'     && <TabPagos  pagos={pagos}   onMarkPagado={markPagado}   onNew={() => setModalPago(true)}  />}
        {tab === 'libro'     && <TabLibro  cobros={cobros} pagos={pagos} />}
      </main>

      {/* Modales */}
      <Modal open={modalCobro} title="Nuevo cobro" onClose={() => setModalCobro(false)}>
        <FormCobro nextId={nextCId} onSave={addCobro} onClose={() => setModalCobro(false)} />
      </Modal>

      <Modal open={modalPago} title="Nuevo pago / gasto" onClose={() => setModalPago(false)}>
        <FormPago nextId={nextPId} onSave={addPago} onClose={() => setModalPago(false)} />
      </Modal>
    </div>
  )
}
