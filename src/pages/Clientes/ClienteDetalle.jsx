import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingState from '@/components/ui/LoadingState'
import Badge from '@/components/ui/Badge'
import { fetchCliente, actualizarCliente, eliminarCliente, fetchMedidasCliente } from '@/hooks/useClientes'
import { formatFecha, formatImporte, formatTelefono, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'
import { validarTelefono, validarEmail } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edición datos contacto
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({})
  const [erroresEdit, setErroresEdit] = useState({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  // Medidas (solo lectura — edición en página propia)
  const [medidas, setMedidas] = useState(null)
  const [mostrarMedidas, setMostrarMedidas] = useState(false)

  // Confirmación eliminar
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([fetchCliente(id), fetchMedidasCliente(id)])
      .then(([c, m]) => {
        setCliente(c)
        setFormEdit({ nombre: c.nombre, apellidos: c.apellidos ?? '', telefono: c.telefono ?? '', email: c.email ?? '', notas: c.notas ?? '' })
        setMedidas(m)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [id])

  const validarEdit = () => {
    const errs = {}
    if (!formEdit.nombre?.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (formEdit.telefono && !validarTelefono(formEdit.telefono)) errs.telefono = 'Debe tener 9 dígitos.'
    if (formEdit.email && !validarEmail(formEdit.email)) errs.email = 'Email no válido.'
    setErroresEdit(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardarDatos = async () => {
    if (!validarEdit()) return
    setGuardandoEdit(true)
    try {
      await actualizarCliente(id, {
        nombre: formEdit.nombre,
        apellidos: formEdit.apellidos || null,
        telefono: formEdit.telefono || null,
        email: formEdit.email || null,
        notas: formEdit.notas || null,
      })
      setEditando(false)
      toast.success('Datos del cliente actualizados.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudieron guardar los cambios.')
    }
    finally { setGuardandoEdit(false) }
  }

  const handleEliminar = async () => {
    try {
      await eliminarCliente(id)
      toast.success('Cliente eliminado.')
      navigate('/encargos?tab=clientes')
    } catch (e) {
      setErrorEliminar(e.message)
    }
  }

  if (loading) return <PageWrapper><LoadingState /></PageWrapper>
  if (!cliente) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cliente no encontrado.</div></PageWrapper>

  const nombreCompleto = `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim()
  const encargos = (cliente.encargos ?? []).sort((a, b) => new Date(b.fecha_encargo) - new Date(a.fecha_encargo))
  const totalFacturado = encargos.reduce((s, e) => s + (parseFloat(e.precio_total) || 0), 0)
  const tieneMedidas = medidas != null && Object.entries(medidas)
    .some(([k, v]) => !['id','cliente_id','created_at','updated_at','notas','fecha_toma'].includes(k) && v != null)

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/encargos?tab=clientes')}
            aria-label="Volver"
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-[--border] rounded-lg bg-white text-[--text-medium] hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl text-[--text-dark]">{nombreCompleto}</h1>
            <p className="text-xs text-[--text-light]">Cliente desde {formatFecha(cliente.created_at)}</p>
          </div>
          <button
            onClick={() => { setEditando(true); setErroresEdit({}) }}
            className="text-[--text-light] hover:text-primary transition-colors"
            title="Editar datos"
            aria-label="Editar datos"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={() => { setConfirmDelete(true); setErrorEliminar('') }}
            className="text-[--text-light] hover:text-red-500 transition-colors"
            title="Eliminar cliente"
            aria-label="Eliminar cliente"
          >
            <Trash2 size={17} />
          </button>
        </div>

        {/* Datos de contacto */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Datos de contacto</h2>

          {editando ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" required error={erroresEdit.nombre}>
                  <Input
                    type="text"
                    value={formEdit.nombre}
                    onChange={e => setFormEdit(v => ({ ...v, nombre: e.target.value }))}
                  />
                </Field>
                <Field label="Apellidos">
                  <Input
                    type="text"
                    value={formEdit.apellidos}
                    onChange={e => setFormEdit(v => ({ ...v, apellidos: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono" error={erroresEdit.telefono}>
                  <Input
                    type="tel"
                    value={formEdit.telefono}
                    onChange={e => setFormEdit(v => ({ ...v, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                  />
                </Field>
                <Field label="Email" error={erroresEdit.email}>
                  <Input
                    type="email"
                    value={formEdit.email}
                    onChange={e => setFormEdit(v => ({ ...v, email: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Notas">
                <Textarea
                  value={formEdit.notas}
                  onChange={e => setFormEdit(v => ({ ...v, notas: e.target.value }))}
                />
              </Field>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleGuardarDatos} loading={guardandoEdit}>
                  <Check size={13} /> {guardandoEdit ? 'Guardando…' : 'Guardar'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setEditando(false); setErroresEdit({}) }}>
                  <X size={13} /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-sm">
              {cliente.telefono && <p className="text-[--text-dark]">📞 {formatTelefono(cliente.telefono)}</p>}
              {cliente.email && <p className="text-[--text-dark]">✉️ {cliente.email}</p>}
              {cliente.notas && <p className="text-[--text-light] text-xs mt-2">{cliente.notas}</p>}
              {!cliente.telefono && !cliente.email && !cliente.notas && (
                <p className="text-[--text-light] text-xs">Sin datos de contacto</p>
              )}
            </div>
          )}
        </section>

        {/* Medidas */}
        <section className="bg-white rounded-lg border border-[--border] overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarMedidas(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
          >
            <span>
              Medidas{' '}
              {tieneMedidas && (
                <span className="text-xs font-normal text-primary ml-1">
                  {medidas.fecha_toma ? `tomadas el ${formatFecha(medidas.fecha_toma)}` : 'registradas'}
                </span>
              )}
            </span>
            {mostrarMedidas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {mostrarMedidas && (
            <div className="px-4 pb-4 pt-3 space-y-2 border-t border-[--border]">
              {tieneMedidas ? (
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  {[
                    ['contorno_pecho', 'Pecho'], ['contorno_cintura', 'Cintura'],
                    ['contorno_cadera', 'Cadera'], ['talle_espalda', 'Talle espalda'],
                    ['talle_delantero', 'Talle delantero'], ['altura_total', 'Altura'],
                    ['ancho_espalda', 'Ancho espalda'], ['largo_manga', 'Largo manga'],
                  ].map(([key, label]) => medidas[key] != null && (
                    <p key={key}>
                      <span className="text-xs text-[--text-light]">{label}:</span>{' '}
                      {medidas[key]} cm
                    </p>
                  ))}
                  {medidas.num_calzado != null && (
                    <p><span className="text-xs text-[--text-light]">Calzado:</span> {medidas.num_calzado}</p>
                  )}
                  {medidas.notas && (
                    <p className="col-span-2 text-xs text-[--text-light] mt-1">{medidas.notas}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[--text-light]">Sin medidas registradas.</p>
              )}
              <button
                onClick={() => navigate(`/clientes/${id}/medidas`)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {tieneMedidas ? 'Editar medidas' : 'Añadir medidas'}
              </button>
            </div>
          )}
        </section>

        {/* Encargos */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[--text-medium]">Encargos</h2>
            <div className="text-right">
              <p className="text-xs text-[--text-light]">Total facturado</p>
              <p className="text-sm font-semibold text-[--text-dark]">{formatImporte(totalFacturado)}</p>
            </div>
          </div>

          {encargos.length === 0 ? (
            <p className="text-xs text-[--text-light]">Sin encargos registrados.</p>
          ) : (
            <div className="space-y-2">
              {encargos.map(e => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/encargos/${e.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-md border border-[--border] hover:border-primary transition-colors text-left"
                >
                  <div>
                    <p className="text-xs text-[--text-light]">{e.numero}</p>
                    <p className="text-xs text-[--text-light] mt-0.5">
                      {formatFecha(e.fecha_encargo)}
                      {e.encargo_lineas?.length > 0 && ` · ${e.encargo_lineas.length} prenda${e.encargo_lineas.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge estado={e.estado} />
                    <p className="text-sm font-semibold text-[--text-dark]">{formatImporte(e.precio_total)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Modal confirmar eliminación */}
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cliente"
        description={
          errorEliminar
            ? errorEliminar
            : `¿Eliminar a ${nombreCompleto}? Esta acción no se puede deshacer.`
        }
        onConfirm={handleEliminar}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageWrapper>
  )
}
