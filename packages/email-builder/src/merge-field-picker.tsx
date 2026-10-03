'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { MergeFieldDefinition } from './design'

export interface MergeFieldPickerProps {
  fields: MergeFieldDefinition[]
  /** Called with the chosen field and the fallback typed for it. */
  onSelect: (field: MergeFieldDefinition, fallback: string) => void
  /** The trigger's text. */
  label?: string
  disabled?: boolean
  className?: string
}

/**
 * A searchable list of merge fields, grouped as the server groups them. Works
 * on its own — next to a subject input with ``insertAtCursor`` — and inside the
 * editor's toolbar.
 */
export function MergeFieldPicker({
  fields,
  onSelect,
  label = 'Insert field',
  disabled,
  className,
}: MergeFieldPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [fallback, setFallback] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const listId = useId()

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return fields.filter(
      (field) => !q || field.label.toLowerCase().includes(q) || field.key.toLowerCase().includes(q),
    )
  }, [fields, query])

  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const onPointer = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  useEffect(() => setActive(0), [query])

  const choose = (field: MergeFieldDefinition | undefined) => {
    if (!field) return
    onSelect(field, fallback)
    setOpen(false)
    setQuery('')
    setFallback('')
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && event.target === search.current) {
      event.preventDefault()
      choose(matches[active])
    }
  }

  const groups = new Map<string, MergeFieldDefinition[]>()
  for (const field of matches) {
    const group = field.group || 'Fields'
    groups.set(group, [...(groups.get(group) ?? []), field])
  }

  return (
    <div
      className={['seb-picker', className].filter(Boolean).join(' ')}
      ref={root}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="seb-tool seb-tool-text"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled || fields.length === 0}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open && (
        <div className="seb-panel seb-picker-panel" role="dialog" aria-label="Merge fields">
          <input
            ref={search}
            className="seb-input"
            type="search"
            placeholder="Search fields"
            aria-label="Search fields"
            aria-controls={listId}
            aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className="seb-picker-list" role="listbox" id={listId} aria-label="Fields">
            {matches.length === 0 && <li className="seb-picker-empty">No fields match</li>}
            {[...groups.entries()].map(([group, items]) => (
              <li key={group} role="presentation">
                <div className="seb-picker-group">{group}</div>
                <ul role="group" aria-label={group}>
                  {items.map((field) => {
                    const index = matches.indexOf(field)
                    return (
                      <li
                        key={field.key}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={index === active}
                        className="seb-picker-option"
                        onMouseEnter={() => setActive(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(field)}
                      >
                        <span>{field.label}</span>
                        <code>{field.key}</code>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <label className="seb-field">
            <span>If empty, show</span>
            <input
              className="seb-input"
              value={fallback}
              placeholder="e.g. there"
              onChange={(event) => setFallback(event.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  )
}
