import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'

// Text Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  help?: string
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, help, required, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className={`form-label ${required ? 'form-label-required' : ''}`} htmlFor={props.id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
        {help && !error && <span className="form-help">{help}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  help?: string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, help, required, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className={`form-label ${required ? 'form-label-required' : ''}`} htmlFor={props.id}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`form-textarea ${error ? 'form-input-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
        {help && !error && <span className="form-help">{help}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  help?: string
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
  children?: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, help, required, options, children, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className={`form-label ${required ? 'form-label-required' : ''}`} htmlFor={props.id}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`form-select ${error ? 'form-input-error' : ''} ${className}`}
          {...props}
        >
          {options ? options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )) : children}
        </select>
        {error && <span className="form-error">{error}</span>}
        {help && !error && <span className="form-help">{help}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'

// Checkbox
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
        <input
          ref={ref}
          type="checkbox"
          className={`form-checkbox ${className}`}
          {...props}
        />
        <span>{label}</span>
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// Radio
interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
        <input
          ref={ref}
          type="radio"
          className={`form-radio ${className}`}
          {...props}
        />
        <span>{label}</span>
      </label>
    )
  }
)

Radio.displayName = 'Radio'

// File Input
interface FileInputProps {
  label?: string
  error?: string
  help?: string
  accept?: string
  multiple?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  dragging?: boolean
}

export const FileInput = ({
  label = 'Choose file or drag and drop',
  error,
  help,
  accept,
  multiple,
  onChange,
  dragging = false
}: FileInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e)
  }

  return (
    <div className="form-group">
      <input
        type="file"
        className="form-file-input"
        id="file-upload"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
      <label
        htmlFor="file-upload"
        className={`form-file-label ${dragging ? 'form-file-label-dragging' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
        </svg>
        {label}
      </label>
      {help && <span className="form-help" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-xs)', display: 'block' }}>{help}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
