import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Modal genérico para los módulos Tailwind (el de Inventario tiene el suyo propio).
export default function Modal({ open, onClose, title, footer, maxWidth = 'max-w-md', children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn('bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto', maxWidth)}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h3 className="font-semibold text-[--text-dark]">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1 text-[--text-light] hover:text-[--text-dark] hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 pb-5">{children}</div>
        {footer && <div className="flex gap-3 px-6 pb-5">{footer}</div>}
      </div>
    </div>
  )
}
