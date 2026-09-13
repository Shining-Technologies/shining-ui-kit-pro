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
import { useFieldControl } from './field-context'
import { CloseIcon, ImageIcon } from '../icons/icons'
import { useControllableState } from '../../hooks/use-controllable-state'
import { accepts, fileLimit, hasContent, useFormFiles } from './file-upload'
import { formatBytes } from './format-bytes'

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
  /** Controlled items when defined; `[]` is the empty list. */
  value?: ImageItem[]
  onValueChange?: (items: ImageItem[]) => void
  /** Called with the files that were added to the list. */
  onFilesAccepted?: (files: File[]) => void
  onFileRejected?: (file: File, reason: 'size' | 'type' | 'count') => void
  /** Narrow the picker further — `'image/png,image/jpeg'`. */
  accept?: string
  multiple?: boolean
  maxSize?: number
  /** Reject beyond this many images. Without `multiple` the field holds one image whatever this says. */
  maxFiles?: number
  /** Round tiles, for a profile picture. */
  shape?: 'square' | 'circle'
  disabled?: boolean
  /**
   * Announce the field as required and, while there are no images, block a
   * native form submission. Taken from a surrounding `Field` when unset.
   */
  required?: boolean
  /** Replaces the hint under the grid. Linked to the file input with `aria-describedby`. */
  hint?: ReactNode
  children?: ReactNode
  /**
   * Submitted with a native `<form>`: the new files (not remote `url` items)
   * are mirrored into a file input of this name.
   */
  name?: string
}

/**
 * Object URLs minted by any `ImageUpload`, across instances.
 *
 * Only these are ever revoked — a remote `url`, or an object URL the caller
 * made, is not ours to kill. Module-wide rather than per instance so that an
 * instance remounted over items an earlier one created (a wizard step coming
 * back) can still revoke them when they are removed.
 */
const MINTED = new Set<string>()

function revokeMinted(url: string) {
  if (!MINTED.delete(url)) return
  URL.revokeObjectURL(url)
}

const NONE: ImageItem[] = []

/**
 * Images, with the picture shown rather than the filename.
 *
 * `screenshot-2024-11-03-final-v2.png` tells nobody which screenshot it is, so
 * a file list is the wrong shape for images: this is a grid of the images
 * themselves, each removable, with the add tile last.
 *
 * Previews are object URLs made here and revoked when the item leaves the
 * value — a preview built with `FileReader` holds the whole image in memory as
 * base64 for as long as the page lives, which is how an upload form quietly
 * costs 200 MB. On unmount they are revoked only when the field is
 * uncontrolled: a controlled parent keeps its items, and they must still show
 * when the component is mounted again. A parent that discards such items for
 * good releases them with `URL.revokeObjectURL(item.url)`.
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
    disabled: disabledProp = false,
    required,
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
  const [dragging, setDragging] = useState(false)
  const [items, commit] = useControllableState<ImageItem[]>({
    value,
    defaultValue: NONE,
    onChange: onValueChange,
  })

  // The minted URLs among the items on screen, and whether the component is
  // controlled — both read when it unmounts.
  const shown = useRef(new Set<string>())
  const controlled = useRef(value !== undefined)
  controlled.current = value !== undefined

  // An object URL goes when its item leaves the value — however it left: the
  // remove button, or a parent that replaced the list. Revoking on the value
  // actually shown rather than on the list emitted means a controlled parent
  // that refuses a removal is not left with a dead thumbnail.
  useEffect(() => {
    const present = new Set(items.map((item) => item.url))
    for (const url of shown.current) {
      if (!present.has(url)) revokeMinted(url)
    }
    shown.current = new Set([...present].filter((url) => MINTED.has(url)))
  }, [items])

  // On unmount only an uncontrolled field takes its URLs with it: its items
  // die with it. A controlled parent still holds its items — a wizard step,
  // a tab — and the thumbnails must work when the component comes back.
  useEffect(
    () => () => {
      if (!controlled.current) shown.current.forEach(revokeMinted)
    },
    [],
  )

  const add = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return
      const accepted: File[] = []
      const limit = fileLimit(multiple, maxFiles)

      for (const file of Array.from(incoming)) {
        // Images only, and then whatever narrower list `accept` names — the
        // picker honours it, but a drop does not go through the picker.
        if (!file.type.startsWith('image/') || !accepts(file, accept)) {
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
        MINTED.add(url)
        return { file, url, name: file.name, size: file.size }
      })
      commit(multiple ? [...items, ...created] : created)
      onFilesAccepted?.(accepted)
    },
    [accept, commit, disabled, items, maxFiles, maxSize, multiple, onFileRejected, onFilesAccepted],
  )

  const files = useMemo(() => items.flatMap((item) => (item.file ? [item.file] : [])), [items])
  const formRef = useFormFiles(files)

  const full = multiple ? maxFiles !== undefined && items.length >= maxFiles : items.length > 0

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

        {/* The add tile stays in the document when the grid is full, hidden and
            disabled: its input is what carries the field's id, description and
            invalid state, and a `<label for>` must not point at nothing. */}
        <div className="sui-images__tile sui-images__add" hidden={full || undefined}>
          <input
            id={inputId}
            type="file"
            className="sui-dropzone__input"
            accept={accept}
            multiple={multiple}
            disabled={disabled || full}
            // Required only while empty: the picker is cleared after every pick.
            required={(isRequired && items.length === 0) || undefined}
            aria-describedby={describedBy}
            aria-invalid={field['aria-invalid']}
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

      {customHint ? (
        <div id={hintId} className="sui-dropzone__hint-slot">
          {hint}
        </div>
      ) : defaultHint ? (
        <p id={hintId} className="sui-dropzone__hint">
          {multiple && maxFiles ? `Up to ${maxFiles} images, ` : ''}
          {formatBytes(maxSize ?? 0)} each
        </p>
      ) : null}
    </div>
  )
})
