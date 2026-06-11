import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import ToastContainer from '@/components/ui/Toast'

const ToastContext = createContext(null)

const AUTO_DISMISS_MS = 3500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (tipo, mensaje) => {
      const id = ++nextId.current
      setToasts((prev) => [...prev, { id, tipo, mensaje }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss]
  )

  const toast = useMemo(
    () => ({
      success: (mensaje) => push('success', mensaje),
      error: (mensaje) => push('error', mensaje),
      info: (mensaje) => push('info', mensaje),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return toast
}
