import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: ModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1200px' }
  }

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={onClose}
      style={{ animationDuration: '0.2s' }}
    >
      <div
        className="modal-content animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ ...sizeStyles[size], animationDuration: '0.3s' }}
      >
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Confirmation Modal variant
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'warning' | 'error' | 'danger' | 'info'
  loading?: boolean
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false
}: ConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm()
  }

  const getButtonClass = () => {
    switch (variant) {
      case 'error':
      case 'danger':
        return 'error'
      case 'info':
        return 'primary'
      default:
        return 'warning'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ marginBottom: 'var(--spacing-xl)' }}>{message}</p>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          className={`btn btn-${getButtonClass()}`}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading && <span className="spinner spinner-sm" style={{ marginRight: '0.5rem' }}></span>}
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
