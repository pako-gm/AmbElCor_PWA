import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, X } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchCliente, fetchMedidasCliente, guardarMedidasCliente } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import LoadingState from '@/components/ui/LoadingState'

const CAMPOS_VACIOS = {
  fecha_toma: '',
  // Generales
  altura_total: '', contorno_pecho: '', contorno_cintura: '', contorno_cadera: '',
  talle_delantero: '', talle_espalda: '', ancho_espalda: '', ancho_pecho: '',
  separacion_pecho: '', altura_pecho: '',
  // Brazos
  largo_manga: '', contorno_sisa: '', contorno_brazo: '', contorno_codo: '', contorno_muneca: '',
  // Falda
  largo_falda_delantero: '', largo_falda_trasero: '', contorno_cadera_alta: '', vuelo_deseado: '',
  // Cuello y escote
  contorno_cuello: '', profundidad_escote_del: '', profundidad_escote_tras: '', ancho_escote: '',
  // Referencias
  altura_cintura_suelo: '', num_calzado: '', altura_con_zapato: '',
  notas: '',
}

const SECCIONES = [
  {
    titulo: 'Corporales generales',
    campos: [
      { key: 'altura_total', label: 'Altura total', unidad: 'cm' },
      { key: 'contorno_pecho', label: 'Contorno de pecho', unidad: 'cm' },
      { key: 'contorno_cintura', label: 'Contorno de cintura', unidad: 'cm' },
      { key: 'contorno_cadera', label: 'Contorno de cadera', unidad: 'cm' },
      { key: 'talle_delantero', label: 'Talle delantero', unidad: 'cm' },
      { key: 'talle_espalda', label: 'Talle espalda', unidad: 'cm' },
      { key: 'ancho_espalda', label: 'Ancho de espalda', unidad: 'cm' },
      { key: 'ancho_pecho', label: 'Ancho de pecho', unidad: 'cm' },
      { key: 'separacion_pecho', label: 'Separación de pecho', unidad: 'cm' },
      { key: 'altura_pecho', label: 'Altura de pecho', unidad: 'cm' },
    ],
  },
  {
    titulo: 'Brazos / manga',
    campos: [
      { key: 'largo_manga', label: 'Largo de manga', unidad: 'cm' },
      { key: 'contorno_sisa', label: 'Contorno de sisa', unidad: 'cm' },
      { key: 'contorno_brazo', label: 'Contorno de brazo', unidad: 'cm' },
      { key: 'contorno_codo', label: 'Contorno de codo', unidad: 'cm' },
      { key: 'contorno_muneca', label: 'Contorno de muñeca', unidad: 'cm' },
    ],
  },
  {
    titulo: 'Falda / faldón',
    campos: [
      { key: 'largo_falda_delantero', label: 'Largo falda delantero', unidad: 'cm' },
      { key: 'largo_falda_trasero', label: 'Largo falda trasero', unidad: 'cm' },
      { key: 'contorno_cadera_alta', label: 'Contorno cadera alta', unidad: 'cm' },
      { key: 'vuelo_deseado', label: 'Vuelo deseado', unidad: null, tipo: 'text' },
    ],
  },
  {
    titulo: 'Cuello y escote (gipó)',
    campos: [
      { key: 'contorno_cuello', label: 'Contorno de cuello', unidad: 'cm' },
      { key: 'profundidad_escote_del', label: 'Prof. escote delantero', unidad: 'cm' },
      { key: 'profundidad_escote_tras', label: 'Prof. escote trasero', unidad: 'cm' },
      { key: 'ancho_escote', label: 'Ancho de escote', unidad: 'cm' },
    ],
  },
  {
    titulo: 'Referencias',
    campos: [
      { key: 'altura_cintura_suelo', label: 'Altura cintura al suelo', unidad: 'cm' },
      { key: 'num_calzado', label: 'Número de calzado', unidad: null },
      { key: 'altura_con_zapato', label: 'Altura con zapato', unidad: 'cm' },
    ],
  },
]

export default function MedidasCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [nombreCliente, setNombreCliente] = useState('')
  const [form, setForm] = useState(CAMPOS_VACIOS)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchCliente(id), fetchMedidasCliente(id)])
      .then(([cliente, medidas]) => {
        setNombreCliente(`${cliente.nombre} ${cliente.apellidos ?? ''}`.trim())
        if (medidas) {
          const datos = { ...CAMPOS_VACIOS }
          Object.keys(CAMPOS_VACIOS).forEach(k => {
            datos[k] = medidas[k] != null ? String(medidas[k]) : ''
          })
          setForm(datos)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const set = (key, val) => setForm(v => ({ ...v, [key]: val }))

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      const datos = {}
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'fecha_toma' || k === 'vuelo_deseado' || k === 'notas') {
          datos[k] = v || null
        } else {
          datos[k] = v !== '' ? parseFloat(v) : null
        }
      })
      await guardarMedidasCliente(id, datos)
      toast.success('Medidas guardadas.')
      navigate(`/clientes/${id}`)
    } catch (e) {
      setError('Error al guardar. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <PageWrapper><LoadingState /></PageWrapper>

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="text-[--text-light] hover:text-[--text-dark]"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl text-[--text-dark]">Medidas</h1>
            <p className="text-xs text-[--text-light]">{nombreCliente}</p>
          </div>
          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>
              <X size={14} /> Cancelar
            </Button>
            <Button size="sm" onClick={handleGuardar} loading={guardando}>
              <Check size={14} /> {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Fecha de toma */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Fecha de toma</h2>
          <div className="max-w-xs">
            <Input
              type="date"
              aria-label="Fecha de toma"
              value={form.fecha_toma}
              onChange={e => set('fecha_toma', e.target.value)}
            />
          </div>
        </section>

        {/* Secciones de medidas */}
        {SECCIONES.map(({ titulo, campos }) => (
          <section key={titulo} className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">{titulo}</h2>
            <div className="grid grid-cols-2 gap-3">
              {campos.map(({ key, label, unidad, tipo }) => (
                <Field key={key} label={`${label}${unidad ? ` (${unidad})` : ''}`}>
                  <Input
                    type={tipo ?? 'number'}
                    min={tipo ? undefined : '0'}
                    placeholder={unidad ? '0' : ''}
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </section>
        ))}

        {/* Notas */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Notas</h2>
          <Textarea
            placeholder="Observaciones sobre las medidas…"
            aria-label="Notas de medidas"
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            rows={3}
          />
        </section>

      </div>
    </PageWrapper>
  )
}
