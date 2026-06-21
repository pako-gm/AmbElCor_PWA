import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { Icon, Btn, Field } from '@/components/inventario/InventarioUI'
import { useInventario } from '@/hooks/useInventario'
import { useToast } from '@/hooks/useToast'
import { validarNumeroPositivo } from '@/utils/validators'

const formVacio = {
  codigo: '', nombre: '', descripcion: '', unidad_gestion: 'unidad',
  categoria: '', stock_minimo: '0', precio_referencia: '', notas: '',
}

export default function NuevoMaterial() {
  const navigate = useNavigate()
  const toast = useToast()
  const { crearMaterial, fetchCategorias, fetchUnidades, generarCodigoMaterial } = useInventario()
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])

  useEffect(() => {
    fetchCategorias().then(setCategorias)
    fetchUnidades().then(data => {
      setUnidades(data)
      if (data.length > 0) setForm(f => ({ ...f, unidad_gestion: data[0].clave }))
    })
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const prefijoActual = categorias.find(c => c.nombre === form.categoria)?.prefijo || 'S/C'

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    if (form.stock_minimo !== '' && !validarNumeroPositivo(form.stock_minimo))
      return setError('El stock mínimo debe ser un número igual o mayor que 0.')
    if (form.precio_referencia !== '' && !validarNumeroPositivo(form.precio_referencia))
      return setError('El precio de referencia debe ser un número igual o mayor que 0.')
    setError('')
    setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        unidad: form.unidad_gestion,
        categoria: form.categoria.trim() || null,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
        precio_referencia: form.precio_referencia !== '' ? parseFloat(form.precio_referencia) : null,
        notas: form.notas.trim() || null,
      }
      if (form.codigo.trim()) {
        payload.codigo = form.codigo.trim()
      } else {
        const cat = categorias.find(c => c.nombre === form.categoria)
        payload.codigo = await generarCodigoMaterial(cat?.prefijo || 'S/C')
      }
      const material = await crearMaterial(payload)
      toast.success('Material creado correctamente.')
      navigate(`/inventario/${material.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PageWrapper>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* Backlink */}
        <button className="backlink" onClick={() => navigate('/inventario')}>
          <Icon name="back" size={15} />
          Inventario
        </button>

        <h1 style={{ fontFamily: '"Lora", serif', fontSize: 38, fontWeight: 600, margin: '6px 0 22px', letterSpacing: '-.01em', color: 'var(--ink)' }}>
          Nuevo material
        </h1>

        {/* Nota informativa */}
        <div className="form-note" style={{ marginBottom: 24 }}>
          <Icon name="info" size={16} />
          <span>Tras crear el artículo podrás registrar la <b>primera entrada de stock</b> desde su ficha.</span>
        </div>

        <div className="card-form">
          {/* Nombre + Categoría */}
          <Field label="NOMBRE *" htmlFor="nm-nombre">
            <input
              id="nm-nombre"
              className="input"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej: Espolín seda natural"
              autoFocus
            />
          </Field>

          <div className="grid-2">
            <Field label="CATEGORÍA" htmlFor="nm-cat">
              <div className="select-wrap">
                <select id="nm-cat" className="input" value={form.categoria} onChange={set('categoria')}>
                  <option value="">— Sin categoría —</option>
                  {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
                <Icon name="chevron" size={16} />
              </div>
            </Field>

            <Field label="UNIDAD DE GESTIÓN" htmlFor="nm-unidad">
              <div className="select-wrap">
                <select id="nm-unidad" className="input" value={form.unidad_gestion} onChange={set('unidad_gestion')}>
                  {unidades.map(u => <option key={u.id} value={u.clave}>{u.etiqueta} ({u.abreviatura})</option>)}
                </select>
                <Icon name="chevron" size={16} />
              </div>
            </Field>
          </div>

          <div className="grid-2">
            <Field
              label="CÓDIGO (opcional)"
              hint={`Si lo dejas vacío, se genera automáticamente (${prefijoActual}-NNN).`}
              htmlFor="nm-codigo"
            >
              <input
                id="nm-codigo"
                className="input"
                value={form.codigo}
                onChange={set('codigo')}
                placeholder={`${prefijoActual}-001`}
              />
            </Field>

            <Field label="DESCRIPCIÓN" htmlFor="nm-desc">
              <input
                id="nm-desc"
                className="input"
                value={form.descripcion}
                onChange={set('descripcion')}
                placeholder="Descripción detallada…"
              />
            </Field>
          </div>

          <div className="grid-2">
            <Field label="STOCK MÍNIMO (alerta)" htmlFor="nm-min">
              <input
                id="nm-min"
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.stock_minimo}
                onChange={set('stock_minimo')}
              />
            </Field>

            <Field label="PRECIO DE REFERENCIA (€)" htmlFor="nm-precio">
              <input
                id="nm-precio"
                className="input"
                type="number"
                min="0"
                step="0.50"
                value={form.precio_referencia}
                onChange={set('precio_referencia')}
                placeholder="Precio por unidad/metro…"
              />
            </Field>
          </div>

          <Field label="NOTAS" htmlFor="nm-notas">
            <textarea
              id="nm-notas"
              className="input textarea"
              value={form.notas}
              onChange={set('notas')}
              placeholder="Observaciones, proveedor habitual, referencias cruzadas…"
            />
          </Field>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>{error}</div>
          )}

          <div className="form-actions">
            <Btn kind="muted" icon="x" onClick={() => navigate('/inventario')}>Cancelar</Btn>
            <Btn kind="brand" icon="plus" onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Crear material'}
            </Btn>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
