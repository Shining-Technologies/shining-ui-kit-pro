import {
  FILTER_OPERATORS,
  getOperatorArity,
  type ColumnFilterConfig,
  type FilterOperator,
} from '@shining-ui-kit/core'
import type { Column } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useDataTable } from '../../context/table-context'
import { CalendarIcon, CloseIcon } from '../../lib/icons'
import { DATE_RANGE_PRESETS, fromIso } from '../../primitives/calendar'
import { DateField } from '../../primitives/date-field'
import { Button } from '../../primitives/button'
import { Input } from '../../primitives/input'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select'
import type { FiltersProps } from '../../types/components'
import { filterableColumns } from '../filters/filterable'
import { MultiSelect } from '../filters/multi-select'
import { useColumnFilter } from '../filters/use-column-filter'

/**
 * The inline filter bar.
 *
 * Every filter is its own control, laid out flat across the toolbar, so the
 * current query is legible at a glance instead of hidden behind a button. Each
 * control states its own field name (`Role: Admin`), which is what lets several
 * of them sit side by side without a legend.
 *
 * It writes through exactly the same `useColumnFilter` handle as the panel
 * layout — the two are alternative faces of one filtering engine, never two
 * implementations of filtering (§14).
 */
export function InlineFilters<TData>({ table }: FiltersProps<TData>) {
  const { filterConfigs, columnLabels, features } = useDataTable<TData>()
  const globalSearch = features.filtering.globalSearch

  const filterable = useMemo(
    () =>
      filterableColumns(table, filterConfigs).filter(({ column, config }) => {
        // One search box, not two. A plain text filter on a column the search
        // box already covers is the same control twice — and the two of them
        // sitting side by side, identical, is the confusing part.
        if (!globalSearch || config.type !== 'text') return true
        const restricted = config.operators !== undefined || config.defaultOperator !== undefined
        return restricted || !column.getCanGlobalFilter()
      }),
    [filterConfigs, globalSearch, table],
  )

  if (filterable.length === 0) return null

  return (
    <div className="sui-inline-filters" role="group" aria-label="Filters">
      {filterable.map(({ column, config }) => (
        <InlineFilter
          key={column.id}
          column={column}
          config={config}
          label={config.label ?? columnLabels.get(column.id) ?? column.id}
        />
      ))}
    </div>
  )
}

interface InlineFilterProps<TData> {
  column: Column<TData, unknown>
  config: ColumnFilterConfig
  label: string
}

/** Empty string is a legal filter value in a `<Select>`; this is "no filter". */
const ANY = '__sui_any__'

/**
 * One inline control, plus the way out of it.
 *
 * An applied filter that can only be undone by finding the right option again
 * — "All", "Any", the empty entry — is a trap; every active control grows a
 * clear button beside it, and the toolbar's "Clear filters" resets the lot.
 */
function InlineFilter<TData>({ column, config, label }: InlineFilterProps<TData>) {
  const { filter, isActive, setValue, clear } = useColumnFilter(column, config)
  const range = Array.isArray(filter.value) ? filter.value : []

  /*
   * Inline, a number or a date means a range unless the column says otherwise.
   * "Amount equals 80" is almost never the question; "between 80 and 200" is —
   * and a column that does want a single value says so with `defaultOperator`,
   * which is respected here and everywhere else.
   */
  const ranged = config.type === 'number' || config.type === 'date'
  const operator: FilterOperator = isActive
    ? filter.operator
    : (config.defaultOperator ?? (ranged ? 'between' : filter.operator))
  const arity = getOperatorArity(config.type, operator)

  return (
    <span className="sui-inline-filter" data-active={isActive || undefined}>
      {control()}
      {isActive ? (
        <button
          type="button"
          className="sui-inline-filter__reset"
          onClick={clear}
          aria-label={`Clear ${label} filter`}
        >
          <CloseIcon aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )

  function control() {
    if (config.type === 'multiSelect') {
      const selected = Array.isArray(filter.value) ? (filter.value as unknown[]) : []
      return (
        <MultiSelect
          label={label}
          options={config.options ?? []}
          value={selected}
          onChange={(next) => setValue((next as unknown[]).length === 0 ? undefined : next)}
          placeholder={config.placeholder}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="sui-inline-filter__trigger"
              data-active={isActive || undefined}
              aria-label={`${label} filter`}
            >
              <span className="sui-inline-filter__name">{label}</span>
              <span className="sui-inline-filter__value">
                {summarize(selected, config, config.placeholder ?? 'Any')}
              </span>
            </Button>
          }
        />
      )
    }

    if (config.type === 'boolean') {
      // A boolean filter has no value: `isTrue` / `isFalse` are the whole filter,
      // so the picker writes an operator and leaves `value` undefined.
      const current = !isActive ? ANY : filter.operator === 'isFalse' ? 'isFalse' : 'isTrue'
      return (
        <Select
          value={current}
          onValueChange={(next) =>
            next === ANY ? clear() : column.setFilterValue({ operator: next, value: undefined })
          }
        >
          <SelectTrigger
            className="sui-inline-filter__trigger"
            data-active={isActive || undefined}
            aria-label={`${label} filter`}
          >
            <span className="sui-inline-filter__name">{label}</span>
            <SelectValue placeholder={config.placeholder ?? 'Any'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{config.placeholder ?? 'Any'}</SelectItem>
            <SelectItem value="isTrue">Yes</SelectItem>
            <SelectItem value="isFalse">No</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (config.type === 'select') {
      const options = (config.options ?? []).map((option) => ({
        label: option.label,
        value: String(option.value),
      }))
      const current =
        filter.value === undefined || filter.value === null ? ANY : String(filter.value)
      return (
        <Select
          value={current}
          onValueChange={(next) => (next === ANY ? clear() : setValue(coerce(next, config)))}
        >
          <SelectTrigger
            className="sui-inline-filter__trigger"
            data-active={isActive || undefined}
            aria-label={`${label} filter`}
          >
            <span className="sui-inline-filter__name">{label}</span>
            <SelectValue placeholder={config.placeholder ?? 'Any'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{config.placeholder ?? 'Any'}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (config.type === 'date' || config.type === 'number') {
      const isDate = config.type === 'date'
      const single = arity === 'one'
      const summary = single
        ? (describe(filter.value, isDate) ?? 'Any')
        : rangeSummary(range[0], range[1], isDate)

      // A single-value operator gets one field; anything two-ended gets the
      // range panel, where the presets are the answer most of the time.
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="sui-inline-filter__trigger"
              data-active={isActive || undefined}
              aria-label={`${label} filter`}
            >
              {isDate ? <CalendarIcon aria-hidden="true" /> : null}
              <span className="sui-inline-filter__name">{label}</span>
              <span className="sui-inline-filter__value">{summary}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="sui-range-panel" align="start">
            <p className="sui-range-panel__title">{label}</p>

            {isDate && !single ? (
              <div className="sui-range-panel__presets">
                {DATE_RANGE_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    className="sui-range-panel__preset"
                    onClick={() => {
                      const [from, to] = preset.range()
                      column.setFilterValue({ operator: 'between', value: [from, to] })
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : null}

            {single ? (
              <label className="sui-range-panel__field">
                <span className="sui-range-panel__label">{operatorLabel(filter.operator)}</span>
                {isDate ? (
                  <DateField
                    label={label}
                    placeholder="Pick a date"
                    value={toText(filter.value) || undefined}
                    onChange={(next) => setSingle(next)}
                  />
                ) : (
                  <Input
                    type="number"
                    value={toText(filter.value)}
                    onChange={(event) => setSingle(event.target.value || undefined)}
                    aria-label={label}
                    placeholder="Value"
                  />
                )}
              </label>
            ) : (
              <>
                <label className="sui-range-panel__field">
                  <span className="sui-range-panel__label">{isDate ? 'From' : 'Minimum'}</span>
                  {isDate ? (
                    <DateField
                      label={`${label} from`}
                      placeholder="Start date"
                      value={toText(range[0]) || undefined}
                      max={toText(range[1]) || undefined}
                      onChange={(next) => setRange(0, next ?? '')}
                    />
                  ) : (
                    <Input
                      type="number"
                      value={toText(range[0])}
                      onChange={(event) => setRange(0, event.target.value)}
                      aria-label={`${label} minimum`}
                      placeholder="No minimum"
                    />
                  )}
                </label>

                <label className="sui-range-panel__field">
                  <span className="sui-range-panel__label">{isDate ? 'To' : 'Maximum'}</span>
                  {isDate ? (
                    <DateField
                      label={`${label} to`}
                      placeholder="End date"
                      value={toText(range[1]) || undefined}
                      min={toText(range[0]) || undefined}
                      onChange={(next) => setRange(1, next ?? '')}
                    />
                  ) : (
                    <Input
                      type="number"
                      value={toText(range[1])}
                      onChange={(event) => setRange(1, event.target.value)}
                      aria-label={`${label} maximum`}
                      placeholder="No maximum"
                    />
                  )}
                </label>
              </>
            )}

            <div className="sui-range-panel__foot">
              <button
                type="button"
                className="sui-link"
                onClick={clear}
                disabled={!isActive}
                aria-label={`Clear ${label} filter`}
              >
                Clear
              </button>
              <span className="sui-range-panel__hint">
                {isDate ? 'Open a field to pick a date' : 'Leave either end empty for open-ended'}
              </span>
            </div>
          </PopoverContent>
        </Popover>
      )
    }

    return (
      <Input
        className="sui-inline-filter__input"
        data-active={isActive || undefined}
        value={toText(filter.value)}
        onChange={(event) => setValue(event.target.value || undefined)}
        placeholder={config.placeholder ?? label}
        aria-label={`${label} filter`}
      />
    )
  }

  function setSingle(raw: string | undefined) {
    if (raw === undefined || raw === '') {
      clear()
      return
    }
    column.setFilterValue({ operator, value: config.type === 'number' ? Number(raw) : raw })
  }

  function setRange(index: 0 | 1, raw: string) {
    const value = raw === '' ? undefined : config.type === 'number' ? Number(raw) : raw
    const other = range[index === 0 ? 1 : 0]
    // Clearing both ends clears the filter, rather than leaving `[,]` behind
    // to render an active-looking control that narrows nothing.
    if (value === undefined && (other === undefined || other === '')) {
      clear()
      return
    }
    // The operator is stated, not inherited: an inline range always means
    // `between`, whatever the column's default operator happens to be.
    const next: unknown[] = [range[0], range[1]]
    next[index] = value
    column.setFilterValue({ operator: 'between', value: next })
  }
}

function toText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

/** A value as it should read on a closed trigger. */
function describe(value: unknown, isDate: boolean): string | undefined {
  const text = toText(value)
  if (!text) return undefined
  if (!isDate) return text
  const date = fromIso(text)
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date) : text
}

function rangeSummary(from: unknown, to: unknown, isDate: boolean): string {
  const start = describe(from, isDate)
  const end = describe(to, isDate)
  if (start && end) return `${start} – ${end}`
  if (start) return `from ${start}`
  if (end) return `to ${end}`
  return 'Any'
}

/** The operator's own words, so a single-value panel says what it will do. */
function operatorLabel(operator: string): string {
  const found = FILTER_OPERATORS.date.find((entry) => entry.operator === operator)
  return found?.label ?? 'Value'
}

/** Match the raw select value back to the option's own type (numbers, booleans). */
function coerce(raw: string, config: ColumnFilterConfig): unknown {
  if (config.type === 'boolean') return raw === 'true'
  const match = config.options?.find((option) => String(option.value) === raw)
  return match ? match.value : raw
}

function summarize(selected: unknown[], config: ColumnFilterConfig, empty: string): string {
  if (selected.length === 0) return empty
  if (selected.length === 1) {
    const match = config.options?.find((option) => String(option.value) === String(selected[0]))
    return match?.label ?? String(selected[0])
  }
  if (config.options && selected.length === config.options.length) return 'All'
  return `${selected.length} selected`
}
