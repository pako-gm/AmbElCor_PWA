import { cn } from '@/lib/utils'

// Estado de carga estándar para listas y páginas.
export default function LoadingState({ texto = 'Cargando…', className }) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-2 py-12 text-sm text-[--text-light]', className)}
    >
      <span
        aria-hidden="true"
        className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
      />
      {texto}
    </div>
  )
}
