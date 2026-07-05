import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Buscador con icono y botón de limpiar.
export default function SearchInput({ value, onChange, placeholder = 'Buscar…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-light]" aria-hidden="true" />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2 border border-[--border] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[--text-light] hover:text-[--text-dark]"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
