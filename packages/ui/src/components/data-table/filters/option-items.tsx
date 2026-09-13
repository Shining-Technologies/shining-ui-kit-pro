'use client'

import { Fragment } from 'react'
import type { SelectOption } from '../../../core'
import { SelectGroup, SelectItem, SelectLabel } from '../../form/select'
import { groupOptions } from './values'

/**
 * A select filter's options, with `SelectOption.group` rendered as headings.
 *
 * Each group is a `role="group"` labelled by its heading, so a screen reader
 * announces "Staff" on entering it. Shared by the panel and the inline layout,
 * so an option list reads the same in both.
 */
export function SelectOptionItems({ options }: { options: readonly SelectOption<unknown>[] }) {
  return (
    <>
      {groupOptions(options).map((entry, index) => {
        const items = entry.options.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))
        return entry.group === undefined ? (
          <Fragment key={`options-${index}`}>{items}</Fragment>
        ) : (
          <SelectGroup key={`group-${index}`}>
            <SelectLabel>{entry.group}</SelectLabel>
            {items}
          </SelectGroup>
        )
      })}
    </>
  )
}
