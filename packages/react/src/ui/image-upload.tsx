import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { CloseIcon, ImageIcon } from '../lib/icons'
import { formatBytes } from './file-upload'

export interface ImageItem {
  /** Absent for an image that is already on the server. */
  file?: File
  /** Where the thumbnail comes from: an object URL, or a remote URL. */
  url: string
  name?: string
  size?: number
  /** 0–100 while uploading. */
  progress?: number
  error?: string
}

export interface ImageUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: ImageItem[]
  onValueChange?: (items: ImageItem[]) => void
  /** Called with whatever survived validation. */
  onFilesAccepted?: (files: File[]) => void
  onFileRejected?: (file: File, reason: 'size' | 'type' | 'count') => void
  /** Narrow the picker further — `'image/png,image/jpeg'`. */
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  /** Round tiles, for a profile picture. */
  shape?: 'square' | 'circle'
  disabled?: boolean
  hint?: ReactNode
  children?: ReactNode
}

/**
 * Images, with the picture shown rather than the filename.
 *
 * `screenshot-2024-11-03-final-v2.png` tells nobody which screenshot it is, so
 * a file list is the wrong shape for images: this is a grid of the images
 * themselves, each removable, with the add tile last.
 *
 * Previews are object URLs made here and revoked when the item goes — a preview
 * built with `FileReader` holds the whole image in memory as base64 for as long
 * as the page lives, which is how an upload form quietly costs 200 MB.
 */
export const ImageUpload = forwardRef<HTMLDivElement, ImageUploadProps>(function ImageUpload(
  {
    className,
    value,
    onValueChange,
    onFilesAccepted,
    onFileRejected,
    accept = 'image/*',
    multiple = true,
    maxSize,
    maxFiles,
    shape = 'square',
    disabled = false,
    hint,
    children,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const generatedId = useId()
  const inputId = field.id ?? generatedId
  const [dragging, setDragging] = useState(false)
  const [internal, setInternal] = useState<ImageItem[]>([])
  const items = value ?? internal
  // Only the URLs this component minted may be revoked; a remote one must not be.
  const owned = useRef(new Set<string>())

  useEffect(() => {
    const urls = owned.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const commit = useCallback(
    (next: ImageItem[]) => {
      // Anything dropped from the list takes its object URL with it.
      const kept = new Set(next.map((item) => item.url))
      for (const url of owned.current) {
        if (!kept.has(url)) {
          URL.revokeObjectURL(url)
          owned.current.delete(url)
        }
      }
      if (value === undefined) setInternal(next)
      onValueChange?.(next)
    },
    [onValueChange, value],
  )

  const add = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return
      const accepted: File[] = []
      const limit = maxFiles ?? (multiple ? Infinity : 1)

      for (const file of Array.from(incoming)) {
        if (!file.type.startsWith('image/')) {
          onFileRejected?.(file, 'type')
          continue
        }
        if (maxSize !== undefined && file.size > maxSize) {
          onFileRejected?.(file, 'size')
          continue
        }
        if ((multiple ? items.length : 0) + accepted.length >= limit) {
          onFileRejected?.(file, 'count')
          continue
        }
        accepted.push(file)
      }

      if (accepted.length === 0) return
      const created = accepted.map((file) => {
        const url = URL.createObjectURL(file)
        owned.current.add(url)
        return { file, url, name: file.name, size: file.size }
      })
      commit(multiple ? [...items, ...created] : created)
      onFilesAccepted?.(accepted)
    },
    [commit, disabled, items, maxFiles, maxSize, multiple, onFileRejected, onFilesAccepted],
  )

  const full = maxFiles !== undefined && items.length >= maxFiles
  const showAdd = multiple ? !full : items.length === 0

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    add(event.dataTransfer.files)
  }

  return (
    <div
      ref={ref}
      data-slot="image-upload"
      className={cn('sui-images', className)}
      data-shape={shape}
      data-disabled={disabled || undefined}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      {...props}
    >
      <div className={cn('sui-images__grid', dragging && 'sui-images__grid--over')}>
        {items.map((item, index) => (
          <figure key={item.url} className="sui-images__tile" data-error={item.error || undefined}>
            <img
              src={item.url}
              alt={item.name ?? `Image ${index + 1}`}
              className="sui-images__img"
            />

            {item.progress !== undefined && !item.error ? (
              <span className="sui-images__progress" aria-hidden="true">
                <span style={{ width: `${item.progress}%` }} />
              </span>
            ) : null}

            <figcaption className="sui-images__caption">
              {item.error ?? (item.size !== undefined ? formatBytes(item.size) : item.name)}
            </figcaption>

            <button
              type="button"
              className="sui-images__remove"
              aria-label={`Remove ${item.name ?? `image ${index + 1}`}`}
              disabled={disabled}
              onClick={() => commit(items.filter((_, position) => position !== index))}
            >
              <CloseIcon />
            </button>
          </figure>
        ))}

        {showAdd ? (
          <div className="sui-images__tile sui-images__add">
            <input
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
            <label htmlFor={inputId} className="sui-images__add-label">
              <ImageIcon aria-hidden="true" />
              <span>{children ?? (items.length ? 'Add more' : 'Add images')}</span>
            </label>
          </div>
        ) : null}
      </div>

      {hint ??
        (maxSize ? (
          <p className="sui-dropzone__hint">
            {multiple && maxFiles ? `Up to ${maxFiles} images, ` : ''}
            {formatBytes(maxSize)} each
          </p>
        ) : null)}
    </div>
  )
})
