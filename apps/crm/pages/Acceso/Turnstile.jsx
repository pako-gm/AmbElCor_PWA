// Turnstile.jsx — widget CAPTCHA de Cloudflare Turnstile (gratuito).
// Sin dependencia npm: Turnstile se carga como script global (window.turnstile).
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

let scriptPromise = null
function cargarScript() {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
  const contenedorRef = useRef(null)
  const widgetIdRef = useRef(null)

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current != null) window.turnstile?.reset(widgetIdRef.current)
    },
  }))

  useEffect(() => {
    let activo = true
    if (!SITE_KEY) return

    cargarScript().then(() => {
      if (!activo || !contenedorRef.current) return
      widgetIdRef.current = window.turnstile.render(contenedorRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    })

    return () => {
      activo = false
      if (widgetIdRef.current != null) window.turnstile?.remove(widgetIdRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null

  return <div ref={contenedorRef} />
})

export default Turnstile
