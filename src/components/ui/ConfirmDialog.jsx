import { useEffect, useRef } from 'react'
import Modal from './Modal'
import Button from './Button'

// Diálogo de confirmación destructiva o informativa.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
      {description && <p className="text-sm text-[--text-medium] mb-4">{description}</p>}
      <div className="flex gap-3">
        <Button ref={cancelRef} variant="secondary" full onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          full
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
