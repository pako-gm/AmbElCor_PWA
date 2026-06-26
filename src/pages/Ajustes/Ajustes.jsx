import { useEffect, useState } from 'react'
import {
  Tags, Ruler, TrendingUp, UserCog, Plus, Trash2, Pencil,
  Shirt, Layers, Gem, Scissors, Circle, Box, Boxes, Heart,
  Mail, ShieldCheck, ShieldAlert, ReceiptText, Bell, Coins,
} from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import LoadingState from '@/components/ui/LoadingState'
import { useToast } from '@/hooks/useToast'
import { useInventario } from '@/hooks/useInventario'
import { useContabilidad } from '@/hooks/useContabilidad'
import { useConfiguracion } from '@/hooks/useConfiguracion'
import { TIPOS_NOTIFICACION, CONFIG_KEY_NOTIFICACIONES, parsePreferencias } from '@/lib/notificaciones'
import { useDatosFiscales } from '@/hooks/useDatosFiscales'
import { sanitizers } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { USUARIOS } from '@/lib/usuarios'
import { UsuarioForm } from '@/pages/Acceso/panels'

// ── Iconos de categoría ───────────────────────────────────────────────────────
const ICON_MAP = {
  shirt: Shirt, layers: Layers, gem: Gem, scissors: Scissors,
  circle: Circle, box: Box, cubes: Boxes, heart: Heart,
}
const ICONOS_DISPONIBLES = [
  { value: 'shirt',    label: 'Camiseta (telas)' },
  { value: 'layers',   label: 'Capas (pasamanería)' },
  { value: 'gem',      label: 'Gema (joyería)' },
  { value: 'scissors', label: 'Tijeras (mercería)' },
  { value: 'circle',   label: 'Círculo (botones)' },
  { value: 'box',      label: 'Caja (genérico)' },
  { value: 'cubes',    label: 'Cubos' },
  { value: 'heart',    label: 'Corazón' },
]

const SECCIONES = [
  { id: 'categorias',  label: 'Categorías',          icon: Tags },
  { id: 'unidades',    label: 'Unidades de gestión', icon: Ruler },
  { id: 'categorias_gasto', label: 'Categorías de gasto', icon: Coins },
  { id: 'incremento',  label: 'Incremento de precios', icon: TrendingUp },
  { id: 'facturacion', label: 'Datos de facturación', icon: ReceiptText },
  { id: 'notificaciones', label: 'Notificaciones',   icon: Bell },
  { id: 'usuarios',    label: 'Usuarios CRM',        icon: UserCog },
]

// Genera una clave snake_case a partir de la etiqueta: sin acentos, minúsculas,
// caracteres no alfanuméricos → guion bajo.
const slugClave = (texto) =>
  texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

// Prefijo por defecto: 3 primeras letras del nombre (solo letras), en mayúscula
const prefijoPorDefecto = (nombre) =>
  nombre.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ]/g, '').slice(0, 3).toUpperCase()

const normalizarPrefijo = (v) =>
  v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ/]/g, '').slice(0, 3).toUpperCase()

// ── Sección: Categorías ───────────────────────────────────────────────────────
function SeccionCategorias({ categorias, loading, onAdd, onEdit, onDelete }) {
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('box')
  const [prefijo, setPrefijo] = useState('')
  const [prefijoTocado, setPrefijoTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errNombre, setErrNombre] = useState('')
  const [aBorrar, setABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)
  const [aEditar, setAEditar] = useState(null)

  const handleNombre = (e) => {
    const v = e.target.value
    setNombre(v)
    if (errNombre) setErrNombre('')
    if (!prefijoTocado) setPrefijo(prefijoPorDefecto(v))
  }

  const handleAdd = async () => {
    if (!nombre.trim()) return setErrNombre('El nombre es obligatorio.')
    setErrNombre('')
    setError('')
    setGuardando(true)
    try {
      await onAdd({ nombre: nombre.trim(), icono, prefijo })
      setNombre('')
      setIcono('box')
      setPrefijo('')
      setPrefijoTocado(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async () => {
    setBorrando(true)
    try {
      await onDelete(aBorrar.id)
      setABorrar(null)
    } finally {
      setBorrando(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-[--text-dark]">Categorías</h2>
        <p className="text-xs text-[--text-light]">Categorías de materiales del inventario. El prefijo se usa para autogenerar el código de cada material (ej. TEL-001).</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : categorias.length === 0 ? (
        <EmptyState icon={Tags} titulo="Sin categorías" descripcion="Añade la primera abajo." />
      ) : (
        <ul className="space-y-2">
          {categorias.map(cat => {
            const IconCat = ICON_MAP[cat.icono] || Box
            return (
              <li
                key={cat.id}
                className="flex items-center justify-between px-3 py-2 bg-[--bg-gray] rounded-lg border border-[--border]"
              >
                <div className="flex items-center gap-2.5">
                  <IconCat size={16} className="text-[--text-light]" />
                  <span className="text-sm font-medium text-[--text-dark]">{cat.nombre}</span>
                  {cat.prefijo && (
                    <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-white border border-[--border] text-[--text-light]">{cat.prefijo}</code>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAEditar(cat)}
                    aria-label={`Editar categoría ${cat.nombre}`}
                    className="p-1.5 rounded-md text-[--text-light] hover:text-primary hover:bg-primary-light/50 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setABorrar(cat)}
                    aria-label={`Eliminar categoría ${cat.nombre}`}
                    className="p-1.5 rounded-md text-[--text-light] hover:text-danger hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-[--border] pt-4 space-y-2">
        <p className="text-[11px] font-bold tracking-wider text-[--text-light]">NUEVA CATEGORÍA</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Nombre" className="flex-1 min-w-[140px]" error={errNombre}>
            <Input
              placeholder="Nombre…"
              value={nombre}
              sanitize={sanitizers.texto}
              onChange={handleNombre}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </Field>
          <Field label="Prefijo" className="w-24">
            <Input
              placeholder="TEL"
              value={prefijo}
              onChange={e => { setPrefijoTocado(true); setPrefijo(normalizarPrefijo(e.target.value)) }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </Field>
          <Field label="Icono" className="min-w-[180px]">
            <Select value={icono} onChange={e => setIcono(e.target.value)}>
              {ICONOS_DISPONIBLES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </Select>
          </Field>
          <Button onClick={handleAdd} loading={guardando}>
            <Plus size={15} /> Añadir
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <EditarCategoriaModal
        categoria={aEditar}
        onClose={() => setAEditar(null)}
        onGuardar={onEdit}
      />

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar categoría"
        description={aBorrar ? `¿Eliminar la categoría «${aBorrar.nombre}»?` : ''}
        loading={borrando}
        onConfirm={handleDelete}
        onCancel={() => setABorrar(null)}
      />
    </section>
  )
}

// ── Modal: Editar categoría ───────────────────────────────────────────────────
function EditarCategoriaModal({ categoria, onClose, onGuardar }) {
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('box')
  const [prefijo, setPrefijo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errNombre, setErrNombre] = useState('')

  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || '')
      setIcono(categoria.icono || 'box')
      setPrefijo(categoria.prefijo || '')
      setError('')
      setErrNombre('')
    }
  }, [categoria])

  const handleGuardar = async () => {
    if (!nombre.trim()) return setErrNombre('El nombre es obligatorio.')
    setErrNombre('')
    setError('')
    setGuardando(true)
    try {
      await onGuardar(categoria.id, { nombre: nombre.trim(), icono, prefijo })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open={!!categoria} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 pt-2">
        <h3 className="font-display text-lg text-[--text-dark]">Editar categoría</h3>
        <div className="space-y-3">
          <Field label="Nombre" error={errNombre}>
            <Input value={nombre} sanitize={sanitizers.texto} onChange={e => { setNombre(e.target.value); if (errNombre) setErrNombre('') }} placeholder="Nombre…" />
          </Field>
          <Field label="Prefijo (código)">
            <Input value={prefijo} onChange={e => setPrefijo(normalizarPrefijo(e.target.value))} placeholder="TEL" />
          </Field>
          <Field label="Icono">
            <Select value={icono} onChange={e => setIcono(e.target.value)}>
              {ICONOS_DISPONIBLES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </Select>
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-[--border] pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleGuardar} loading={guardando}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Sección: Categorías de gasto ──────────────────────────────────────────────
const COLOR_DEFECTO = '#9CA3AF'

function SeccionCategoriasGasto({ categorias, loading, onAdd, onEdit, onDelete }) {
  const [etiqueta, setEtiqueta] = useState('')
  const [clave, setClave] = useState('')
  const [claveTocada, setClaveTocada] = useState(false)
  const [color, setColor] = useState(COLOR_DEFECTO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errs, setErrs] = useState({})
  const [aBorrar, setABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)
  const [aEditar, setAEditar] = useState(null)

  const handleEtiqueta = (e) => {
    const v = e.target.value
    setEtiqueta(v)
    if (errs.etiqueta) setErrs(p => ({ ...p, etiqueta: undefined }))
    if (!claveTocada) setClave(slugClave(v))
  }

  const handleAdd = async () => {
    const nuevosErrs = {}
    if (!etiqueta.trim()) nuevosErrs.etiqueta = 'Obligatorio.'
    if (!clave.trim()) nuevosErrs.clave = 'Obligatorio.'
    else if (!/^[a-z0-9_]+$/.test(clave.trim())) nuevosErrs.clave = 'Solo minúsculas, números y guiones bajos.'
    if (Object.keys(nuevosErrs).length > 0) { setErrs(nuevosErrs); return }
    setErrs({})
    setError('')
    setGuardando(true)
    try {
      await onAdd({ clave: clave.trim(), etiqueta: etiqueta.trim(), color })
      setEtiqueta(''); setClave(''); setClaveTocada(false); setColor(COLOR_DEFECTO)
    } catch (e) {
      setError(e.message?.includes('unique') || e.message?.includes('duplicate')
        ? 'Ya existe una categoría con esa clave.' : e.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async () => {
    setBorrando(true)
    try {
      await onDelete(aBorrar.id)
      setABorrar(null)
    } finally {
      setBorrando(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-[--text-dark]">Categorías de gasto</h2>
        <p className="text-xs text-[--text-light]">Categorías de los pagos a proveedores. El color se usa en el gráfico del Dashboard de Contabilidad.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : categorias.length === 0 ? (
        <EmptyState icon={Coins} titulo="Sin categorías" descripcion="Añade la primera abajo." />
      ) : (
        <ul className="space-y-2">
          {categorias.map(cat => (
            <li
              key={cat.id}
              className="flex items-center justify-between px-3 py-2 bg-[--bg-gray] rounded-lg border border-[--border]"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border border-[--border] flex-shrink-0" style={{ background: cat.color || COLOR_DEFECTO }} />
                <span className="text-sm font-medium text-[--text-dark]">{cat.etiqueta}</span>
                <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-white border border-[--border] text-[--text-light]">{cat.clave}</code>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAEditar(cat)}
                  aria-label={`Editar categoría ${cat.etiqueta}`}
                  className="p-1.5 rounded-md text-[--text-light] hover:text-primary hover:bg-primary-light/50 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setABorrar(cat)}
                  aria-label={`Eliminar categoría ${cat.etiqueta}`}
                  className="p-1.5 rounded-md text-[--text-light] hover:text-danger hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-[--border] pt-4 space-y-2">
        <p className="text-[11px] font-bold tracking-wider text-[--text-light]">NUEVA CATEGORÍA</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Etiqueta" className="flex-1 min-w-[150px]" error={errs.etiqueta}>
            <Input
              placeholder="ej: Formación"
              value={etiqueta}
              sanitize={sanitizers.texto}
              onChange={handleEtiqueta}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </Field>
          <Field label="Clave" className="w-40" error={errs.clave}>
            <Input
              placeholder="ej: formacion"
              value={clave}
              onChange={e => { setClaveTocada(true); setClave(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); if (errs.clave) setErrs(p => ({ ...p, clave: undefined })) }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </Field>
          <Field label="Color" className="w-20">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-[38px] w-full rounded-md border border-[--border] bg-white p-1 cursor-pointer"
            />
          </Field>
          <Button onClick={handleAdd} loading={guardando}>
            <Plus size={15} /> Añadir
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <EditarCategoriaGastoModal
        categoria={aEditar}
        onClose={() => setAEditar(null)}
        onGuardar={onEdit}
      />

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar categoría"
        description={aBorrar ? `¿Eliminar la categoría «${aBorrar.etiqueta}»? Los gastos ya registrados con ella conservarán su valor.` : ''}
        loading={borrando}
        onConfirm={handleDelete}
        onCancel={() => setABorrar(null)}
      />
    </section>
  )
}

// ── Modal: Editar categoría de gasto ──────────────────────────────────────────
function EditarCategoriaGastoModal({ categoria, onClose, onGuardar }) {
  const [etiqueta, setEtiqueta] = useState('')
  const [color, setColor] = useState(COLOR_DEFECTO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errEtiqueta, setErrEtiqueta] = useState('')

  useEffect(() => {
    if (categoria) {
      setEtiqueta(categoria.etiqueta || '')
      setColor(categoria.color || COLOR_DEFECTO)
      setError('')
      setErrEtiqueta('')
    }
  }, [categoria])

  const handleGuardar = async () => {
    if (!etiqueta.trim()) return setErrEtiqueta('La etiqueta es obligatoria.')
    setErrEtiqueta('')
    setError('')
    setGuardando(true)
    try {
      await onGuardar(categoria.id, { etiqueta: etiqueta.trim(), color })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open={!!categoria} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 pt-2">
        <h3 className="font-display text-lg text-[--text-dark]">Editar categoría</h3>
        <div className="space-y-3">
          <Field label="Etiqueta" error={errEtiqueta}>
            <Input value={etiqueta} sanitize={sanitizers.texto} onChange={e => { setEtiqueta(e.target.value); if (errEtiqueta) setErrEtiqueta('') }} placeholder="Etiqueta…" />
          </Field>
          <Field label="Clave (no editable)">
            <code className="block text-xs font-mono px-3 py-2 rounded bg-[--bg-gray] border border-[--border] text-[--text-light]">{categoria?.clave}</code>
          </Field>
          <Field label="Color">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-[38px] w-20 rounded-md border border-[--border] bg-white p-1 cursor-pointer"
            />
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-[--border] pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleGuardar} loading={guardando}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Sección: Unidades ─────────────────────────────────────────────────────────
function SeccionUnidades({ unidades, loading, onAdd, onDelete }) {
  const [clave, setClave] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errs, setErrs] = useState({})
  const [aBorrar, setABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)

  const limpiar = (k) => { if (errs[k]) setErrs(prev => ({ ...prev, [k]: undefined })) }

  const handleAdd = async () => {
    const nuevosErrs = {}
    if (!clave.trim()) nuevosErrs.clave = 'Obligatorio.'
    else if (!/^[a-z_]+$/.test(clave.trim())) nuevosErrs.clave = 'Solo minúsculas y guiones bajos.'
    if (!etiqueta.trim()) nuevosErrs.etiqueta = 'Obligatorio.'
    if (!abreviatura.trim()) nuevosErrs.abreviatura = 'Obligatorio.'
    if (Object.keys(nuevosErrs).length > 0) { setErrs(nuevosErrs); return }
    setErrs({})
    setError('')
    setGuardando(true)
    try {
      await onAdd({ clave: clave.trim(), etiqueta: etiqueta.trim(), abreviatura: abreviatura.trim() })
      setClave(''); setEtiqueta(''); setAbreviatura('')
    } catch (e) {
      setError(e.message.includes('unique') ? 'Ya existe una unidad con esa clave.' : e.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async () => {
    setBorrando(true)
    try {
      await onDelete(aBorrar.id)
      setABorrar(null)
    } finally {
      setBorrando(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-[--text-dark]">Unidades de gestión</h2>
        <p className="text-xs text-[--text-light]">Unidades de medida para el inventario.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : unidades.length === 0 ? (
        <EmptyState icon={Ruler} titulo="Sin unidades" descripcion="Añade la primera abajo." />
      ) : (
        <ul className="space-y-2">
          {unidades.map(u => (
            <li
              key={u.id}
              className="flex items-center justify-between px-3 py-2 bg-[--bg-gray] rounded-lg border border-[--border]"
            >
              <div className="flex items-center gap-3">
                <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-white border border-[--border] text-[--text-light]">{u.clave}</code>
                <span className="text-sm font-medium text-[--text-dark]">{u.etiqueta}</span>
                <span className="text-xs text-[--text-light]">({u.abreviatura})</span>
              </div>
              <button
                onClick={() => setABorrar(u)}
                aria-label={`Eliminar unidad ${u.etiqueta}`}
                className="p-1.5 rounded-md text-[--text-light] hover:text-danger hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-[--border] pt-4 space-y-2">
        <p className="text-[11px] font-bold tracking-wider text-[--text-light]">NUEVA UNIDAD</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Clave" className="flex-1 min-w-[120px]" error={errs.clave}>
            <Input
              placeholder="ej: gramo"
              value={clave}
              onChange={e => { setClave(e.target.value.toLowerCase().replace(/[^a-z_]/g, '')); limpiar('clave') }}
            />
          </Field>
          <Field label="Etiqueta" className="flex-1 min-w-[130px]" error={errs.etiqueta}>
            <Input placeholder="ej: Gramo" value={etiqueta} sanitize={sanitizers.texto} onChange={e => { setEtiqueta(e.target.value); limpiar('etiqueta') }} />
          </Field>
          <Field label="Abrev." className="w-24" error={errs.abreviatura}>
            <Input placeholder="ej: g" value={abreviatura} sanitize={sanitizers.texto} onChange={e => { setAbreviatura(e.target.value); limpiar('abreviatura') }} />
          </Field>
          <Button onClick={handleAdd} loading={guardando}>
            <Plus size={15} /> Añadir
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar unidad"
        description={aBorrar ? `¿Eliminar la unidad «${aBorrar.etiqueta}»?` : ''}
        loading={borrando}
        onConfirm={handleDelete}
        onCancel={() => setABorrar(null)}
      />
    </section>
  )
}

// ── Sección: Incremento de precios ────────────────────────────────────────────
function SeccionIncremento({ valorActual, loading, onGuardar, onAplicar }) {
  const [pct, setPct] = useState('0')
  const [guardando, setGuardando] = useState(false)
  const [confirmAplicar, setConfirmAplicar] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (valorActual != null) setPct(String(valorActual))
  }, [valorActual])

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await onGuardar(pct)
      toast.success('Porcentaje guardado.')
    } catch (e) {
      toast.error('No se pudo guardar: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleAplicar = async () => {
    setAplicando(true)
    try {
      const n = await onAplicar(pct)
      setConfirmAplicar(false)
      toast.success(`Incremento aplicado a ${n} ${n === 1 ? 'prenda' : 'prendas'} del catálogo.`)
    } catch (e) {
      toast.error('No se pudo aplicar: ' + e.message)
    } finally {
      setAplicando(false)
    }
  }

  const pctNum = Number(pct) || 0

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-[--text-dark]">Incremento de precios anual</h2>
        <p className="text-xs text-[--text-light]">
          Porcentaje de subida anual aplicable al precio base del catálogo.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Porcentaje (%)" className="w-40">
              <Input
                type="number"
                step="0.1"
                min="0"
                inputMode="decimal"
                value={pct}
                sanitize={sanitizers.decimal}
                onChange={e => setPct(e.target.value)}
              />
            </Field>
            <Button variant="secondary" onClick={handleGuardar} loading={guardando}>
              Guardar
            </Button>
          </div>

          <div className="border-t border-[--border] pt-4 space-y-2">
            <p className="text-sm text-[--text-medium]">
              Aplicar el incremento sube el <strong>precio base de todas las prendas</strong> del
              catálogo un {pctNum}%. Esta acción modifica los precios guardados.
            </p>
            <p className="text-sm font-medium text-red-400 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              ¡Ojo! Aplica la subida de precios solo una vez al año, el valor es acumulativo.
            </p>
            <Button
              variant="primary"
              onClick={() => setConfirmAplicar(true)}
              disabled={pctNum <= 0}
            >
              <TrendingUp size={15} /> Aplicar al catálogo
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmAplicar}
        tone="primary"
        title="Aplicar incremento"
        description={`Se subirá el precio base de todas las prendas del catálogo un ${pctNum}%. ¿Continuar?`}
        confirmLabel="Aplicar"
        loading={aplicando}
        onConfirm={handleAplicar}
        onCancel={() => setConfirmAplicar(false)}
      />
    </section>
  )
}

// ── Sección: Datos de facturación ─────────────────────────────────────────────
const CAMPOS_FISCALES = ['nombre', 'nif', 'direccion', 'telefono', 'email', 'iban']

function SeccionDatosFacturacion({ datos, loading, onGuardar }) {
  const [form, setForm] = useState({
    nombre: '', nif: '', direccion: '', telefono: '', email: '', iban: '',
  })
  const [guardando, setGuardando] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (datos) {
      setForm(f => ({
        ...f,
        ...Object.fromEntries(CAMPOS_FISCALES.map(k => [k, datos[k] ?? ''])),
      }))
    }
  }, [datos])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await onGuardar({ ...datos, ...form })
      toast.success('Datos de facturación guardados.')
    } catch (e) {
      toast.error('No se pudo guardar: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-[--text-dark]">Datos de facturación</h2>
        <p className="text-xs text-[--text-light]">
          Datos fiscales del emisor que aparecen en presupuestos y facturas.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre" className="sm:col-span-2">
              <Input value={form.nombre} sanitize={sanitizers.texto} onChange={set('nombre')} placeholder="Nombre y apellidos" />
            </Field>
            <Field label="DNI / NIF">
              <Input value={form.nif} sanitize={sanitizers.nif} onChange={set('nif')} placeholder="00000000X" />
            </Field>
            <Field label="Teléfono">
              <Input type="tel" inputMode="numeric" value={form.telefono} sanitize={sanitizers.telefono} onChange={set('telefono')} placeholder="600000000" />
            </Field>
            <Field label="Dirección" className="sm:col-span-2">
              <Textarea value={form.direccion} sanitize={sanitizers.texto} onChange={set('direccion')} placeholder="Calle, nº - CP Localidad, Provincia" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} sanitize={sanitizers.email} onChange={set('email')} placeholder="correo@ejemplo.com" />
            </Field>
            <Field label="IBAN">
              <Input value={form.iban} sanitize={sanitizers.texto} onChange={set('iban')} placeholder="ES00 0000 0000 0000 0000 0000" />
            </Field>
          </div>

          <div className="border-t border-[--border] pt-4">
            <Button onClick={handleGuardar} loading={guardando}>
              Guardar
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

// ── Sección: Notificaciones ───────────────────────────────────────────────────
function Toggle({ activo, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      onClick={() => onChange(!activo)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${activo ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activo ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function SeccionNotificaciones({ prefs, loading, onGuardar }) {
  const [local, setLocal] = useState(prefs)
  const [guardando, setGuardando] = useState(false)
  const toast = useToast()

  useEffect(() => { setLocal(prefs) }, [prefs])

  const toggle = async (clave, valor) => {
    const next = { ...local, [clave]: valor }
    setLocal(next)
    setGuardando(true)
    try {
      await onGuardar(next)
    } catch (e) {
      setLocal(local) // revertir
      toast.error('No se pudo guardar: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-[--text-dark]">Notificaciones</h2>
        <p className="text-xs text-[--text-light]">
          Activa o desactiva los avisos que aparecen en la campana de la cabecera.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <ul className="space-y-2">
          {TIPOS_NOTIFICACION.map(t => (
            <li
              key={t.clave}
              className="flex items-center justify-between gap-4 px-3 py-2.5 bg-[--bg-gray] rounded-lg border border-[--border]"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-[--text-dark]">{t.label}</span>
                <p className="text-xs text-[--text-light]">{t.descripcion}</p>
              </div>
              <Toggle
                activo={local[t.clave] !== false}
                onChange={(v) => !guardando && toggle(t.clave, v)}
                label={`Activar avisos de ${t.label}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── Sección: Usuarios CRM ─────────────────────────────────────────────────────
function SeccionUsuarios() {
  const { user, mfaVerified } = useAuth()
  const toast = useToast()
  // modal = null | { modo: 'nuevo' } | { modo: 'editar', inicial: usuario }
  const [modal, setModal] = useState(null)

  const cerrar = () => setModal(null)

  return (
    <section className="bg-white rounded-lg border border-[--border] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-[--text-dark]">Usuarios CRM</h2>
          <p className="text-xs text-[--text-light]">Personas con acceso al CRM y sus roles.</p>
        </div>
        <Button onClick={() => setModal({ modo: 'nuevo' })}>
          <Plus size={15} /> Nuevo usuario
        </Button>
      </div>

      <div className="px-3 py-3 bg-[--bg-gray] rounded-lg border border-[--border] space-y-2">
        <div className="flex items-center gap-2.5 text-sm text-[--text-dark]">
          <Mail size={16} className="text-[--text-light]" />
          {user?.email || '—'}
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          {mfaVerified ? (
            <>
              <ShieldCheck size={16} className="text-primary" />
              <span className="text-[--text-dark]">Verificación en dos pasos activa</span>
            </>
          ) : (
            <>
              <ShieldAlert size={16} className="text-amber-500" />
              <a href="/setup-2fa" className="text-primary hover:underline">Configurar verificación en dos pasos</a>
            </>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {USUARIOS.map(u => (
          <li
            key={u.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[--bg-gray] rounded-lg border border-[--border]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[--text-dark]">{u.nombre}</span>
                <span className="text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-primary-light text-primary-darker">{u.rol}</span>
              </div>
              <div className="text-xs text-[--text-light] truncate">{u.email}</div>
            </div>
            <button
              onClick={() => setModal({ modo: 'editar', inicial: u })}
              aria-label={`Editar usuario ${u.nombre}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-[--text-medium] hover:text-primary hover:bg-primary-light/50 transition-colors flex-shrink-0"
            >
              <Pencil size={14} /> Editar
            </button>
          </li>
        ))}
      </ul>

      <Modal open={!!modal} onClose={cerrar} maxWidth="max-w-xl">
        {modal && (
          <div className="pt-2">
            <UsuarioForm
              modo={modal.modo}
              inicial={modal.inicial}
              compact
              onClose={cerrar}
              onSubmit={() => { toast.success('Datos actualizados.'); cerrar() }}
            />
          </div>
        )}
      </Modal>
    </section>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function Ajustes() {
  const {
    fetchCategorias, crearCategoria, actualizarCategoria, eliminarCategoria,
    fetchUnidades, crearUnidad, eliminarUnidad,
  } = useInventario()
  const {
    fetchCategoriasGasto, crearCategoriaGasto, actualizarCategoriaGasto, eliminarCategoriaGasto,
  } = useContabilidad()
  const { fetchConfig, guardarConfig, aplicarIncrementoCatalogo } = useConfiguracion()
  const { fetchDatosFiscales, guardarDatosFiscales } = useDatosFiscales()

  const [seccion, setSeccion] = useState('categorias')
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])
  const [categoriasGasto, setCategoriasGasto] = useState([])
  const [incremento, setIncremento] = useState(null)
  const [notifPrefs, setNotifPrefs] = useState(() => parsePreferencias(null))
  const [datosFiscales, setDatosFiscales] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargarCategorias = () => fetchCategorias().then(setCategorias)
  const cargarUnidades = () => fetchUnidades().then(setUnidades)
  const cargarCategoriasGasto = () => fetchCategoriasGasto().then(setCategoriasGasto)
  const cargarConfig = () => fetchConfig().then(c => {
    setIncremento(Number(c.incremento_precios_anual) || 0)
    setNotifPrefs(parsePreferencias(c[CONFIG_KEY_NOTIFICACIONES]))
  })
  const cargarFiscales = () => fetchDatosFiscales().then(setDatosFiscales)

  useEffect(() => {
    Promise.all([cargarCategorias(), cargarUnidades(), cargarCategoriasGasto(), cargarConfig(), cargarFiscales()])
      .finally(() => setCargando(false))
  }, [])

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <PageHeader titulo="Ajustes" backTo="/encargos" />

        <div className="flex flex-col md:flex-row gap-5">
          {/* Nav de secciones */}
          <nav className="md:w-56 flex-shrink-0">
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              {SECCIONES.map(({ id, label, icon: Icon }) => {
                const activo = seccion === id
                return (
                  <li key={id} className="flex-shrink-0">
                    <button
                      onClick={() => setSeccion(id)}
                      className={`flex items-center gap-2.5 w-full whitespace-nowrap px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        activo
                          ? 'bg-primary-light text-primary-darker font-medium'
                          : 'text-[--text-medium] hover:bg-[--bg-gray]'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Panel de contenido */}
          <div className="flex-1 min-w-0">
            {seccion === 'categorias' && (
              <SeccionCategorias
                categorias={categorias}
                loading={cargando}
                onAdd={async (datos) => { await crearCategoria(datos); await cargarCategorias() }}
                onEdit={async (id, datos) => { await actualizarCategoria(id, datos); await cargarCategorias() }}
                onDelete={async (id) => { await eliminarCategoria(id); await cargarCategorias() }}
              />
            )}
            {seccion === 'unidades' && (
              <SeccionUnidades
                unidades={unidades}
                loading={cargando}
                onAdd={async (datos) => { await crearUnidad(datos); await cargarUnidades() }}
                onDelete={async (id) => { await eliminarUnidad(id); await cargarUnidades() }}
              />
            )}
            {seccion === 'categorias_gasto' && (
              <SeccionCategoriasGasto
                categorias={categoriasGasto}
                loading={cargando}
                onAdd={async (datos) => { await crearCategoriaGasto(datos); await cargarCategoriasGasto() }}
                onEdit={async (id, datos) => { await actualizarCategoriaGasto(id, datos); await cargarCategoriasGasto() }}
                onDelete={async (id) => { await eliminarCategoriaGasto(id); await cargarCategoriasGasto() }}
              />
            )}
            {seccion === 'incremento' && (
              <SeccionIncremento
                valorActual={incremento}
                loading={cargando}
                onGuardar={async (pct) => { await guardarConfig('incremento_precios_anual', pct); await cargarConfig() }}
                onAplicar={(pct) => aplicarIncrementoCatalogo(pct)}
              />
            )}
            {seccion === 'facturacion' && (
              <SeccionDatosFacturacion
                datos={datosFiscales}
                loading={cargando}
                onGuardar={async (d) => { await guardarDatosFiscales(d); await cargarFiscales() }}
              />
            )}
            {seccion === 'notificaciones' && (
              <SeccionNotificaciones
                prefs={notifPrefs}
                loading={cargando}
                onGuardar={async (next) => {
                  await guardarConfig(CONFIG_KEY_NOTIFICACIONES, JSON.stringify(next))
                  setNotifPrefs(next)
                }}
              />
            )}
            {seccion === 'usuarios' && <SeccionUsuarios />}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
