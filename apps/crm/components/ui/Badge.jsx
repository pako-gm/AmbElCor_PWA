import { cn } from '@/lib/utils'
import { ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

// Badge de estado de encargo (o genérico pasando children + className).
export default function Badge({ estado, className, children }) {
  const s = estado ? ESTADO_COLORS[estado] : null
  return (
    <span
      className={cn(
        'inline-block text-xs px-2 py-0.5 rounded-full font-medium border',
        className
      )}
      style={s ? { color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderColor } : undefined}
    >
      {children ?? (estado ? ESTADO_LABELS[estado] : null)}
    </span>
  )
}
