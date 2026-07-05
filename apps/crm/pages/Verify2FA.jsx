import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sanitizers } from '@/utils/validators'

export default function Verify2FA() {
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.[0]
      if (!totp) {
        navigate('/setup-2fa')
      } else {
        setFactorId(totp.id)
      }
    })
  }, [navigate])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!factorId) return
    setLoading(true)
    setError('')
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    setLoading(false)
    if (verifyError) {
      setError('Código incorrecto. Inténtalo de nuevo.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-ultra">
      <div className="bg-white rounded-lg shadow-sm p-10 w-full max-w-sm space-y-6">
        <h1 className="font-display text-2xl text-center">Verificación 2FA</h1>
        <p className="text-sm text-[--text-medium] text-center">
          Introduce el código de 6 dígitos de tu autenticador
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e => { setCode(sanitizers.otp(e.target.value)); if (error) setError('') }}
            placeholder="000000"
            className={`w-full text-center text-2xl tracking-widest border rounded-md px-4 py-3 focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-400' : 'border-[--border] focus:ring-primary'}`}
            autoFocus
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary text-white rounded-md py-3 font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verificando…' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  )
}
