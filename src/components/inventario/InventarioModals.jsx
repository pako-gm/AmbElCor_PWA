/* ============================================================
   Inventario AmbElCor — Modales: Entrada / Salida / Ajuste,
   editar línea y pop-up de detalle de línea
   ============================================================ */
import { useState, useEffect } from 'react'
import { Icon, Btn, Modal, Field, Help, StatusPill, CatBadge } from './InventarioUI'
import { formatCantidad } from '@/utils/formatters'
import { sanitizers } from '@/utils/validators'

// Para campos numéricos de inventario: conserva dígitos y separadores
// (la función parse() admite miles "1.234,56"); solo bloquea el resto.
const soloNumerico = (v) => (v ?? '').replace(/[^\d.,]/g, '')

const UNIT_DISPLAY = {
  unidad: 'ud.',
  metro: 'm',
  metro_cuadrado: 'm²',
  kilogramo: 'kg',
  litro: 'l',
  par: 'par',
  rollo: 'rollo',
  caja: 'caja',
}

const CATEGORIAS_PREDEFINIDAS = ['Telas', 'Pasamanería', 'Joyería fallera', 'Mercería', 'Botones']

const fmtNum = (n) => formatCantidad(n || 0)
function fmtDate(s) {
  if (!s) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s))
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s
}
function signed(n) {
  return (n > 0 ? '+' : '') + fmtNum(n)
}
function parse(s) {
  return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0
}
function stockStatus(material) {
  const stock = parseFloat(material.stock_actual || 0)
  const min = parseFloat(material.stock_minimo || 0)
  if (stock <= 0) return 'AGOTADO'
  if (stock < min) return 'BAJO'
  return 'OK'
}

const MOV_CONFIG = {
  entrada: {
    tone: 'green', title: 'Entrada', confirm: 'Confirmar entrada',
    qtyLabel: 'CANTIDAD', costLabel: 'COSTE/UD (€)', costEditable: true,
    partyLabel: 'PROVEEDOR', partyPlaceholder: 'Elegir proveedor',
    refLabel: 'REFERENCIA', refPlaceholder: 'FAC-2605 · nº de albarán o factura',
    refHint: 'La referencia es el nº de albarán o factura del proveedor.',
  },
  salida: {
    tone: 'purple', title: 'Salida', confirm: 'Confirmar salida',
    qtyLabel: 'CANTIDAD', costLabel: 'COSTE (PMP)', costEditable: false,
    partyLabel: 'ENCARGO / CLIENTE', partyPlaceholder: 'Elegir encargo / cliente',
    refLabel: 'REFERENCIA', refPlaceholder: 'AMB-0143 · nº de encargo',
    refHint: 'La referencia es el nº de encargo al que se imputa el material.',
  },
  ajuste: {
    tone: 'amber', title: 'Ajuste', confirm: 'Confirmar ajuste',
    qtyLabel: 'CANTIDAD', costLabel: 'COSTE (PMP)', costEditable: false,
    partyLabel: null,
    refLabel: 'REFERENCIA', refPlaceholder: 'INV-0004 · documento interno',
    refHint: 'Documento interno de inventario (recuento, merma, regularización).',
  },
}

/* ---------- Modal de movimiento (Entrada / Salida / Ajuste) ---------- */
export function MovementModal({ type, materiales, proveedores, encargos, initialId, onClose, onConfirm }) {
  const cfg = MOV_CONFIG[type]
  const ordered = [...materiales].sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
  const [matId, setMatId] = useState(initialId || ordered[0]?.id || '')
  const m = materiales.find((x) => x.id === matId) || ordered[0]
  const unit = UNIT_DISPLAY[m?.unidad_gestion] || m?.unidad_gestion || 'ud.'
  const pmp = parseFloat(m?.precio_referencia || 0)
  const stock = parseFloat(m?.stock_actual || 0)

  const [qty, setQty] = useState('')
  const [cost, setCost] = useState(cfg.costEditable ? '' : fmtNum(pmp))
  const [party, setParty] = useState('')
  const [motivo, setMotivo] = useState('')
  const [tipoAjuste, setTipoAjuste] = useState('')
  const [ref, setRef] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!cfg.costEditable) setCost(fmtNum(parseFloat(m?.precio_referencia || 0)))
  }, [matId])

  const qtyNum = parse(qty)
  const delta = type === 'salida'
    ? -Math.abs(qtyNum)
    : type === 'ajuste'
    ? (tipoAjuste === 'salida' ? -1 : 1) * Math.abs(qtyNum)
    : Math.abs(qtyNum)
  const resulting = Math.round((stock + delta) * 100) / 100

  const confirm = async () => {
    setSaving(true)
    try {
      await onConfirm({
        materialId: matId,
        kind: type,
        qty: delta,
        costeUd: cfg.costEditable ? parse(cost) : pmp,
        proveedorId: type === 'entrada' ? (proveedores.find(p => p.nombre === party)?.id || null) : null,
        encargo: type === 'salida' ? party : null,
        motivo: type === 'ajuste' ? motivo : null,
        referencia: ref || cfg.refPlaceholder.split(' · ')[0],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const listaParty = type === 'entrada'
    ? proveedores.map(p => p.nombre)
    : type === 'salida'
    ? encargos.map(e => e.label)
    : []

  const partyRequired = type === 'entrada' || type === 'salida'
  const canConfirm =
    Math.abs(qtyNum) > 0 &&
    (!cfg.costEditable || parse(cost) > 0) &&
    (!partyRequired || !!party) &&
    (type !== 'ajuste' || (tipoAjuste !== '' && motivo.trim() !== ''))

  return (
    <Modal
      tone={cfg.tone}
      eyebrow="REGISTRAR MOVIMIENTO"
      title={cfg.title}
      onClose={onClose}
      footer={
        <>
          <Btn kind="muted" onClick={onClose}>Cancelar</Btn>
          <Btn kind={cfg.tone} onClick={confirm} disabled={saving || !canConfirm}>
            {saving ? 'Guardando…' : cfg.confirm}
          </Btn>
        </>
      }
    >
      <Field label="ARTÍCULO" htmlFor="mv-art">
        <div className="select-wrap">
          <select id="mv-art" className="input" value={matId} onChange={(e) => setMatId(e.target.value)}>
            {ordered.map((x) => (
              <option key={x.id} value={x.id}>
                {x.codigo} · {x.nombre} ({fmtNum(parseFloat(x.stock_actual || 0))} {UNIT_DISPLAY[x.unidad_gestion] || x.unidad_gestion})
              </option>
            ))}
          </select>
          <Icon name="chevron" size={16} />
        </div>
      </Field>

      {type === 'ajuste' && (
        <Field label="TIPO DE AJUSTE" htmlFor="mv-tipo">
          <div className="select-wrap">
            <select id="mv-tipo" className="input" value={tipoAjuste} onChange={(e) => setTipoAjuste(e.target.value)}>
              <option value="">Elegir tipo…</option>
              <option value="entrada">Entrada (+)</option>
              <option value="salida">Salida (−)</option>
            </select>
            <Icon name="chevron" size={16} />
          </div>
        </Field>
      )}

      <div className="grid-2">
        <Field label={cfg.qtyLabel} htmlFor="mv-qty">
          <div className="input-affix" style={{ position: 'relative' }}>
            <input id="mv-qty" className="input" value={qty} onChange={(e) => setQty(soloNumerico(e.target.value))} inputMode="decimal" style={{ paddingRight: '48px' }} />
            <span className="affix" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontWeight: 600, pointerEvents: 'none' }}>{unit}</span>
          </div>
        </Field>
        <Field
          label={
            <>
              {cfg.costLabel}
              {!cfg.costEditable && (
                <Help>
                  <strong>PMP = Precio Medio Ponderado.</strong> Es el coste medio de todas las entradas que quedan en stock.
                </Help>
              )}
            </>
          }
          htmlFor="mv-cost"
        >
          <input
            id="mv-cost"
            className={`input${cfg.costEditable ? '' : ' input--readonly'}`}
            value={cost}
            onChange={(e) => cfg.costEditable && setCost(soloNumerico(e.target.value))}
            readOnly={!cfg.costEditable}
            inputMode="decimal"
          />
        </Field>
      </div>

      {cfg.partyLabel && listaParty.length > 0 && (
        <Field label={cfg.partyLabel} htmlFor="mv-party">
          <div className="select-wrap">
            <select id="mv-party" className="input" value={party} onChange={(e) => setParty(e.target.value)}>
              <option value="">{cfg.partyPlaceholder}</option>
              {listaParty.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <Icon name="chevron" size={16} />
          </div>
        </Field>
      )}

      {type === 'ajuste' && (
        <Field label="MOTIVO" htmlFor="mv-motivo">
          <input id="mv-motivo" className="input" placeholder="Merma por corte" value={motivo} onChange={(e) => setMotivo(sanitizers.texto(e.target.value))} />
        </Field>
      )}

      <Field label={cfg.refLabel} hint={cfg.refHint} htmlFor="mv-ref">
        <input id="mv-ref" className="input" placeholder={cfg.refPlaceholder} value={ref} onChange={(e) => setRef(sanitizers.texto(e.target.value))} />
      </Field>

      <div className={`resume resume--${cfg.tone}`}>
        <div className="resume__row"><span>Stock actual:</span><b>{fmtNum(stock)} {unit}</b></div>
        <div className="resume__row resume__row--accent">
          <span>Stock resultante:</span><b>{fmtNum(resulting)} {unit}</b>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Editar datos de un artículo del catálogo ---------- */
export function LineEditModal({ material, categorias, unidades, onClose, onSave }) {
  const [nombre, setNombre] = useState(material.nombre || '')
  const [categoria, setCategoria] = useState(material.categoria || '')
  const [unidad, setUnidad] = useState(material.unidad || 'unidad')
  const [min, setMin] = useState(fmtNum(parseFloat(material.stock_minimo || 0)))
  const [pmp, setPmp] = useState(fmtNum(parseFloat(material.precio_referencia || 0)))
  const [saving, setSaving] = useState(false)

  const cats = categorias?.length ? categorias : CATEGORIAS_PREDEFINIDAS

  const save = async () => {
    setSaving(true)
    try {
      await onSave({ nombre, categoria, unidad, stock_minimo: parse(min), precio_referencia: parse(pmp) })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      tone="slate"
      title="Editar artículo"
      onClose={onClose}
      footer={
        <>
          <Btn kind="muted" onClick={onClose}>Cancelar</Btn>
          <Btn kind="brand" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Btn>
        </>
      }
    >
      <Field label="NOMBRE DEL ARTÍCULO">
        <input className="input" value={nombre} onChange={(e) => setNombre(sanitizers.texto(e.target.value))} />
      </Field>
      <div className="grid-2">
        <Field label="CATEGORÍA">
          <div className="select-wrap">
            <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">— Sin categoría —</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Icon name="chevron" size={16} />
          </div>
        </Field>
        <Field label="UNIDAD DE GESTIÓN">
          <div className="select-wrap">
            <select className="input" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              {unidades?.length
                ? unidades.map(u => <option key={u.id} value={u.clave}>{u.etiqueta} ({u.abreviatura})</option>)
                : <option value={unidad}>{unidad}</option>
              }
            </select>
            <Icon name="chevron" size={16} />
          </div>
        </Field>
      </div>
      <div className="grid-2">
        <Field label="STOCK MÍNIMO">
          <input className="input" value={min} onChange={(e) => setMin(soloNumerico(e.target.value))} inputMode="decimal" />
        </Field>
        <Field label="PMP / PRECIO REF. (€)">
          <input className="input" value={pmp} onChange={(e) => setPmp(soloNumerico(e.target.value))} inputMode="decimal" />
        </Field>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#e09090' }}>Editar el PMP es una rectificación contable: úsalo solo para corregir errores de captura.</p>
    </Modal>
  )
}

/* ---------- Fila de movimiento (reutilizable) ---------- */
export function MovementRow({ movimiento, unit, onEdit }) {
  const qty = parseFloat(movimiento.cantidad || movimiento.qty || 0)
  const pos = qty > 0
  const tipo = movimiento.tipo_movimiento || movimiento.kind || ''
  return (
    <div className="mov">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
        <span className="mov__date">{fmtDate(movimiento.fecha || movimiento.date)}</span>
        <span className="mov__party">{movimiento.parte || movimiento.party || movimiento.motivo}</span>
        <span className="mov__ref">{movimiento.referencia || movimiento.ref}</span>
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {tipo && <span className={`mov__tag mov__tag--${tipo}`}>{tipo}</span>}
        <span className={`mov__qty ${pos ? 'mov__qty--pos' : 'mov__qty--neg'}`}>
          {signed(qty)} {unit}
        </span>
        {onEdit && (
          <button
            style={{ opacity: 0, border: '1px solid var(--line)', background: 'var(--surface)', width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)' }}
            className="mov__edit"
            title="Editar movimiento"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
          >
            <Icon name="pencil" size={13} />
          </button>
        )}
      </span>
    </div>
  )
}

/* ---------- Modal confirmación de desactivación ---------- */
export function EditMovimientoModal({ movimiento, unit, onClose, onSave }) {
  const isAjuste = movimiento.tipo === 'ajuste'
  const qty = parseFloat(movimiento.cantidad || 0)

  const [fecha, setFecha] = useState(movimiento.fecha || '')
  const [cantidad, setCantidad] = useState(String(Math.abs(qty)))
  const [signo, setSigno] = useState(qty >= 0 ? '+' : '-')
  const [precio, setPrecio] = useState(movimiento.precio_unitario ? fmtNum(parseFloat(movimiento.precio_unitario)) : '')
  const [notas, setNotas] = useState(movimiento.notas || '')
  const [motivo, setMotivo] = useState(movimiento.motivo || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const cantidadFinal = isAjuste
        ? (signo === '+' ? 1 : -1) * Math.abs(parse(cantidad))
        : Math.abs(parse(cantidad))
      await onSave({
        fecha,
        cantidad: cantidadFinal,
        precio_unitario: precio !== '' ? parse(precio) : null,
        notas,
        motivo,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      tone="amber"
      eyebrow={movimiento.tipo?.toUpperCase()}
      title="Editar movimiento"
      onClose={onClose}
      footer={
        <>
          <Btn kind="muted" onClick={onClose}>Cancelar</Btn>
          <Btn kind="brand" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Btn>
        </>
      }
    >
      <div className="grid-2">
        <Field label="FECHA">
          <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </Field>
        <Field label={`CANTIDAD (${unit})`}>
          <div style={{ display: 'flex', gap: 6 }}>
            {isAjuste && (
              <div className="select-wrap" style={{ width: 64, flexShrink: 0 }}>
                <select className="input" value={signo} onChange={e => setSigno(e.target.value)}>
                  <option value="+">+</option>
                  <option value="-">−</option>
                </select>
                <Icon name="chevron" size={14} />
              </div>
            )}
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={cantidad}
              onChange={e => setCantidad(soloNumerico(e.target.value))}
              inputMode="decimal"
              style={{ flex: 1 }}
            />
          </div>
        </Field>
      </div>
      {movimiento.tipo === 'entrada' && (
        <Field label="PRECIO UNITARIO (€)">
          <input className="input" value={precio} onChange={e => setPrecio(soloNumerico(e.target.value))} inputMode="decimal" placeholder="0,00" />
        </Field>
      )}
      <Field label={isAjuste ? 'MOTIVO' : 'NOTAS'}>
        <input
          className="input"
          value={isAjuste ? motivo : notas}
          onChange={e => isAjuste ? setMotivo(sanitizers.texto(e.target.value)) : setNotas(sanitizers.texto(e.target.value))}
          placeholder={isAjuste ? 'Motivo del ajuste…' : 'Observaciones…'}
        />
      </Field>
    </Modal>
  )
}

export function ConfirmEliminarMovimientoModal({ movimiento, unit, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false)
  const qty = parseFloat(movimiento.cantidad || 0)
  const pos = movimiento.tipo === 'entrada' || (movimiento.tipo === 'ajuste' && qty > 0)
  const qtyStr = `${pos ? '+' : '−'}${formatCantidad(Math.abs(qty))} ${unit}`

  const confirm = async () => {
    setSaving(true)
    try { await onConfirm() } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 430 }} role="alertdialog" aria-modal="true">
        <div style={{ padding: '32px 32px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 13 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-soft)', color: 'var(--danger)', display: 'grid', placeItems: 'center' }}>
            <Icon name="trash" size={26} />
          </div>
          <h3 style={{ margin: '2px 0 0', fontSize: 21, fontWeight: 800, letterSpacing: '-.01em' }}>¿Eliminar este movimiento?</h3>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.5 }}>
            Se eliminará el movimiento de <b style={{ color: 'var(--ink)' }}>{movimiento.tipo}</b>{' '}
            de <b style={{ color: 'var(--ink)' }}>{qtyStr}</b> del{' '}
            <b style={{ color: 'var(--ink)' }}>{movimiento.fecha}</b>.
            El stock se recalculará automáticamente.
          </p>
        </div>
        <div className="modal__foot" style={{ justifyContent: 'center' }}>
          <Btn kind="muted" onClick={onClose}>Cancelar</Btn>
          <Btn kind="danger" onClick={confirm} disabled={saving}>{saving ? 'Eliminando…' : 'Sí, eliminar'}</Btn>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDesactivarModal({ nombre, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false)
  const confirm = async () => {
    setSaving(true)
    try { await onConfirm() } finally { setSaving(false) }
  }
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 430 }} role="alertdialog" aria-modal="true">
        <div style={{ padding: '32px 32px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 13 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-soft)', color: 'var(--danger)', display: 'grid', placeItems: 'center' }}>
            <Icon name="warn" size={26} />
          </div>
          <h3 style={{ margin: '2px 0 0', fontSize: 21, fontWeight: 800, letterSpacing: '-.01em' }}>¿Desactivar este artículo?</h3>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.5 }}>
            El artículo <b style={{ color: 'var(--ink)' }}>{nombre}</b> quedará desactivado. Los datos y movimientos se conservan.
          </p>
        </div>
        <div className="modal__foot" style={{ justifyContent: 'center' }}>
          <Btn kind="muted" onClick={onClose}>Cancelar</Btn>
          <Btn kind="danger" onClick={confirm} disabled={saving}>{saving ? 'Desactivando…' : 'Sí, desactivar'}</Btn>
        </div>
      </div>
    </div>
  )
}
