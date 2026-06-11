import { cn } from '@/lib/utils'
import { ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

// Badge de estado de encargo (o genérico pasando children + className).
export default function Badge({ estado, className, children }) {
  return (
    <span
      className={cn(
        'inline-block text-xs px-2 py-0.5 rounded-full font-medium',
        estado && ESTADO_COLORS[estado],
        className
      )}
    >
      {children ?? (estado ? ESTADO_LABELS[estado] : null)}
    </span>
  )
}
