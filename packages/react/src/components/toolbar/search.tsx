import { useEffect, useRef, useState } from 'react'
import { useDataTable } from '../../context/table-context'
import { CloseIcon, SearchIcon } from '../../lib/icons'
import { useDebouncedValue } from '../../lib/use-debounced-value'
import type { SearchProps } from '../../types/components'

/**
 * The toolbar search box, bound to `globalFilter`.
 *
 * The input keeps its own value so typing stays responsive, and pushes into the
 * table on a debounce — which in server mode is also what stops every keystroke
 * becoming a request. External changes (Clear filters, a controlled prop) flow
 * back in.
 */
export function DefaultSearch<TData>({ table }: SearchProps<TData>) {
  const { features } = useDataTable<TData>()
  const external = (table.getState().globalFilter as string | undefined) ?? ''

  const [value, setValue] = useState(external)
  const lastSynced = useRef(external)

  // Adopt changes that came from outside this input.
  useEffect(() => {
    if (external === lastSynced.current) return
    lastSynced.current = external
    setValue(external)
  }, [external])

  const debounced = useDebouncedValue(value, features.filtering.debounceMs)

  useEffect(() => {
    if (debounced === lastSynced.current) return
    lastSynced.current = debounced
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
