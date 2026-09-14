# API reference: utility hooks

Three general-purpose hooks the components are built on, exported from the root entry for
building your own components with the same behaviour.

```ts
import { useControllableState, useDebouncedValue, useEventCallback } from '@shining-technologies/ui'
```

All three are defined in `'use client'` modules: call them from Client Components only.

## Contents

- [`useControllableState`](#usecontrollablestate)
- [`useDebouncedValue`](#usedebouncedvalue)
- [`useEventCallback`](#useeventcallback)
- [Types](#types)

---

## `useControllableState`

```ts
function useControllableState<T>(options: ControllableStateOptions<T>): [T, (updater: Updater<T>) => void]
```

One implementation of the controlled/uncontrolled pattern, the one every stateful component and
every `DataTable` state slice uses.

| Option         | Type                  | Description                                                   |
| -------------- | --------------------- | ------------------------------------------------------------- |
| `value`        | `T \| undefined`      | When not `undefined`, the state is controlled by the parent.   |
| `defaultValue` | `T`                   | The initial value while uncontrolled.                          |
| `onChange`     | `(value: T) => void`  | Called on every change, controlled or not.                     |

Behaviour:

- The setter accepts a value or an updater function, like React's `setState`.
- Setting a value that is `Object.is`-equal to the current one does nothing and does not call
  `onChange`.
- In controlled mode the internal store is not written, so the parent stays the single source of
  truth; the returned value is always `value`.
- The setter keeps its identity across renders, so it is safe in dependency arrays and memoised
  children.

```tsx
'use client'
import { useControllableState } from '@shining-technologies/ui'

interface ToggleProps {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

export function Toggle({ pressed, defaultPressed = false, onPressedChange }: ToggleProps) {
  const [on, setOn] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })
  return (
    <button type="button" aria-pressed={on} onClick={() => setOn((previous) => !previous)}>
      {on ? 'On' : 'Off'}
    </button>
  )
}
```

## `useDebouncedValue`

```ts
function useDebouncedValue<T>(value: T, delayMs: number): T
```

Returns `value` once it has stopped changing for `delayMs` milliseconds. The data table's search
box uses it so typing does not re-filter, or re-fetch in server mode, on every keystroke.

A `delayMs` of `0` or less returns `value` immediately, with no timer, which keeps tests
synchronous.

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Input, useDebouncedValue } from '@shining-technologies/ui'

export function CustomerSearch({ onSearch }: { onSearch: (term: string) => void }) {
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term, 300)

  useEffect(() => {
    onSearch(debounced)
  }, [debounced, onSearch])

  return <Input value={term} onChange={(event) => setTerm(event.target.value)} aria-label="Search customers" />
}
```

## `useEventCallback`

```ts
function useEventCallback<TArgs extends unknown[], TResult>(
  fn: ((...args: TArgs) => TResult) | undefined,
): (...args: TArgs) => TResult | undefined
```

Returns a function whose identity never changes but which always calls the latest `fn`. Pass it to
memoised children or effects without invalidating them on every parent render; the data table
does this for row handlers.

- When `fn` is `undefined`, calling the returned function does nothing and returns `undefined`,
  so an optional callback prop can be passed straight in.
- The reference is updated in an insertion effect. Call the returned function from event handlers
  and effects, not during render.

```tsx
'use client'
import { memo } from 'react'
import { useEventCallback } from '@shining-technologies/ui'

const Row = memo(function Row({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return <button onClick={() => onOpen(id)}>{id}</button>
})

export function List({ ids, onOpen }: { ids: string[]; onOpen?: (id: string) => void }) {
  const handleOpen = useEventCallback(onOpen)
  return ids.map((id) => <Row key={id} id={id} onOpen={handleOpen} />)
}
```

## Types

| Type                          | Definition                                                                 |
| ----------------------------- | -------------------------------------------------------------------------- |
| `Updater<T>`                  | `T \| ((old: T) => T)`                                                     |
| `ControllableStateOptions<T>` | `{ value: T \| undefined; defaultValue: T; onChange?: (value: T) => void }` |

## Related pages

- [Documentation index](../README.md)
- [Data table](../data-table.md) — the component these hooks were written for
