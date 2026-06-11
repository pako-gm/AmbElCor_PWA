/* ============================================================
   Inventario AmbElCor — Módulo Proveedores integrado
   (maestro-detalle + ficha + artículos + pagos + edición)
   ============================================================ */
import { useState, useEffect } from 'react'
import { Icon, Btn, Field } from './InventarioUI'
import { fetchProveedores, fetchProveedor, crearProveedor, actualizarProveedor } from '@/hooks/useProveedores'
import { formatImporte } from '@/utils/formatters'

function fmtDate(s) {
  if (!s) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s))
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s
}

const PROV_COLORS = ['#1fb39a', '#118b78', '#0d5f52', '#b07d33', '#8a6520', '#1fb39a', '#118b78', '#b07d33']
function colorForId(id) {
  if (!id) return PROV_COLORS[0]
  const n = typeof id === 'string' ? id.charCodeAt(0) : id
  return PROV_COLORS[n % PROV_COLORS.length]
}

/* ---------- Item de la lista ---------- */
function ProviderItem({ proveedor, active, onClick }) {
  return (
    <button
      className={`prov-item${active ? ' prov-item--on' : ''}`}
      onClick={onClick}
    >
      <span
        className="prov-item__icon"
        style={{ background: colorForId(proveedor.id), borderRadius: 11, width: 40, height: 40 }}
      >
        <Icon name="building" size={18} />
      </span>
      <span className="prov-item__txt">
        <span className="prov-item__name">{proveedor.nombre}</span>
        <span className="prov-item__sub">{proveedor.contacto || 'Sin contacto asignado'}</span>
      </span>
      <Icon name="chevron" size={16} style={{ transform: 'rotate(-90deg)', opacity: 0.5 }} />
    </button>
  )
}

/* ---------- Detalle del proveedor ---------- */
function ProviderDetail({ proveedorId, onEdit, onReload }) {
  const [proveedor, setProveedor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!proveedorId) return
    setLoading(true)
    fetchProveedor(proveedorId).then(setProveedor).finally(() => setLoading(false))
  }, [proveedorId])

  if (loading) return <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Cargando…</div>
  if (!proveedor) return null

  const pagos = proveedor.pagos_proveedor || []
  const materiales = proveedor.inventario || []
  const totalGastado = pagos.reduce((s, p) => s + parseFloat(p.importe || 0), 0)

  return (
    <div className="prov-detail">
      {/* Cabecera del panel */}
      <div className="panel">
        <div className="prov-detail__head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <h2 className="prov-name" style={{ margin: 0 }}>{proveedor.nombre}</h2>
          <Btn kind="ghost" icon="pencil" onClick={onEdit}>Editar</Btn>
        </div>

        {/* Datos de contacto */}
        <div className="prov-contact">
          {proveedor.contacto && (
            <div className="prov-contact__item">
              <span className="prov-contact__ic"><Icon name="person" size={16} /></span>
              <div>
                <span className="prov-contact__label">CONTACTO</span>
                <span className="prov-contact__value">{proveedor.contacto}</span>
              </div>
            </div>
          )}
          <div className="prov-contact__item">
            <span className="prov-contact__ic"><Icon name="phone" size={16} /></span>
            <div>
              <span className="prov-contact__label">TELÉFONO</span>
              <span className="prov-contact__value">{proveedor.telefono || '—'}</span>
            </div>
          </div>
          <div className="prov-contact__item">
            <span className="prov-contact__ic"><Icon name="mail" size={16} /></span>
            <div>
              <span className="prov-contact__label">EMAIL</span>
              <span className="prov-contact__value">{proveedor.email || '—'}</span>
            </div>
          </div>
          <div className="prov-contact__item">
            <span className="prov-contact__ic"><Icon name="calendar" size={16} /></span>
            <div>
              <span className="prov-contact__label">DESDE</span>
              <span className="prov-contact__value">{fmtDate(proveedor.created_at)}</span>
            </div>
          </div>
          <div className="prov-contact__item">
            <span className="prov-contact__ic"><Icon name="card" size={16} /></span>
            <div>
              <span className="prov-contact__label">TOTAL GASTADO</span>
              <span className="prov-contact__value" style={{ color: 'var(--brand-deep)', fontWeight: 800 }}>{formatImporte(totalGastado)}</span>
            </div>
          </div>
        </div>

        {proveedor.notas && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 14, color: 'var(--ink-2)', borderLeft: '3px solid var(--line)' }}>
            {proveedor.notas}
          </div>
        )}
      </div>

      {/* Artículos asociados */}
      {materiales.length > 0 && (
        <section className="panel">
          <h3 className="panel__title">Artículos de este proveedor</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
              <thead>
                <tr>
                  {['ARTÍCULO', 'STOCK', 'MÍNIMO', 'UNIDAD'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiales.map((m) => {
                  const stockBajo = parseFloat(m.stock || 0) < parseFloat(m.stock_minimo || 0)
                  return (
                    <tr key={m.id}>
                      <td style={{ padding: '12px', fontWeight: 600, borderBottom: '1px solid var(--line-2)' }}>{m.nombre}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line-2)', color: stockBajo ? 'var(--bajo)' : 'var(--ink)', fontWeight: stockBajo ? 700 : 400 }}>
                        {parseFloat(m.stock || 0).toFixed(2)}
                        {stockBajo && <Icon name="warn" size={13} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line-2)', color: 'var(--muted)' }}>{parseFloat(m.stock_minimo || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line-2)', color: 'var(--muted)' }}>{m.unidad || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Historial de pagos */}
      <section className="panel">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="panel__title" style={{ margin: 0 }}>Historial de pagos</h3>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>Total gastado</span>
            <b style={{ fontSize: 19, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatImporte(totalGastado)}</b>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pagos.length > 0 ? pagos.map((p) => (
            <div className="prov-pay" key={p.id}>
              <div>
                <span className="prov-pay__concept">{p.concepto}</span>
                <span className="prov-pay__meta">{fmtDate(p.fecha)} · {p.forma_pago || 'Sin método'}{p.referencia ? ` · ${p.referencia}` : ''}</span>
              </div>
              <b className="prov-pay__amount">{formatImporte(parseFloat(p.importe || 0))}</b>
            </div>
          )) : (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>Sin pagos registrados.</div>
          )}
        </div>
      </section>
    </div>
  )
}

/* ---------- Formulario (alta / edición) ---------- */
function ProviderForm({ proveedor, isNew, onSave, onCancel }) {
  const blank = { nombre: '', contacto: '', telefono: '', email: '', notas: '' }
  const [f, setF] = useState({ ...blank, ...(proveedor || {}) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async () => {
    if (!f.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(f)
    } catch (e) {
      setError(e.message || 'Error al guardar.')
      setSaving(false)
    }
  }

  return (
    <div className="prov-detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <button className="backlink" onClick={onCancel} style={{ width: 38, height: 38, border: '1px solid var(--line)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
          <Icon name="back" size={15} />
        </button>
        <div>
          <h2 className="prov-name">{f.nombre || 'Nuevo proveedor'}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14.5 }}>{isNew ? 'Alta de proveedor' : 'Editar datos'}</p>
        </div>
      </div>

      <section className="panel">
        <h3 className="panel__title">Datos de contacto</h3>
        <div className="card-form" style={{ border: 'none', boxShadow: 'none', padding: 0, gap: 16 }}>
          <Field label="NOMBRE *">
            <input className="input" value={f.nombre} onChange={set('nombre')} placeholder="Ej: Bordados Artesanía Valencia" autoFocus />
          </Field>
          <Field label="PERSONA DE CONTACTO">
            <input className="input" value={f.contacto || ''} onChange={set('contacto')} placeholder="Ej: Milagros" />
          </Field>
          <div className="grid-2">
            <Field label="TELÉFONO">
              <input className="input" value={f.telefono || ''} onChange={set('telefono')} placeholder="963 000 000" />
            </Field>
            <Field label="EMAIL">
              <input className="input" type="email" value={f.email || ''} onChange={set('email')} placeholder="correo@proveedor.com" />
            </Field>
          </div>
          <Field label="NOTAS">
            <textarea className="input textarea" value={f.notas || ''} onChange={set('notas')} placeholder="Observaciones, condiciones, etc." />
          </Field>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>{error}</div>
          )}

          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <Btn kind="brand" icon="check" onClick={submit} disabled={saving}>
              {saving ? 'Guardando…' : isNew ? 'Crear proveedor' : 'Guardar cambios'}
            </Btn>
            <Btn kind="muted" icon="x" onClick={onCancel}>Cancelar</Btn>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ---------- Vista Proveedores (maestro-detalle) ---------- */
export default function ProveedoresPanel() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('view') // 'view' | 'create' | 'edit'
  const [query, setQuery] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    fetchProveedores().then((data) => {
      setProveedores(data)
      if (data.length && !selectedId) setSelectedId(data[0].id)
      setLoading(false)
    })
  }, [reload])

  const filtrados = proveedores.filter((p) =>
    (p.nombre + ' ' + (p.contacto || '') + ' ' + (p.email || '')).toLowerCase().includes(query.toLowerCase())
  )

  const handleSave = async (form) => {
    if (mode === 'create') {
      const nuevo = await crearProveedor(form)
      setSelectedId(nuevo.id)
    } else {
      await actualizarProveedor(selectedId, form)
    }
    setMode('view')
    setReload(r => r + 1)
  }

  const handleReload = () => setReload(r => r + 1)

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Cargando proveedores…</div>

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>Proveedores</h1>
        <Btn kind="brand" icon="plus" onClick={() => { setMode('create') }}>Nuevo proveedor</Btn>
      </div>

      <div className="prov-grid">
        {/* Lista lateral */}
        <aside className="prov-list">
          <div className="prov-list__head">
            PROVEEDORES ({proveedores.length} en total)
          </div>
          <div className="searchbox searchbox--inlist" style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', height: 40, marginBottom: 10 }}>
            <Icon name="search" size={16} />
            <input
              style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', color: 'var(--ink)', width: '100%' }}
              placeholder="Buscar por nombre o contacto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="prov-list__scroll">
            {filtrados.map((p) => (
              <ProviderItem
                key={p.id}
                proveedor={p}
                active={mode === 'view' && selectedId === p.id}
                onClick={() => { setSelectedId(p.id); setMode('view') }}
              />
            ))}
            {!filtrados.length && (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 4px' }}>Sin resultados.</div>
            )}
          </div>
        </aside>

        {/* Contenido derecho */}
        {mode === 'create' ? (
          <ProviderForm isNew onSave={handleSave} onCancel={() => setMode('view')} />
        ) : mode === 'edit' ? (
          <ProviderForm
            proveedor={proveedores.find(p => p.id === selectedId)}
            onSave={handleSave}
            onCancel={() => setMode('view')}
          />
        ) : selectedId ? (
          <ProviderDetail
            proveedorId={selectedId}
            onEdit={() => setMode('edit')}
            onReload={handleReload}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Selecciona un proveedor de la lista.</div>
        )}
      </div>
    </div>
  )
}
