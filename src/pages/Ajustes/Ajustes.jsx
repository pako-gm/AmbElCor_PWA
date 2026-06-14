import { useEffect, useState } from 'react'
import {
  Tags, Ruler, TrendingUp, UserCog, Plus, Trash2, Pencil,
  Shirt, Layers, Gem, Scissors, Circle, Box, Boxes, Heart,
  Mail, ShieldCheck, ShieldAlert, ReceiptText,
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
import { useConfiguracion } from '@/hooks/useConfiguracion'
import { useDatosFiscales } from '@/hooks/useDatosFiscales'
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
  { id: 'incremento',  label: 'Incremento de precios', icon: TrendingUp },
  { id: 'facturacion', label: 'Datos de facturación', icon: ReceiptText },
  { id: 'usuarios',    label: 'Usuarios CRM',        icon: UserCog },
]

// ── Sección: Categorías ───────────────────────────────────────────────────────
function SeccionCategorias({ categorias, loading, onAdd, onDelete }) {
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('box')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aBorrar, setABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)

  const handleAdd = async () => {
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    setError('')
    setGuardando(true)
    try {
      await onAdd({ nombre: nombre.trim(), icono })
      setNombre('')
      setIcono('box')
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
        <p className="text-xs text-[--text-light]">Categorías de materiales del inventario.</p>
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
                </div>
                <button
                  onClick={() => setABorrar(cat)}
                  aria-label={`Eliminar categoría ${cat.nombre}`}
                  className="p-1.5 rounded-md text-[--text-light] hover:text-danger hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-[--border] pt-4 space-y-2">
        <p className="text-[11px] font-bold tracking-wider text-[--text-light]">NUEVA CATEGORÍA</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Nombre" className="flex-1 min-w-[140px]">
            <Input
              placeholder="Nombre…"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
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

// ── Sección: Unidades ─────────────────────────────────────────────────────────
function SeccionUnidades({ unidades, loading, onAdd, onDelete }) {
  const [clave, setClave] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aBorrar, setABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)

  const handleAdd = async () => {
    if (!clave.trim() || !etiqueta.trim() || !abreviatura.trim()) return setError('Todos los campos son obligatorios.')
    if (!/^[a-z_]+$/.test(clave.trim())) return setError('La clave solo puede tener letras minúsculas y guiones bajos.')
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
          <Field label="Clave" className="flex-1 min-w-[120px]">
            <Input
              placeholder="ej: gramo"
              value={clave}
              onChange={e => setClave(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
            />
          </Field>
          <Field label="Etiqueta" className="flex-1 min-w-[130px]">
            <Input placeholder="ej: Gramo" value={etiqueta} onChange={e => setEtiqueta(e.target.value)} />
          </Field>
          <Field label="Abrev." className="w-24">
            <Input placeholder="ej: g" value={abreviatura} onChange={e => setAbreviatura(e.target.value)} />
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
                value={pct}
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
              <Input value={form.nombre} onChange={set('nombre')} placeholder="Nombre y apellidos" />
            </Field>
            <Field label="DNI / NIF">
              <Input value={form.nif} onChange={set('nif')} placeholder="00000000X" />
            </Field>
            <Field label="Teléfono">
              <Input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="600000000" />
            </Field>
            <Field label="Dirección" className="sm:col-span-2">
              <Textarea value={form.direccion} onChange={set('direccion')} placeholder="Calle, nº - CP Localidad, Provincia" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="correo@ejemplo.com" />
            </Field>
            <Field label="IBAN">
              <Input value={form.iban} onChange={set('iban')} placeholder="ES00 0000 0000 0000 0000 0000" />
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
    fetchCategorias, crearCategoria, eliminarCategoria,
    fetchUnidades, crearUnidad, eliminarUnidad,
  } = useInventario()
  const { fetchConfig, guardarConfig, aplicarIncrementoCatalogo } = useConfiguracion()
  const { fetchDatosFiscales, guardarDatosFiscales } = useDatosFiscales()

  const [seccion, setSeccion] = useState('categorias')
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])
  const [incremento, setIncremento] = useState(null)
  const [datosFiscales, setDatosFiscales] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargarCategorias = () => fetchCategorias().then(setCategorias)
  const cargarUnidades = () => fetchUnidades().then(setUnidades)
  const cargarConfig = () => fetchConfig().then(c => setIncremento(Number(c.incremento_precios_anual) || 0))
  const cargarFiscales = () => fetchDatosFiscales().then(setDatosFiscales)

  useEffect(() => {
    Promise.all([cargarCategorias(), cargarUnidades(), cargarConfig(), cargarFiscales()])
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
            {seccion === 'usuarios' && <SeccionUsuarios />}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
