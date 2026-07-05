import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

const STYLES = {
  success: 'bg-primary text-white',
  error: 'bg-danger text-white',
  info: 'bg-[--text-dark] text-white',
}

// Contenedor visual de toasts; lo monta ToastProvider (src/hooks/useToast.jsx).
export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 z-[60] flex flex-col gap-2 items-center md:items-end pointer-events-none"
    >
      {toasts.map(({ id, tipo, mensaje }) => {
        const Icon = ICONS[tipo] ?? Info
        return (
          <div
            key={id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-lg shadow-lg px-4 py-3 text-sm font-medium max-w-sm w-full md:w-auto',
              STYLES[tipo] ?? STYLES.info
            )}
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className="flex-1">{mensaje}</span>
            <button
              onClick={() => onDismiss(id)}
              aria-label="Cerrar aviso"
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
