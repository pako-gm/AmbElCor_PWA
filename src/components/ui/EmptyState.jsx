import { cn } from '@/lib/utils'

// Estado vacío estándar: icono opcional (componente lucide), título y acción.
export default function EmptyState({ icon: Icon, titulo, descripcion, accion, className }) {
  return (
    <div className={cn('text-center py-12 space-y-2', className)}>
      {Icon && <Icon size={32} className="mx-auto text-[--text-light]" aria-hidden="true" />}
      {titulo && <p className="text-sm text-[--text-medium] font-medium">{titulo}</p>}
      {descripcion && <p className="text-sm text-[--text-light]">{descripcion}</p>}
      {accion && <div className="pt-2">{accion}</div>}
    </div>
  )
}
