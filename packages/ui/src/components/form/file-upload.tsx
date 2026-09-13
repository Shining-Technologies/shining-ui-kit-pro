'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
import { CloseIcon, FileIcon, UploadIcon } from '../icons/icons'
import { Button } from '../button/button'
import { useFieldControl } from './field-context'
import { useControllableState } from '../../hooks/use-controllable-state'
import { Progress } from '../feedback/progress'
import { formatBytes } from './format-bytes'

const NO_ITEMS: UploadItem[] = []

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
  /** Reject beyond this many files. Without `multiple` the picker holds one file whatever this says. */
  maxFiles?: number
  disabled?: boolean
  /**
   * Announce the field as required and, while nothing is selected, block a
   * native form submission. Taken from a surrounding `Field` when unset.
   */
  required?: boolean
  /** The selection. Controlled when defined (the caller keeps the list); `[]` is empty. */
  value?: UploadItem[]
  onValueChange?: (items: UploadItem[]) => void
  /** Called with the files that were added to the selection. */
  onFilesAccepted?: (files: File[]) => void
  /** Called for each rejection, so the app decides how loudly to complain. */
  onFileRejected?: (file: File, reason: 'size' | 'type' | 'count') => void
  /** Replaces the wording inside the drop zone. */
  children?: ReactNode
  /** Replaces the hint under the wording. Linked to the file input with `aria-describedby`. */
  hint?: ReactNode
  /**
   * Submitted with a native `<form>` (a server action, a plain POST): the
   * selection is mirrored into a file input of this name. Needs a browser
   * with a constructible `DataTransfer`, which is every current one.
   */
  name?: string
}

/**
 * Keep a named, hidden `<input type="file">` holding the selection.
 *
 * The visible picker is emptied after every pick (so the same file can be
 * chosen twice), which means it never carries anything into a form. This
 * input does: `DataTransfer` is the one way to put files into an input.
 */
export function useFormFiles(files: File[]) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const input = ref.current
    if (!input || typeof DataTransfer === 'undefined') return
    try {
      const transfer = new DataTransfer()
      for (const file of files) transfer.items.add(file)
      input.files = transfer.files
    } catch {
      // An engine without a writable `files` simply submits nothing.
    }
  }, [files])
  return ref
}

export function accepts(file: File, accept?: string): boolean {
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
 * How many files a picker may hold. A single-file picker holds one, whatever
 * `maxFiles` says: anything past the first in the same drop is refused as a
 * count rather than accepted and then silently discarded.
 */
export function fileLimit(multiple: boolean, maxFiles: number | undefined): number {
  return multiple ? (maxFiles ?? Infinity) : Math.min(maxFiles ?? 1, 1)
}

/** Whether a `hint` prop is content to show, as opposed to "use the default". */
export function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== ''
}

/**
 * A drop zone with a file list.
 *
 * The hidden `<input type="file">` stays the real control — the styled area is
 * a label for it — so keyboard users and the OS file picker work without a
 * line of extra code. A native form reset does not clear the selection: it
 * lives in React state, so reset it there.
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
    disabled: disabledProp = false,
    required,
    value,
    onValueChange,
    onFilesAccepted,
    onFileRejected,
    hint,
    children,
    name,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const disabled = disabledProp || Boolean(field.disabled)
  const isRequired = required ?? Boolean(field.required)
  const generatedId = useId()
  const hintId = useId()
  const inputId = field.id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [items, commit] = useControllableState<UploadItem[]>({
    value,
    defaultValue: NO_ITEMS,
    onChange: onValueChange,
  })

  const add = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return
      const accepted: File[] = []
      const limit = fileLimit(multiple, maxFiles)

      for (const file of Array.from(incoming)) {
        if (!accepts(file, accept)) {
          onFileRejected?.(file, 'type')
          continue
        }
        if (maxSize !== undefined && file.size > maxSize) {
          onFileRejected?.(file, 'size')
          continue
        }
        // A single-file picker replaces its file rather than refusing the new one.
        const total = (multiple ? items.length : 0) + accepted.length
        if (total >= limit) {
          onFileRejected?.(file, 'count')
          continue
        }
        accepted.push(file)
      }

      if (accepted.length === 0) return
      commit([...(multiple ? items : NO_ITEMS), ...accepted.map((file) => ({ file }))])
      onFilesAccepted?.(accepted)
    },
    [accept, commit, disabled, items, maxFiles, maxSize, multiple, onFileRejected, onFilesAccepted],
  )

  const files = useMemo(() => items.map((item) => item.file), [items])
  const formRef = useFormFiles(files)

  const customHint = hasContent(hint)
  const defaultHint = hint == null && Boolean(maxSize)
  const describedBy =
    [field['aria-describedby'], customHint || defaultHint ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined

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
          // Required only while empty: the picker is cleared after every pick,
          // so a standing `required` would block a form that has its files.
          required={(isRequired && items.length === 0) || undefined}
          aria-describedby={describedBy}
          aria-invalid={field['aria-invalid']}
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
        {customHint ? (
          <span id={hintId} className="sui-dropzone__hint-slot">
            {hint}
          </span>
        ) : defaultHint ? (
          <span id={hintId} className="sui-dropzone__hint">
            Up to {formatBytes(maxSize ?? 0)}
          </span>
        ) : null}
      </div>

      {name ? (
        <input
          ref={formRef}
          type="file"
          name={name}
          multiple={multiple}
          disabled={disabled}
          hidden
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : null}

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
