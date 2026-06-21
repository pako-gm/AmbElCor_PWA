import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sanitizers } from '@/utils/validators'

export default function Setup2FA() {
  const [qrCode, setQrCode] = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.mfa.enroll({ factorType: 'totp' }).then(({ data, error }) => {
      if (error) return
      setQrCode(data.totp.qr_code)
      setFactorId(data.id)
    })
  }, [])

  const handleActivate = async (e) => {
    e.preventDefault()
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
      setError('Código incorrecto. Escanea el QR de nuevo.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-ultra">
      <div className="bg-white rounded-lg shadow-sm p-10 w-full max-w-sm space-y-6 text-center">
        <h1 className="font-display text-2xl">Configurar 2FA</h1>
        <p className="text-sm text-[--text-medium]">
          Escanea este código QR con Google Authenticator o Authy
        </p>
        {qrCode && (
          <img src={qrCode} alt="QR 2FA" className="mx-auto w-48 h-48 border border-[--border] rounded-md p-2" />
        )}
        <form onSubmit={handleActivate} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e => { setCode(sanitizers.otp(e.target.value)); if (error) setError('') }}
            placeholder="Código de verificación"
            className={`w-full text-center text-xl tracking-widest border rounded-md px-4 py-3 focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-400' : 'border-[--border] focus:ring-primary'}`}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary text-white rounded-md py-3 font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? 'Activando…' : 'Activar 2FA'}
          </button>
        </form>
      </div>
    </div>
  )
}
