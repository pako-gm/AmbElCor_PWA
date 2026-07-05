import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sanitizers } from '@/utils/validators'

export default function SeguimientoForm() {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleBuscar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: dbError } = await supabase
      .from('encargos')
      .select('token_publico')
      .eq('codigo_corto', codigo.toUpperCase().trim())
      .maybeSingle()
    setLoading(false)
    if (dbError || !data) {
      setError('Código no encontrado. Verifica e inténtalo de nuevo.')
    } else {
      navigate(`/seguimiento/${data.token_publico}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-ultra px-4">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm space-y-6 text-center">
        <h1 className="font-display text-2xl text-[--text-dark]">Seguimiento de encargo</h1>
        <p className="text-sm text-[--text-medium]">
          Introduce el código que te facilitó el taller (ej: AMB-4X9K)
        </p>
        <form onSubmit={handleBuscar} className="space-y-4">
          <input
            type="text"
            value={codigo}
            onChange={e => { setCodigo(sanitizers.codigo(e.target.value)); if (error) setError('') }}
            placeholder="AMB-XXXX"
            maxLength={8}
            className={`w-full text-center text-lg tracking-widest uppercase border rounded-md px-4 py-3 focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-400' : 'border-[--border] focus:ring-primary'}`}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || codigo.length < 8}
            className="w-full bg-primary text-white rounded-md py-3 font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? 'Buscando…' : 'Ver mi encargo'}
          </button>
        </form>
      </div>
    </div>
  )
}
