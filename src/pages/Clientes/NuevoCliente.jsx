import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { crearCliente } from '@/hooks/useClientes'
import { validarTelefono, validarEmail, sanitizers } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'

export default function NuevoCliente() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const fromEncargo = location.state?.from === 'nuevo-encargo'
  const draft = location.state?.draft
  const [form, setForm] = useState({
    nombre: '', apellidos: '', alias: '', telefono: '', email: '', notas: '',
  })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const set = (campo, valor) => {
    setForm(v => ({ ...v, [campo]: valor }))
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: undefined }))
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (form.telefono && !validarTelefono(form.telefono)) errs.telefono = 'Debe tener exactamente 9 dígitos.'
    if (form.email && !validarEmail(form.email)) errs.email = 'Email no válido.'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      const cliente = await crearCliente({ ...form })
      toast.success('Cliente creado.')
      if (fromEncargo) {
        navigate('/encargos/nuevo', { state: { nuevoCliente: cliente, draft } })
      } else {
        navigate(`/clientes/${cliente.id}`)
      }
    } catch (e) {
      console.error(e)
      toast.error('No se pudo guardar el cliente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <PageHeader
          titulo="Nuevo cliente"
          backTo={fromEncargo ? '/encargos/nuevo' : '/encargos?tab=clientes'}
          backState={fromEncargo ? { draft } : undefined}
        />

        {/* Datos personales */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Datos personales</h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" required error={errores.nombre}>
              <Input
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                sanitize={sanitizers.texto}
                onChange={e => set('nombre', e.target.value)}
              />
            </Field>
            <Field label="Apellidos">
              <Input
                type="text"
                placeholder="Apellidos"
                value={form.apellidos}
                sanitize={sanitizers.texto}
                onChange={e => set('apellidos', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Alias">
            <Input
              type="text"
              placeholder="Referencia (p. ej. hija de Carmen)"
              value={form.alias}
              sanitize={sanitizers.texto}
              onChange={e => set('alias', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" error={errores.telefono}>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="612345678"
                value={form.telefono}
                sanitize={sanitizers.telefono}
                onChange={e => set('telefono', e.target.value)}
              />
            </Field>
            <Field label="Email" error={errores.email}>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                sanitize={sanitizers.email}
                onChange={e => set('email', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notas">
            <Textarea
              placeholder="Observaciones sobre el cliente…"
              value={form.notas}
              sanitize={sanitizers.texto}
              onChange={e => set('notas', e.target.value)}
            />
          </Field>
        </section>

        {/* Botones */}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" onClick={handleGuardar} loading={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cliente'}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => fromEncargo
              ? navigate('/encargos/nuevo', { state: { draft } })
              : navigate('/encargos?tab=clientes')}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
