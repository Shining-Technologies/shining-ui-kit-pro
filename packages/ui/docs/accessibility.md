# Accessibility

What the components do for accessibility, how it is tested, and what your application still has
to provide.

- [How it is tested](#how-it-is-tested)
- [Guarantees](#guarantees)
- [Keyboard](#keyboard)
- [Your responsibilities](#your-responsibilities)

## How it is tested

- Interactive components are built on [Radix UI](https://www.radix-ui.com/primitives) primitives
  where one exists (dialogs, menus, popovers, selects, tabs, accordions, checkboxes, radio groups,
  switches, sliders, tooltips), so they follow the WAI-ARIA Authoring Practices for focus
  management and keyboard interaction.
- The test suite runs [axe-core](https://github.com/dequelabs/axe-core) against rendered
  components and states, and drives keyboard interaction through the DOM.
- Themes generated with `createThemeCss` are checked for contrast: every filled colour and its
  foreground clear WCAG AA (4.5:1) in light and dark mode, and form-control borders clear 3:1.

## Guarantees

### Focus

- Every focusable kit element shows a visible focus ring on keyboard focus (`:focus-visible`),
  drawn from the `--ring` token.
- Dialogs, alert dialogs and sheets trap focus while open and return it when they close: to the
  element that opened them, or to the menu trigger when they were opened from a menu item that
  has since unmounted.

### Motion

- Transitions and animations are reduced under `prefers-reduced-motion: reduce`.

### Forms

- `Field` connects its label, description and error message to the control inside it. The
  control receives `id`, `aria-describedby` and `aria-invalid` from the field, so you do not
  wire ids by hand:

  ```tsx
  <Field label="Email" description="We never share it." error={errors.email}>
    <Input name="email" type="email" />
  </Field>
  ```

- Required fields mark the visual asterisk `aria-hidden`; the control itself carries the required
  state.
- Custom controls in the form family (colour, file and image upload, date and time fields) read
  the same field wiring.

### Status and announcements

- `Alert` uses `role="alert"` only for the `destructive` tone, which interrupts a screen reader.
  Other tones use `role="note"`.
- Toasts render in a polite live region.
- Loading cards and tiles set `aria-busy`.
- The calendar announces the visible month when it changes.

### Navigation

- The current page is marked with `aria-current="page"` in `Breadcrumb`, `Pagination`,
  `SidebarNav`, `SectionTabs` and the bottom navigation; the current step in `StepCard` and
  `StatusFlow` uses `aria-current="step"`.
- `SkipToContent` provides a skip link to the main content.

### Data table

- Renders a real `<table>` with header cells, and exposes the total row count to assistive
  technology, including in server mode where only one page is in the DOM.
- Sortable headers are buttons, and the sort state is reported with `aria-sort`.
- Every generated control (search, filters, pagination, selection checkboxes, expand toggles,
  row actions) has an accessible name.
- Disabled rows are marked and cannot be selected.
- Empty, loading and error states pass axe.

### Charts

- Colour is never the only way to identify a series: multi-series charts have a legend, a
  tooltip and a table view of the data (`showTableToggle`).

### Development warnings

- In development, a `Dialog`, `AlertDialog` or `Sheet` without an accessible name logs a
  warning. Give it a title (add `className="sui-visually-hidden"` to the title to hide it; do not
  wrap it in `VisuallyHidden`, which would put a heading inside a `<span>`) or an `aria-label`.

## Keyboard

Radix-based components follow the standard patterns (for example, arrow keys in menus, tabs and
radio groups; Escape closes overlays). Components with their own keyboard handling:

| Component                  | Keys                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `DataTable` rows           | One tab stop for all rows. Up / Down move between rows, Home / End jump to the first and last. Space toggles selection, Enter activates the row, Right / Left expand and collapse. Keys pressed inside a control in a row go to that control. |
| `SidebarNav`               | Arrow-key navigation between items; see [Sidebar](./components/sidebar.md)            |
| `Calendar`, `Clock`, `TimeInput` | Arrow keys move the date or time; see [Date and time](./components/date-time.md) |
| `Combobox`, `TagsInput`, `OtpInput`, `NumberInput`, `PhoneInput`, `RatingInput` | See [Form](./components/form.md) |
| `HoldButton`               | Hold Space or Enter to confirm; see [Button](./components/button.md)                 |

Rows in a `DataTable` become focusable only when something in them is interactive (selection,
expansion, row click).

## Your responsibilities

The components cannot know your content. An accessible application still needs:

- **Names.** A `label` or `aria-label` on each `DataTable`, a title on every dialog and sheet, a
  `label` on every `Field`, and an `aria-label` on icon-only buttons.
- **Page structure.** One `<main>` landmark (`AppShellContent` renders it), headings in order,
  and `lang` on `<html>`.
- **Text alternatives.** `alt` text for images you pass to `Avatar`, `ImageUpload` and cards.
  Icons from the built-in set are always decorative (`aria-hidden`), so an icon-only button needs
  an `aria-label` or visually hidden text.
- **Language of built-in strings.** Built-in labels such as "Previous month", "Clear" or
  "Dismiss" are in English. Where a component accepts a label prop, pass a translated string.
  `locale` changes number and date formatting only.
- **Contrast of your own theme.** Hand-written token values are not checked. Generate a theme with
  [`createThemeCss`](./api/theme.md) or verify your values against WCAG AA, including
  `--input` against `--card` at 3:1.
- **Meaningful status text.** Pair colour with text: a `Badge` or `StatusDot` should say what the
  colour means.
- **Testing your screens.** Run axe (for example `vitest-axe` or `@axe-core/playwright`) on your
  pages, and try them with a keyboard and a screen reader.
