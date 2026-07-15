import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sanitizers } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'

export default function Verify2FA() {
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { recargarAal } = useAuth()

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      console.log('[Verify2FA] listFactors resultado', { data, error })
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
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      console.log('[Verify2FA] challenge resultado', { challenge, challengeError })
      if (challengeError) {
        setLoading(false)
        setError('No se pudo iniciar la verificación. Inténtalo de nuevo.')
        return
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      console.log('[Verify2FA] verify resultado', { verifyError })
      if (verifyError) {
        setLoading(false)
        setError('Código incorrecto. Inténtalo de nuevo.')
        return
      }
      const refreshResult = await supabase.auth.refreshSession()
      console.log('[Verify2FA] refreshSession resultado', refreshResult)
      await recargarAal()
      const rpcResult = await supabase.rpc('tocar_ultimo_acceso')
      console.log('[Verify2FA] tocar_ultimo_acceso resultado', rpcResult)
      setLoading(false)
      console.log('[Verify2FA] navegando a /')
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[Verify2FA] excepción no controlada', err)
      setLoading(false)
      setError('Ha ocurrido un error inesperado. Revisa la consola.')
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
