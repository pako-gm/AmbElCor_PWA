import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { Icon, Btn } from '@/components/inventario/InventarioUI'
import { useInventario } from '@/hooks/useInventario'

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

function SeccionCategorias({ categorias, onAdd, onDelete }) {
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('box')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <section className="card-form">
      <h2 style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 600, margin: '0 0 16px', color: 'var(--ink)' }}>
        Categorías
      </h2>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categorias.map(cat => (
          <li key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={cat.icono || 'box'} size={16} style={{ color: 'var(--muted)' }} />
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{cat.nombre}</span>
            </div>
            <button
              onClick={() => onDelete(cat.id)}
              title="Eliminar categoría"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="trash" size={15} />
            </button>
          </li>
        ))}
        {categorias.length === 0 && (
          <li style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Sin categorías.</li>
        )}
      </ul>

      <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 8 }}>NUEVA CATEGORÍA</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Nombre…"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1, minWidth: 140 }}
          />
          <div className="select-wrap" style={{ minWidth: 180 }}>
            <select className="input" value={icono} onChange={e => setIcono(e.target.value)}>
              {ICONOS_DISPONIBLES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
            <Icon name="chevron" size={14} />
          </div>
          <Btn kind="brand" icon="plus" onClick={handleAdd} disabled={guardando}>
            {guardando ? 'Añadiendo…' : 'Añadir'}
          </Btn>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{error}</p>}
      </div>
    </section>
  )
}

function SeccionUnidades({ unidades, onAdd, onDelete }) {
  const [clave, setClave] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <section className="card-form">
      <h2 style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 600, margin: '0 0 16px', color: 'var(--ink)' }}>
        Unidades de gestión
      </h2>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {unidades.map(u => (
          <li key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ fontSize: 12, background: 'var(--line-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', fontFamily: 'monospace' }}>{u.clave}</code>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{u.etiqueta}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>({u.abreviatura})</span>
            </div>
            <button
              onClick={() => onDelete(u.id)}
              title="Eliminar unidad"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="trash" size={15} />
            </button>
          </li>
        ))}
        {unidades.length === 0 && (
          <li style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Sin unidades.</li>
        )}
      </ul>

      <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 8 }}>NUEVA UNIDAD</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Clave (ej: gramo)"
            value={clave}
            onChange={e => setClave(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
            style={{ flex: 1, minWidth: 120 }}
          />
          <input
            className="input"
            placeholder="Etiqueta (ej: Gramo)"
            value={etiqueta}
            onChange={e => setEtiqueta(e.target.value)}
            style={{ flex: 1, minWidth: 130 }}
          />
          <input
            className="input"
            placeholder="Abrev. (ej: g)"
            value={abreviatura}
            onChange={e => setAbreviatura(e.target.value)}
            style={{ width: 90 }}
          />
          <Btn kind="brand" icon="plus" onClick={handleAdd} disabled={guardando}>
            {guardando ? 'Añadiendo…' : 'Añadir'}
          </Btn>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{error}</p>}
      </div>
    </section>
  )
}

export default function AjustesInventario() {
  const navigate = useNavigate()
  const { fetchCategorias, crearCategoria, eliminarCategoria, fetchUnidades, crearUnidad, eliminarUnidad } = useInventario()
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])

  const cargarCategorias = () => fetchCategorias().then(setCategorias)
  const cargarUnidades = () => fetchUnidades().then(setUnidades)

  useEffect(() => {
    cargarCategorias()
    cargarUnidades()
  }, [])

  return (
    <PageWrapper>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px 80px' }}>
        <button className="backlink" onClick={() => navigate('/inventario')}>
          <Icon name="back" size={15} />
          Inventario
        </button>

        <h1 style={{ fontFamily: '"Lora", serif', fontSize: 38, fontWeight: 600, margin: '6px 0 28px', letterSpacing: '-.01em', color: 'var(--ink)' }}>
          Ajustes de inventario
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SeccionCategorias
            categorias={categorias}
            onAdd={async (datos) => { await crearCategoria(datos); await cargarCategorias() }}
            onDelete={async (id) => { await eliminarCategoria(id); await cargarCategorias() }}
          />
          <SeccionUnidades
            unidades={unidades}
            onAdd={async (datos) => { await crearUnidad(datos); await cargarUnidades() }}
            onDelete={async (id) => { await eliminarUnidad(id); await cargarUnidades() }}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
