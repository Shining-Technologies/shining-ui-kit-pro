# Avatar

Pictures of people. `Avatar` is the frame, built on the Radix Avatar primitive: it shows an image
once it loads and a fallback until then. `UserAvatar` builds on it with initials, a stable colour
per person, a presence dot and an accessible name. `AvatarGroup` overlaps several avatars and can
collapse the rest into a "+n" chip.

```tsx
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  avatarVariants,
  initialsFrom,
  UserAvatar,
  userAvatarVariants,
  tintIndexFor,
} from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/avatar'
```

**Server and client.** Both modules in this family are `'use client'`. You can render the
components from a Server Component. Call the helper functions (`initialsFrom`, `tintIndexFor`,
`avatarVariants`, `userAvatarVariants`) only from client code.

Exported types: `AvatarProps`, `AvatarGroupProps`, `UserAvatarProps`, `PresenceStatus`.

## Avatar

A circular frame (Radix `Avatar.Root`, a `<span>`). Put an `AvatarImage` and an `AvatarFallback`
inside it.

```tsx
import { Avatar, AvatarFallback, AvatarImage, initialsFrom } from '@shining-technologies/ui'

<Avatar size="lg">
  <AvatarImage src={user.photoUrl} alt={user.name} />
  <AvatarFallback>{initialsFrom(user.name)}</AvatarFallback>
</Avatar>
```

| Prop        | Type                                 | Default     | Description                                        |
| ----------- | ------------------------------------ | ----------- | -------------------------------------------------- |
| `size`      | `'sm' \| 'default' \| 'lg' \| 'xl'`  | `'default'` | 1.5rem, 2rem, 2.5rem or 3.5rem.                    |
| `className` | `string`                             |             | Merged after the size class.                       |

Also accepts all Radix `Avatar.Root` props. Styling hooks: `data-slot="avatar"`, classes
`sui-avatar` and `sui-avatar--sm`, `--lg` or `--xl`.

### AvatarImage

Radix `Avatar.Image`, with the class `sui-avatar__image` and `data-slot="avatar-image"`. It renders
only after the image has loaded. Accepts all Radix `Avatar.Image` props (`src`, `alt`,
`onLoadingStatusChange`, and the other `<img>` props).

### AvatarFallback

Radix `Avatar.Fallback`, with the class `sui-avatar__fallback` and `data-slot="avatar-fallback"`.
It renders while there is no loaded image. Accepts all Radix `Avatar.Fallback` props, including
`delayMs`, which waits before showing the fallback so it does not flash while a fast image loads.

## AvatarGroup

A row of overlapping avatars: `Avatar`s or `UserAvatar`s. With `max`, it shows the first `max`
children and a chip that stands for the rest.

```tsx
import { AvatarGroup, UserAvatar } from '@shining-technologies/ui'

<AvatarGroup max={3}>
  {crew.map((person) => (
    <UserAvatar key={person.id} name={person.name} src={person.photoUrl} size="sm" />
  ))}
</AvatarGroup>
```

| Prop            | Type     | Default | Description                                                                                                            |
| --------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `max`           | `number` |         | Show at most this many children. Decimals are rounded down, and a negative value is ignored. `0` shows only the chip. |
| `moreClassName` | `string` |         | Extra classes for the "+n" chip. Not needed for sizing: the chip already matches the avatars (see below).            |

Also accepts all `<div>` props.

Details:

- The chip is `<span role="img" aria-label="N more">`, showing the text `+N`. It appears only
  when more children exist than `max`.
- The group itself has no role. A row of faces is decoration: the people it shows should also be
  listed in text somewhere on the page.
- Direct children that are `Avatar`s (class `sui-avatar`) or `UserAvatar`s (class
  `sui-user-avatar`) overlap by 0.5rem and get a 2px ring in the `--card` colour. On a
  `UserAvatar` the ring goes on the circle, not on the presence dot.
- The chip takes the size of the avatars beside it: any `Avatar` size, or any `UserAvatar` size
  including the default 2.25rem. This relies on the CSS `:has()` selector; in browsers without it,
  the chip stays at the default `Avatar` size (2rem). If the group mixes sizes, the chip follows
  one of them.
- Styling hooks: `data-slot="avatar-group"`, and on the chip `data-slot="avatar-group-more"` and
  the class `sui-avatar-group__more`. The group itself has the class `sui-avatar-group`.

## initialsFrom

```ts
initialsFrom(name: string, count?: number): string // count defaults to 2
```

Returns the uppercased first letter of each of the first `count` whitespace-separated words.
`initialsFrom('Ana María Ortiz')` returns `'AM'`.

## UserAvatar

A person's avatar: a photo when `src` is set, otherwise their initials on a colour chosen from
their name. An optional presence dot shows availability. The name, plus the presence status, is
announced once to assistive technology.

```tsx
import { UserAvatar } from '@shining-technologies/ui'

<UserAvatar name="Ana Ortiz" />
<UserAvatar name="Priya Raman" src="/people/priya.jpg" status="online" size="lg" />
<UserAvatar name="Service account" seed="svc-42" muted size="sm" />
```

| Prop        | Type                                          | Default     | Description                                                                              |
| ----------- | --------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `name`      | `string`                                      | required    | Used for the initials, the colour (unless `seed` is set) and the accessible name.        |
| `src`       | `string`                                      |             | Photo URL. Until it loads, the initials are shown; with `src` set they wait 200ms first, so a fast image does not flash them. |
| `seed`      | `string`                                      | `name`      | Chooses the colour instead of `name`, for example a stable user id.                      |
| `status`    | `'online' \| 'away' \| 'busy' \| 'offline'`   |             | Presence dot on the corner. Omit it for no dot.                                          |
| `muted`     | `boolean`                                     | `false`     | Use neutral muted colours instead of a per-person colour.                                |
| `size`      | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl'`   | `'default'` | 1.5rem, 1.875rem, 2.25rem, 2.75rem or 3.5rem.                                            |
| `className` | `string`                                      |             |                                                                                          |

Also accepts all `<span>` props except `children`.

**Colour.** The colour is one of the five chart tokens `var(--chart-1)` to `var(--chart-5)`,
chosen by `tintIndexFor(seed ?? name)`. The same name gets the same colour on every page and after
every reload, and the colours change when the theme does. The colour is set as
`--sui-user-avatar-tint` on the inner avatar. The fallback uses an 18% mix of it for the background
and an 85% mix for the text.

**Presence colours.** `online` uses `--success`, `away` uses `--warning`, `busy` uses
`--destructive`, and `offline` uses `--muted-foreground`.

**Markup.** The inner `Avatar` and the presence dot are `aria-hidden`. The image has `alt=""`. A
visually hidden text node holds the name, followed by `, <status>` when `status` is set (for
example "Ana Ortiz, online"). Screen readers therefore read the name once, not "image" or the
initials.

Styling hooks: `data-slot="user-avatar"`, `data-status`, and the classes `sui-user-avatar`,
`sui-user-avatar--<size>`, `sui-user-avatar__avatar`, `sui-user-avatar__fallback`,
`sui-user-avatar__presence` and `sui-user-avatar__presence--<status>`.

## tintIndexFor

```ts
tintIndexFor(seed: string, buckets?: number): number // buckets defaults to 5
```

A deterministic hash of `seed`, returned as an index from `0` to `buckets - 1`. `UserAvatar` uses
it to choose a colour. Use it to give other elements the same per-person colour.

## avatarVariants and userAvatarVariants

The class-variance-authority functions behind `Avatar` (`avatarVariants({ size? })`) and
`UserAvatar` (`userAvatarVariants({ size? })`).

## Accessibility

- With `Avatar`, you provide the text alternative. Give `AvatarImage` a meaningful `alt`, or
  `alt=""` when the person's name is already next to it. Fallback initials are read as letters,
  so put `aria-hidden` on the `Avatar` when the name is shown beside it.
- `UserAvatar` handles this itself: the name is announced once, with the presence status, and
  every visual part is hidden.
- Presence is shown by colour only, but it is also included in `UserAvatar`'s accessible name.
- The `AvatarGroup` "+n" chip has an accessible name ("3 more"). The group has no role.

## Related

- [Card](./card.md)
- [Sidebar](./sidebar.md)
- [Theming](../theming.md): the `--chart-1` to `--chart-5` tokens used for avatar colours
- [Visually hidden](./visually-hidden.md)
- [Accessibility](../accessibility.md)
