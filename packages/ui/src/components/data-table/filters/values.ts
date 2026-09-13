import type { ColumnFilterConfig, SelectOption } from '../../../core'

/** A run of options under one `group` heading; `group` is `undefined` for ungrouped ones. */
export interface OptionGroup<TValue> {
  group: string | undefined
  options: SelectOption<TValue>[]
}

/**
 * Options arranged for rendering with `SelectOption.group` headings.
 *
 * Each named group collects its options where the group first appears, in
 * declared order; ungrouped options stay where they were declared. Options
 * without any group come back as a single ungrouped run.
 */
export function groupOptions<TValue>(options: readonly SelectOption<TValue>[]): OptionGroup<TValue>[] {
  const out: OptionGroup<TValue>[] = []
  const named = new Map<string, OptionGroup<TValue>>()
  for (const option of options) {
    const name = option.group
    if (name === undefined || name === '') {
      const last = out[out.length - 1]
      if (last && last.group === undefined) last.options.push(option)
      else out.push({ group: undefined, options: [option] })
      continue
    }
    let entry = named.get(name)
    if (!entry) {
      entry = { group: name, options: [] }
      named.set(name, entry)
      out.push(entry)
    }
    entry.options.push(option)
  }
  return out
}

/*
 * Filter values written by the filter UI.
 *
 * Both filter layouts use these, so the same user action stores the same
 * value — and therefore produces the same query, URL and server result —
 * whether filters live in the panel or inline. V1's panel stored a numeric
 * option as the string "2" and a number range as strings, while the inline
 * bar stored numbers.
 */

/** Map a select's string value back to the option's own value (numbers, booleans). */
export function optionValue(raw: string, config: ColumnFilterConfig): unknown {
  if (config.type === 'boolean') return raw === 'true'
  const match = config.options?.find((option) => String(option.value) === raw)
  return match ? match.value : raw
}

/** A number input's text as a filter value: blank means "no value". */
export function numberInputValue(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}
