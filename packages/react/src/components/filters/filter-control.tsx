import type { ColumnFilterConfig } from '@shining-ui-kit/core'
import type { Column } from '@tanstack/react-table'
import { useId } from 'react'
import { DateField } from '../../primitives/date-field'
import { Input } from '../../primitives/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select'
import { MultiSelect } from './multi-select'
import { useColumnFilter } from './use-column-filter'

export interface FilterControlProps<TData> {
  column: Column<TData, unknown>
  config: ColumnFilterConfig
  label: string
}

const toInputValue = (value: unknown) =>
  value === undefined || value === null ? '' : String(value)

/**
 * One row of the filter panel: operator picker plus however many value inputs
 * the chosen operator needs.
 *
 * The number of inputs comes from the operator's declared arity, so adding an
 * operator to the core registry makes the UI render correctly with no changes
 * here (§14, §15).
 */
export function FilterControl<TData>({ column, config, label }: FilterControlProps<TData>) {
  const { filter, operators, arity, setOperator, setValue, setRangeValue } = useColumnFilter(
    column,
    config,
  )
  const fieldId = useId()
  const range = Array.isArray(filter.value) ? filter.value : []

  return (
    <div className="sui-filter-row">
      <label className="sui-filter-row__label" htmlFor={fieldId}>
        {config.label ?? label}
      </label>

      <div className="sui-filter-row__controls">
        {operators.length > 1 ? (
          <Select
            value={filter.operator}
            onValueChange={(next) => setOperator(next as typeof filter.operator)}
          >
            <SelectTrigger className="sui-filter-row__operator" aria-label={`${label} condition`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem key={operator.operator} value={operator.operator}>
                  {operator.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {arity === 'none' ? null : arity === 'many' ? (
          <MultiSelect
            label={label}
            options={config.options ?? []}
            value={Array.isArray(filter.value) ? filter.value : []}
            onChange={setValue}
            placeholder={config.placeholder}
          />
        ) : config.type === 'select' ? (
          <Select
            value={filter.value === undefined ? '' : String(filter.value)}
            onValueChange={(next) => setValue(next === '' ? undefined : next)}
          >
            <SelectTrigger id={fieldId} aria-label={`${label} value`}>
              <SelectValue placeholder={config.placeholder ?? 'Any'} />
            </SelectTrigger>
            <SelectContent>
              {(config.options ?? []).map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : arity === 'two' ? (
          <div className="sui-filter-row__range">
            {config.type === 'date' ? (
              <>
                <DateField
                  label={`${label} from`}
                  placeholder="Start date"
                  value={toInputValue(range[0]) || undefined}
                  max={toInputValue(range[1]) || undefined}
                  onChange={(next) => setRangeValue(0, next)}
                />
                <span className="sui-filter-row__range-sep" aria-hidden="true">
                  –
                </span>
                <DateField
                  label={`${label} to`}
                  placeholder="End date"
                  value={toInputValue(range[1]) || undefined}
                  min={toInputValue(range[0]) || undefined}
                  onChange={(next) => setRangeValue(1, next)}
                />
              </>
            ) : (
              <>
                <Input
                  id={fieldId}
                  type="number"
                  value={toInputValue(range[0])}
                  onChange={(event) => setRangeValue(0, event.target.value || undefined)}
                  aria-label={`${label} minimum`}
                  placeholder="Minimum"
                />
                <span className="sui-filter-row__range-sep" aria-hidden="true">
                  –
                </span>
                <Input
                  type="number"
                  value={toInputValue(range[1])}
                  onChange={(event) => setRangeValue(1, event.target.value || undefined)}
                  aria-label={`${label} maximum`}
                  placeholder="Maximum"
                />
              </>
            )}
          </div>
        ) : config.type === 'date' ? (
          <DateField
            label={`${label} value`}
            value={toInputValue(filter.value) || undefined}
            onChange={(next) => setValue(next)}
          />
        ) : (
          <Input
            id={fieldId}
            type={config.type === 'number' ? 'number' : 'text'}
            value={toInputValue(filter.value)}
            onChange={(event) => setValue(event.target.value || undefined)}
            placeholder={config.placeholder ?? 'Value'}
            aria-label={`${label} value`}
          />
        )}
      </div>
    </div>
  )
}
