import { forwardRef, useId, isValidElement, cloneElement } from 'react'
import { cn } from '@/lib/utils'

const inputBase =
  'w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50'

const inputBorder = (error) => (error ? 'border-red-400' : 'border-[--border]')

// Campo con label asociada (htmlFor automático), error y hint.
// Uso: <Field label="Teléfono" error={errs.telefono}><Input type="tel" ... /></Field>
// Si el hijo es un único elemento, recibe id y error inyectados automáticamente.
export function Field({ label, error, hint, required, htmlFor, className, children }) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  const child = isValidElement(children)
    ? cloneElement(children, { id: children.props.id ?? id, error: children.props.error ?? !!error })
    : typeof children === 'function'
      ? children({ id, error: !!error })
      : children
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-[--text-medium]">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {child}
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-[--text-light]">{hint}</p>}
    </div>
  )
}

export const Input = forwardRef(function Input({ error, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(inputBase, inputBorder(error), className)}
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea({ error, className, rows = 2, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputBase, inputBorder(error), 'resize-none', className)}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select({ error, className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(inputBase, inputBorder(error), className)}
      {...props}
    >
      {children}
    </select>
  )
})
