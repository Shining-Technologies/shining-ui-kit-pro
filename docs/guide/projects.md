# Projects

A **project** is the design system for an application: a few seed colours, a shape and a
type choice. Resolving it produces the complete token set every component in the kit reads,
so switching project restyles an entire application rather than one component.

Projects are plain data. They round-trip through JSON, which is what lets one live in
localStorage, in a database row, or in a config file checked into the app that consumes it.

---

## The shape of a project

```ts
interface ProjectDefinition {
  id: string
  name: string
  description?: string
  basePalette?: string // the preset it started from
  seed: ProjectSeed
  neutralTint: 'pure' | 'subtle' | 'tinted'
  shape: ProjectShape
  typography: ProjectTypography
  overrides?: UIKitTheme // escape hatch: explicit token values
  builtIn?: boolean
}
```

### The seed

Only `primary` is required. Everything else has a defensible default, so
`createProject({ name: 'Acme', seed: { primary: '#7c3aed' } })` is already a finished,
usable design system.

| Field                                    | What it drives                                                     | Default                            |
| ---------------------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| `primary`                                | Filled buttons, active states, focus rings, the first chart series | —                                  |
| `accent`                                 | The second brand colour: chart series and highlights               | A hue 150° off `primary`           |
| `neutral`                                | The hue of the greys                                               | `primary`'s hue at very low chroma |
| `surface`                                | The page background behind cards                                   | The lightest neutral step          |
| `success` `warning` `destructive` `info` | Status colours                                                     | Sensible defaults                  |

`neutralTint` decides how much brand hue the greys pick up: `pure` is true greyscale,
`subtle` is barely perceptible, `tinted` is visible. A warm brand on cold neutral chrome is
the usual symptom of leaving this at `pure`.

### The shape

```ts
interface ProjectShape {
  radius: string // base corner radius
  density: 'compact' | 'comfortable' | 'spacious' // rhythm and control heights
  variant: TableVariant // table chrome preset
  borderWidth: string
  elevation: 'flat' | 'soft' | 'raised'
}
```

Every other radius derives from `radius`: `--sui-radius-sm` is 4px tighter,
`--sui-radius-control` 2px tighter, `--sui-radius-lg` 4px looser.

---

## What gets generated

Resolving a project produces both colour modes eagerly, so a mode toggle swaps one attribute
rather than re-running the generator.

```ts
import { resolveProject, shiningPalette } from '@shining-technologies/ui-kit-core'

const { light, dark } = resolveProject(shiningPalette)
light.colors.primary // '#01493b'
light.colors.primaryForeground // '#f0f3f2'  — computed, guaranteed readable
light.colors.chart3 // a hue between primary and accent
```

The derivations are done in OKLab, not sRGB. That matters: a "10% lighter" blue derived in
sRGB reads as grey, and a generated ramp bunches up in the middle. OKLab is uniform enough
that the naive arithmetic is right.

### Contrast is a guarantee, not an aspiration

Every filled surface and its label go through `harmonizeFill`, which picks the ink by what
the mode wants and then moves the fill's _lightness_ — never its hue or chroma — until the
pair clears 4.5:1.

This matters for the mid-lightness seeds people actually pick. A rose, a cyan or a mustard
reaches 4.5:1 against **neither** white nor near-black, so the usual "pick whichever is
better" produces a button whose label is hard to read. Here the fill moves instead.

`tests/theming.test.ts` asserts fourteen text/background pairs across every shipped palette
in both modes, plus six arbitrary custom brand colours.

### The chart family

Five series whose hues walk from `primary` to `accent`, so a chart looks like it belongs to
the brand rather than to a generic categorical palette. Lightness rises toward the middle of
the walk and falls after it — which is both where yellow actually lives, and what keeps
neighbouring series apart in greyscale and for a colour-blind reader.

---

## Using a project

### A preset, with or without your brand

Most apps never need to build a project object. Name a preset, and optionally put your brand
on it:

```tsx
import { UIKitProvider } from '@shining-technologies/ui-kit-react'

;<UIKitProvider preset="darwind" scope="global">
  <App />
</UIKitProvider>

<UIKitProvider preset="unn" brand="#be123c" scope="global">
<UIKitProvider preset="unn" brand={{ primary: '#be123c', radius: '0.5rem' }} scope="global">
```

`brand` is a flat object: the seed colours (`primary`, `accent`, `neutral`, `surface` and the
status colours) alongside `radius`, `density`, `elevation`, `borderWidth`, `variant`,
`neutralTint`, `fontFamily`, `fontSize`, `titleFontWeight` and `overrides`. A string is
shorthand for `{ primary }`. The result is a project with the id `<preset>-custom`, so it
never shadows the shipped preset.

The same operation outside React — in a route loader, a test, or to save to a database — is
`applyBrand`:

```ts
import { applyBrand, unnPalette } from '@shining-technologies/ui-kit-core'

const ours = applyBrand(unnPalette, { primary: '#be123c', density: 'compact' })
```

### Precedence

The provider paints the first of these that is set:

1. `project` (controlled).
2. A project picked in this session — through `<ProjectSwitcher />`, the editor or `setProject`.
3. With a `registry`, the project the user picked on an earlier visit, as persisted.
4. `defaultProject`.
5. `preset` and/or `brand`, if either is passed.
6. With a `registry`, its initial project: `initialProjectId`, else its first built-in.
7. `shining`.

`defaultProject`, `preset`, `brand` and `initialProjectId` decide where a first visit starts;
once the user picks a project, the pick survives reloads. Only `project` overrides it.

`project` and `defaultProject` accept a full definition, a registry id, or a preset id.
An id that matches nothing falls back to `shining` and logs a console warning.

### What a preset reaches

Every component. Colours, radius, borders, shadows and type are CSS variables; density sets
the rhythm of controls and table rows; and `DataTable` takes its `density` and `variant` from
the project unless you pass its own. Dialogs, sheets, menus, selects, popovers, tooltips and
hover cards render inside the themed scope, so they match in either scope.

### Scope

|                           |                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `scope="global"`          | Writes the tokens onto `<html>`. What an application wants: the page background and your own markup outside the provider pick them up. |
| `scope="local"` (default) | Wraps the subtree in a themed element, and renders its portalled surfaces into it. For previewing several projects side by side.       |

### Colour mode

```tsx
<UIKitProvider preset="shining" defaultMode="system" scope="global">
```

`system` follows the OS until the user chooses a side. In global scope the provider also
toggles `.dark` on `<html>`, so a consuming app's own Tailwind `dark:` utilities keep
working.

Drop in `<ColorModeToggle />` for a three-way light / dark / system control. It is
deliberately not a two-way switch: "follow the system" is a distinct choice, and a switch
cannot express it without leaving the user unable to get back to it.

---

## Managing projects at runtime

`ProjectRegistry` is a small observable store. It lives outside React so it can be read by a
route loader, and so a project chosen in one place survives a remount.

A server render has no storage, so a registry there only knows its initial project —
`initialProjectId`, else the first built-in. The provider paints `registry.getInitialActiveId()`
while hydrating, so the markup agrees with the server's, then switches to the project
restored from storage in the next commit.

```tsx
import { ProjectRegistry, UIKitProvider, ProjectSwitcher, ProjectEditor } from '@shining-technologies/ui-kit-react'

const registry = new ProjectRegistry()          // persists to localStorage
const memoryOnly = new ProjectRegistry({ storage: null })

<UIKitProvider registry={registry} scope="global">
  <ProjectSwitcher footer={<DropdownMenuItem onSelect={openEditor}>+ New project…</DropdownMenuItem>} />
  <App />
</UIKitProvider>
```

| Method                      |                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `create(input)`             | Add a project. Ids are made unique, so two "Acme"s can coexist.                                             |
| `fork(id, name)`            | Copy one — the flow behind "start from a preset".                                                           |
| `update(id, patch)`         | Edit. **Editing a built-in forks it** rather than mutating the shipped preset.                              |
| `remove(id)`                | Delete a user project. Built-ins cannot be deleted. Removing the active one returns to the initial project. |
| `reset()`                   | Drop every user project and return to the initial project.                                                  |
| `setActive(id)`             | Switch. This is the user's pick, and it is persisted.                                                       |
| `getChosenActiveId()`       | The active id if the user picked it, `undefined` while it is still the initial project.                     |
| `export()` / `import(json)` | Serialise for a file or a database row. Input that is not an export is rejected outright.                   |

`initialProjectId` applies on first load only. Only a chosen active id is persisted, so the
initial project never becomes a "pick" that outranks the app's configuration. Saved state from
before picks were tracked counts as a pick.

Stored and imported projects are checked one by one. A missing `shape` or `typography`, or a
field missing from either, is filled in with the defaults; an unknown `neutralTint` becomes
`subtle`; a seed colour that is not a string is discarded, so its default applies. A project
without a string `seed.primary` is dropped. `import` makes ids unique, against what is already there and
within the batch.

Storage failures — a private window, blocked site data, a full quota — are caught. The
in-memory registry stays correct; only the next reload loses the change.

---

## Editing a project

`<ProjectEditor />` is the form: preset picker, colour inputs, radius, density, elevation and
grey tint. It requires a provider with a registry, since otherwise there is nowhere to save.

```tsx
<ProjectEditor onSubmit={(project) => close()} onCancel={close} />
<ProjectEditor project={existing} submitLabel="Save changes" />
```

It edits **seeds, not tokens**. A token-by-token editor would be both longer and much easier
to get wrong — there is no way to author forty colours by hand and be sure every pair is
readable.

`<TokenSwatchGrid />` renders the generated palette as labelled swatches, for when you do
want to see every value.

---

## Escaping the generator

When a designer wants one specific value that no seed would produce, `overrides` is applied
on top of the generated palette:

```ts
createProject({
  name: 'Acme',
  seed: { primary: '#7c3aed' },
  overrides: {
    colors: { headerBackground: '#f8f5ff' },
    dark: { colors: { headerBackground: '#1a1524' } },
  },
})
```

`overrides` applies to both modes; `overrides.dark` applies to dark only. Reach for it
sparingly — every value pinned here is one the contrast guarantee no longer covers.

---

## Building a project in code

```ts
import {
  createProject,
  forkProject,
  updateProject,
  shiningPalette,
} from '@shining-technologies/ui-kit-core'

const acme = createProject({
  name: 'Acme Admin',
  seed: { primary: '#7c3aed', accent: '#ec4899', neutral: '#6b7280' },
  neutralTint: 'subtle',
  shape: { radius: '0.75rem', density: 'compact', elevation: 'flat' },
})

const branch = forkProject(shiningPalette, 'Shining Dark Ops')
const tightened = updateProject(acme, { shape: { density: 'compact' } })
```

## The colour engine

`@shining-technologies/ui-kit-core` exports the OKLab toolkit the generator is built on, for when you
need the same derivations in your own code:

```ts
import {
  mix,
  lighten,
  darken,
  generateScale,
  contrastRatio,
  readableForeground,
} from '@shining-technologies/ui-kit-core'

generateScale('#01493b') // { 50: '#f0faf7', …, 950: '#08221c' }
readableForeground('#facc15') // the legible ink for that fill
contrastRatio('#fff', '#01493b') // 9.32
mix('#01493b', '#ff7f00', 0.5) // blended in OKLab, hue the short way round
```

## See also

- [Theming](./theming.md) — the token names themselves, variants, density and dark mode
- [Quick start](./quick-start.md) — getting the provider mounted
