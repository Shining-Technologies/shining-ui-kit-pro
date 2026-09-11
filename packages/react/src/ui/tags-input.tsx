import {
  forwardRef,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl, useFieldLabelId } from '../lib/field-context'
import { CloseIcon } from '../lib/icons'
import { useControllableState } from '../lib/use-controllable-state'

export interface TagsInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Controlled tags when defined; `[]` is the empty list. */
  value?: string[]
  /** Initial tags while uncontrolled. */
  defaultValue?: string[]
  /**
   * Submitted with a native `<form>`: one hidden input per tag under this
   * name, so the server reads them with `formData.getAll(name)`.
   */
  name?: string
  onValueChange?: (value: string[]) => void
  placeholder?: string
  /** Stop accepting tags past this many. */
  max?: number
  /**
   * Keys that end a tag, as `KeyboardEvent.key` values — comma and Enter by
   * default. The same characters split a pasted list (Enter and Tab as a line
   * break and a tab); a line break in pasted text always splits.
   */
  delimiters?: string[]
  /** Reject a tag by returning a message, or `null` to accept it. */
  validate?: (tag: string, existing: string[]) => string | null
  /** Silently drop a tag that is already in the list. On by default. */
  dedupe?: boolean
  disabled?: boolean
  'aria-label'?: string
}

const NONE: string[] = []

/** Keys that stand for a character when the text arrives by paste instead. */
const KEY_CHARACTERS: Record<string, string> = { Enter: '\n', Tab: '\t' }

/**
 * What splits a pasted list: the characters among `delimiters` (Enter and Tab
 * as a newline and a tab), plus a line break always — a column copied from a
 * spreadsheet is one value per line whatever the field's delimiters are.
 */
function pasteSplitter(delimiters: string[]): RegExp {
  const characters = delimiters
    .map((key) => KEY_CHARACTERS[key] ?? key)
    .filter((key) => key.length === 1 && key !== '\n')
    .map((key) => key.replace(/[\\\]^-]/g, '\\$&'))
  return new RegExp(`\\r?\\n|[${characters.join('')}]`.replace('|[]', ''))
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
    defaultValue,
    name,
    onValueChange,
    placeholder = 'Add a tag…',
    max,
    delimiters = [',', 'Enter'],
    validate,
    dedupe = true,
    disabled,
    'aria-label': ariaLabelProp,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  const errorId = useId()
  const ariaLabel = ariaLabelProp ?? 'Tags'
  const [tags, commit] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? NONE,
    onChange: onValueChange,
  })
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDisabled = disabled ?? field.disabled
  const full = max !== undefined && tags.length >= max

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
    // Enter that confirms an IME composition (Japanese, Chinese) is not the
    // end of a tag — committing there would cut the word in half.
    if (event.nativeEvent.isComposing) return
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
    const pasted = event.clipboardData.getData('text')
    const splitter = pasteSplitter(delimiters)
    if (!splitter.test(pasted)) return
    event.preventDefault()
    // The paste lands where the caret is, so whatever was already typed in the
    // box is part of the list rather than thrown away.
    const input = event.currentTarget
    const from = input.selectionStart ?? draft.length
    const to = input.selectionEnd ?? draft.length
    const text = draft.slice(0, from) + pasted + draft.slice(to)
    const incoming = text
      .split(splitter)
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
        <ul
          className="sui-tags__list"
          aria-label={labelId && !ariaLabelProp ? undefined : ariaLabel}
          aria-labelledby={labelId && !ariaLabelProp ? labelId : undefined}
        >
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
          // A surrounding `<Field>` names the input through `<label for>`; an
          // aria-label here would override it with the generic default.
          aria-label={labelId && !ariaLabelProp ? undefined : ariaLabel}
          id={field.id}
          aria-describedby={
            [field['aria-describedby'], error ? errorId : null].filter(Boolean).join(' ') ||
            undefined
          }
          aria-invalid={field['aria-invalid'] ?? (error ? true : undefined)}
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

      {name
        ? tags.map((tag, index) => (
            <input
              key={`${tag}-${index}`}
              type="hidden"
              name={name}
              value={tag}
              disabled={isDisabled}
            />
          ))
        : null}

      {error ? (
        <p id={errorId} className="sui-tags__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
