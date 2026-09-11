import {
  forwardRef,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { CloseIcon } from '../lib/icons'

export interface TagsInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  /** Stop accepting tags past this many. */
  max?: number
  /** Keys that end a tag. Comma and Enter by default. */
  delimiters?: string[]
  /** Reject a tag by returning a message, or `null` to accept it. */
  validate?: (tag: string, existing: string[]) => string | null
  /** Silently drop a tag that is already in the list. On by default. */
  dedupe?: boolean
  disabled?: boolean
  'aria-label'?: string
}

/**
 * A list of short values typed one after another — skills, recipients, labels.
 *
 * Everything a comma-separated text field gets wrong is handled here: a tag is
 * a chip the moment it is finished, removing one is a single click rather than
 * careful text surgery, and pasting `a, b, c` produces three tags instead of
 * one long one.
 */
export const TagsInput = forwardRef<HTMLDivElement, TagsInputProps>(function TagsInput(
  {
    className,
    value,
    onValueChange,
    placeholder = 'Add a tag…',
    max,
    delimiters = [',', 'Enter'],
    validate,
    dedupe = true,
    disabled,
    'aria-label': ariaLabel = 'Tags',
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const [internal, setInternal] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tags = value ?? internal
  const isDisabled = disabled ?? field.disabled
  const full = max !== undefined && tags.length >= max

  function commit(next: string[]) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  function add(raw: string): boolean {
    const tag = raw.trim()
    if (!tag) return false
    if (full) return false
    if (dedupe && tags.includes(tag)) {
      setDraft('')
      return true
    }
    const message = validate?.(tag, tags) ?? null
    if (message) {
      setError(message)
      return false
    }
    setError(null)
    commit([...tags, tag])
    setDraft('')
    return true
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (delimiters.includes(event.key)) {
      event.preventDefault()
      add(draft)
      return
    }
    // Backspace in an empty field removes the tag behind the caret, which is
    // where the caret visually is.
    if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      event.preventDefault()
      commit(tags.slice(0, -1))
      setError(null)
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text')
    if (!/[,\n\t]/.test(text)) return
    event.preventDefault()
    const incoming = text
      .split(/[,\n\t]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
    const next = [...tags]
    for (const tag of incoming) {
      if (max !== undefined && next.length >= max) break
      if (dedupe && next.includes(tag)) continue
      if (validate?.(tag, next)) continue
      next.push(tag)
    }
    commit(next)
    setDraft('')
  }

  return (
    <div className="sui-tags-wrap">
      <div
        ref={ref}
        data-slot="tags-input"
        className={cn('sui-tags', className)}
        data-disabled={isDisabled || undefined}
        aria-invalid={field['aria-invalid']}
        // Clicking the padding around the chips should land in the field.
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault()
            inputRef.current?.focus()
          }
        }}
        {...props}
      >
        <ul className="sui-tags__list" aria-label={ariaLabel}>
          {tags.map((tag, index) => (
            <li key={`${tag}-${index}`} className="sui-tags__chip">
              {tag}
              <button
                type="button"
                className="sui-tags__remove"
                aria-label={`Remove ${tag}`}
                disabled={isDisabled}
                onClick={() => {
                  commit(tags.filter((_, position) => position !== index))
                  inputRef.current?.focus()
                }}
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>

        <input
          ref={inputRef}
          type="text"
          className="sui-tags__input"
          value={draft}
          placeholder={full ? `Limit of ${max} reached` : placeholder}
          disabled={isDisabled || full}
          aria-label={ariaLabel}
          id={field.id}
          aria-describedby={field['aria-describedby']}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          // An unfinished tag is almost always meant to count; committing it on
          // blur is what people expect from every other chip field.
          onBlur={() => add(draft)}
        />
      </div>

      {error ? (
        <p className="sui-tags__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
