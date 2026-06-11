import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Cabecera de página estándar: botón volver opcional, título Lora y acciones a la derecha.
export default function PageHeader({ titulo, subtitulo, backTo, accion, className }) {
  const navigate = useNavigate()
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          aria-label="Volver"
          className="text-[--text-light] hover:text-[--text-dark] transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {subtitulo && <p className="text-xs text-[--text-light]">{subtitulo}</p>}
        <h1 className="font-display text-2xl text-[--text-dark] truncate">{titulo}</h1>
      </div>
      {accion}
    </div>
  )
}
