'use client'

import { useEffect, useRef, useState } from 'react'
import { useDataTable } from '../context'
import { CloseIcon, SearchIcon } from '../../icons/icons'
import { useDebouncedValue } from '../../../hooks/use-debounced-value'
import type { SearchProps } from '../types/components'

/** Pushed values kept while waiting for the table to report them back. */
const MAX_PENDING = 20

/**
 * The toolbar search box, bound to `globalFilter`.
 *
 * The input keeps its own value so typing stays responsive, and pushes it into
 * the table on a debounce — which in server mode is also what stops every
 * keystroke becoming a request. External changes (Clear filters, a controlled
 * prop, the browser's Back button) flow back in.
 *
 * What it must not do is mistake a late echo of its *own* push for an external
 * change. When `globalFilter` is controlled through the URL — a Next.js
 * `router.replace` — the new prop arrives after a navigation, often after the
 * user has typed more. Values this box pushed are remembered until the table
 * reports them; an incoming value that matches one is an echo, not an edit,
 * and the input keeps what the user is typing.
 */
export function DefaultSearch<TData>({ table }: SearchProps<TData>) {
  const { features } = useDataTable<TData>()
  const external = (table.getState().globalFilter as string | undefined) ?? ''

  const [value, setValue] = useState(external)
  const lastExternal = useRef(external)
  const pending = useRef<string[]>([])

  // Adopt changes that came from outside this input.
  useEffect(() => {
    if (external === lastExternal.current) return
    lastExternal.current = external
    const echo = pending.current.indexOf(external)
    if (echo !== -1) {
      // Our own value coming back; anything pushed before it is superseded.
      pending.current = pending.current.slice(echo + 1)
      return
    }
    pending.current = []
    setValue(external)
  }, [external])

  const debounced = useDebouncedValue(value, features.filtering.debounceMs)

  useEffect(() => {
    const latest = pending.current[pending.current.length - 1] ?? lastExternal.current
    if (debounced === latest) return
    pending.current = [...pending.current, debounced].slice(-MAX_PENDING)
    table.setGlobalFilter(debounced)
  }, [debounced, table])

  return (
    <div className="sui-search">
      <SearchIcon className="sui-search__icon" aria-hidden="true" />
      <input
        type="search"
        className="sui-input sui-search__input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={features.filtering.searchPlaceholder}
        aria-label="Search table"
      />
      {value ? (
        <button
          type="button"
          className="sui-search__clear"
          onClick={() => setValue('')}
          aria-label="Clear search"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  )
}
