import { resolveProject, type ProjectDefinition } from '@shining-technologies/ui-kit-core'
import {
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { cn } from '../lib/cn'
import { CheckIcon, MonitorIcon, MoonIcon, PaletteIcon, SunIcon } from '../lib/icons'
import { Button } from '../primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { useUIKit, type ColorModePreference } from './context'

export interface PalettePreviewProps extends HTMLAttributes<HTMLSpanElement> {
  project: ProjectDefinition
  mode?: 'light' | 'dark'
  /** How many swatches to show. */
  count?: number
}

/**
 * A row of swatches standing in for a whole project.
 *
 * Primary, then the chart family: enough to tell two projects apart at a
 * glance, which is the only job a preview in a menu has.
 */
export function PalettePreview({
  project,
  mode = 'light',
  count = 5,
  className,
  ...props
}: PalettePreviewProps) {
  const colors = useMemo(() => {
    const { colors: c } = resolveProject(project)[mode]
    return [c?.primary, c?.chart2, c?.chart3, c?.chart4, c?.chart5]
      .filter((value): value is string => Boolean(value))
      .slice(0, count)
  }, [project, mode, count])

  return (
    <span className={cn('sui-palette-preview', className)} aria-hidden="true" {...props}>
      {colors.map((color, i) => (
        <span key={i} className="sui-palette-preview__dot" style={{ background: color }} />
      ))}
    </span>
  )
}

export interface ProjectSwitcherProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Rendered at the bottom of the menu — typically a "New project" action. */
  footer?: React.ReactNode
  align?: 'start' | 'center' | 'end'
  /** Show only the palette swatches, no project name. */
  compact?: boolean
}

/**
 * Pick the project everything below the provider is painted with.
 *
 * Built from the kit's own menu and button, so it is itself a demonstration
 * that switching project restyles the switcher.
 */
export function ProjectSwitcher({
  className,
  footer,
  align = 'start',
  compact = false,
  ...props
}: ProjectSwitcherProps) {
  const { project, projects, setProject, colorMode } = useUIKit()

  const presets = projects.filter((p) => p.builtIn)
  const custom = projects.filter((p) => !p.builtIn)

  const item = (candidate: ProjectDefinition) => (
    <DropdownMenuItem
      key={candidate.id}
      onSelect={() => setProject(candidate.id)}
      className="sui-project-switcher__item"
    >
      <PalettePreview project={candidate} mode={colorMode} count={4} />
      <span className="sui-project-switcher__name">{candidate.name}</span>
      {candidate.id === project.id ? <CheckIcon className="sui-project-switcher__check" /> : null}
    </DropdownMenuItem>
  )

  return (
    <div className={cn('sui-project-switcher', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label={`Project: ${project.name}`}>
            <PaletteIcon />
            {!compact && <span>{project.name}</span>}
            <PalettePreview project={project} mode={colorMode} count={3} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="sui-project-switcher__menu">
          {presets.length > 0 && <DropdownMenuLabel>Presets</DropdownMenuLabel>}
          {presets.map(item)}
          {custom.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Your projects</DropdownMenuLabel>
              {custom.map(item)}
            </>
          )}
          {footer ? (
            <>
              <DropdownMenuSeparator />
              {footer}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const MODES: { value: ColorModePreference; label: string; icon: JSX.Element }[] = [
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <MonitorIcon /> },
]

export interface ColorModeToggleProps extends HTMLAttributes<HTMLDivElement> {
  /** Omit `system` when the app has no OS-following mode. */
  modes?: ColorModePreference[]
}

/**
 * Light / dark / system.
 *
 * A three-way segmented control rather than a two-way switch, because "follow
 * the system" is a distinct choice and a switch cannot express it — the usual
 * workaround, a switch that silently means "system until touched", leaves the
 * user unable to get back to system.
 */
export function ColorModeToggle({ className, modes, onKeyDown, ...props }: ColorModeToggleProps) {
  const { mode, setMode } = useUIKit()
  const options = modes ? MODES.filter((m) => modes.includes(m.value)) : MODES
  // One tab stop: the checked radio, or the first when none is (`mode` can be
  // one this toggle was told not to offer).
  const tabStop = Math.max(
    options.findIndex((option) => option.value === mode),
    0,
  )

  return (
    <div
      role="radiogroup"
      aria-label="Colour mode"
      className={cn('sui-toggle-group', className)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!event.defaultPrevented) {
          handleRadioGroupKeys(event, (index) => setMode(options[index]!.value))
        }
      }}
      {...props}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={mode === option.value}
          aria-label={option.label}
          title={option.label}
          tabIndex={index === tabStop ? 0 : -1}
          data-state={mode === option.value ? 'on' : 'off'}
          className="sui-toggle sui-toggle--sm sui-focusable"
          onClick={() => setMode(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}

/**
 * The radio-group keyboard pattern, for a group whose radios render a roving
 * `tabIndex` (only the checked one is `0`): the arrows move *and* select,
 * wrapping at the ends, and Home / End jump to either end. Left and right swap
 * in a right-to-left layout. `select` gets the index among the group's radios.
 */
export function handleRadioGroupKeys(
  event: ReactKeyboardEvent<HTMLElement>,
  select: (index: number) => void,
) {
  const radios = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'),
  ).filter((radio) => !(radio as HTMLButtonElement).disabled)
  const index = radios.indexOf(event.target as HTMLElement)
  if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
  const wrap = (step: number) => (index + step + radios.length) % radios.length
  let next: number
  switch (event.key) {
    case 'ArrowDown':
      next = wrap(1)
      break
    case 'ArrowUp':
      next = wrap(-1)
      break
    case 'ArrowRight':
      next = wrap(rtl ? -1 : 1)
      break
    case 'ArrowLeft':
      next = wrap(rtl ? 1 : -1)
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = radios.length - 1
      break
    default:
      return
  }
  event.preventDefault()
  radios[next]!.focus()
  select(next)
}

export interface TokenSwatchGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Defaults to the active project. */
  project?: ProjectDefinition
  mode?: 'light' | 'dark'
}

/** The palette laid out as labelled swatches — for a theme editor or a gallery. */
export function TokenSwatchGrid({
  className,
  project: projectProp,
  mode: modeProp,
  ...props
}: TokenSwatchGridProps) {
  const kit = useUIKit()
  const project = projectProp ?? kit.project
  const mode = modeProp ?? kit.colorMode

  const groups = useMemo(() => {
    const c = resolveProject(project)[mode].colors ?? {}
    const pick = (keys: (keyof typeof c)[]) =>
      keys
        .map((key) => ({ name: String(key), value: c[key] }))
        .filter((entry): entry is { name: string; value: string } => Boolean(entry.value))

    return [
      { title: 'Surfaces', swatches: pick(['background', 'card', 'popover', 'muted', 'accent']) },
      {
        title: 'Intent',
        swatches: pick(['primary', 'secondary', 'foreground', 'mutedForeground']),
      },
      { title: 'Status', swatches: pick(['success', 'warning', 'destructive', 'info']) },
      { title: 'Lines', swatches: pick(['border', 'input', 'ring']) },
      { title: 'Charts', swatches: pick(['chart1', 'chart2', 'chart3', 'chart4', 'chart5']) },
    ]
  }, [project, mode])

  return (
    <div className={cn('sui-swatch-grid', className)} {...props}>
      {groups.map((group) => (
        <div key={group.title} className="sui-swatch-grid__group">
          <p className="sui-swatch-grid__title">{group.title}</p>
          <div className="sui-swatch-grid__row">
            {group.swatches.map((swatch) => (
              <div key={swatch.name} className="sui-swatch">
                <span
                  className="sui-swatch__chip"
                  style={{ '--sui-swatch': swatch.value } as CSSProperties}
                />
                <span className="sui-swatch__name">{swatch.name}</span>
                <span className="sui-swatch__value">{swatch.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
