import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { CloseIcon, FileIcon, UploadIcon } from '../lib/icons'
import { Button } from '../primitives/button'
import { useFieldControl } from '../lib/field-context'
import { Progress } from './feedback'

/** `1536000` → `1.5 MB`. Decimal units, because that is what a file manager shows. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const power = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1000)))
  const value = bytes / 1000 ** power
  return `${power === 0 ? value : value.toFixed(decimals)} ${units[power]}`
}

export interface UploadItem {
  file: File
  /** 0–100 while uploading. Omit for a file that is simply selected. */
  progress?: number
  error?: string
}

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Mirrors the `accept` attribute — `'image/*,.pdf'`. */
  accept?: string
  multiple?: boolean
  /** Reject anything larger, in bytes. */
  maxSize?: number
  /** Reject beyond this many files. */
  maxFiles?: number
  disabled?: boolean
  /** The selection. Controlled: the caller keeps the list. */
  value?: UploadItem[]
  onValueChange?: (items: UploadItem[]) => void
  /** Called with whatever survived validation. */
  onFilesAccepted?: (files: File[]) => void
  /** Called for each rejection, so the app decides how loudly to complain. */
  onFileRejected?: (file: File, reason: 'size' | 'type' | 'count') => void
  /** Replaces the wording inside the drop zone. */
  children?: ReactNode
  hint?: ReactNode
}

function accepts(file: File, accept?: string): boolean {
  if (!accept) return true
  return accept.split(',').some((raw) => {
    const pattern = raw.trim().toLowerCase()
    if (!pattern) return false
    if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern)
    if (pattern.endsWith('/*')) return file.type.startsWith(pattern.slice(0, -1))
    return file.type.toLowerCase() === pattern
  })
}

/**
 * A drop zone with a file list.
 *
 * The hidden `<input type="file">` stays the real control — the styled area is
 * a label for it — so keyboard users, form resets and the OS file picker all
 * work without a line of extra code.
 *
 * Validation happens here but reporting does not: the component rejects a file
 * and tells the caller why, and the caller decides whether that is a toast, an
 * inline error, or nothing at all.
 */
export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  {
    className,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    disabled = false,
    value,
    onValueChange,
    onFilesAccepted,
    onFileRejected,
    hint,
    children,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const generatedId = useId()
  const inputId = field.id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [internal, setInternal] = useState<UploadItem[]>([])
  const items = value ?? internal

  const commit = useCallback(
    (next: UploadItem[]) => {
      if (value === undefined) setInternal(next)
      onValueChange?.(next)
    },
    [onValueChange, value],
  )

  const add = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return
      const accepted: File[] = []

      for (const file of Array.from(incoming)) {
        if (!accepts(file, accept)) {
          onFileRejected?.(file, 'type')
          continue
        }
        if (maxSize !== undefined && file.size > maxSize) {
          onFileRejected?.(file, 'size')
          continue
        }
        const total = items.length + accepted.length
        const limit = maxFiles ?? (multiple ? Infinity : 1)
        if (total >= limit) {
          onFileRejected?.(file, 'count')
          continue
        }
        accepted.push(file)
      }

      if (accepted.length === 0) return
      const next = multiple
        ? [...items, ...accepted.map((file) => ({ file }))]
        : [{ file: accepted[0]! }]
      commit(next)
      onFilesAccepted?.(accepted)
    },
    [accept, commit, disabled, items, maxFiles, maxSize, multiple, onFileRejected, onFilesAccepted],
  )

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    add(event.dataTransfer.files)
  }

  return (
    <div
      ref={ref}
      data-slot="file-upload"
      className={cn('sui-dropzone-wrap', className)}
      {...props}
    >
      {/* The drop handlers sit on the wrapper; the real control is the input. */}
      <div
        className={cn('sui-dropzone', dragging && 'sui-dropzone--over')}
        data-disabled={disabled || undefined}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sui-dropzone__input"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={field['aria-describedby']}
          onChange={(event) => {
            if (event.target.files) add(event.target.files)
            // Clear it so picking the same file twice still fires a change.
            event.target.value = ''
          }}
        />
        <span className="sui-dropzone__icon" aria-hidden="true">
          <UploadIcon />
        </span>
        <label htmlFor={inputId} className="sui-dropzone__label">
          {children ?? (
            <>
              <span className="sui-dropzone__action">Choose a file</span> or drag it here
            </>
          )}
        </label>
        {hint ??
          (maxSize ? (
            <span className="sui-dropzone__hint">Up to {formatBytes(maxSize)}</span>
          ) : null)}
      </div>

      {items.length > 0 ? (
        <ul className="sui-dropzone__list">
          {items.map((item, index) => (
            <li key={`${item.file.name}-${index}`} className="sui-dropzone__file">
              <span className="sui-dropzone__file-icon" aria-hidden="true">
                <FileIcon />
              </span>
              <span className="sui-dropzone__file-text">
                <span className="sui-dropzone__file-name">{item.file.name}</span>
                <span className="sui-dropzone__file-meta">
                  {item.error ?? formatBytes(item.file.size)}
                </span>
                {item.progress !== undefined && !item.error ? (
                  <Progress size="sm" value={item.progress} className="sui-dropzone__file-bar" />
                ) : null}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${item.file.name}`}
                disabled={disabled}
                onClick={() => commit(items.filter((_, i) => i !== index))}
              >
                <CloseIcon />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
})
