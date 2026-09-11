import {
  BUILT_IN_PALETTES,
  DEFAULT_SHAPE,
  resolveProject,
  type Density,
  type NeutralTint,
  type ProjectDefinition,
  type ProjectInput,
  type ProjectSeed,
  type ThemeColors,
} from '@shining-technologies/ui-kit-core'
import { useEffect, useId, useMemo, useState, type FormEvent, type HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Button } from '../primitives/button'
import { Field, Label } from '../ui/field'
import { PalettePreview, handleRadioGroupKeys } from './project-switcher'
import { useUIKit } from './context'

/** The seed colours the editor exposes. The rest are derived. */
const SEED_FIELDS: { key: keyof ProjectSeed; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primary', hint: 'Buttons, links, focus rings.' },
  { key: 'accent', label: 'Accent', hint: 'The second chart colour and highlights.' },
  { key: 'neutral', label: 'Neutral', hint: 'The hue of the greys.' },
  { key: 'surface', label: 'Page', hint: 'The background behind cards.' },
]

const STATUS_FIELDS: { key: keyof ProjectSeed; label: string }[] = [
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'destructive', label: 'Destructive' },
  { key: 'info', label: 'Info' },
]

const RADII = [
  { label: 'Square', value: '0.125rem' },
  { label: 'Small', value: '0.375rem' },
  { label: 'Medium', value: '0.65rem' },
  { label: 'Large', value: '0.875rem' },
  { label: 'Round', value: '1.25rem' },
]

const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious']
const TINTS: NeutralTint[] = ['pure', 'subtle', 'tinted']
const ELEVATIONS = ['flat', 'soft', 'raised'] as const

export interface ProjectEditorProps extends Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** Editing an existing project; omit to create a new one. */
  project?: ProjectDefinition
  /** Preselected preset when creating. */
  basePaletteId?: string
  onSubmit?: (project: ProjectDefinition) => void
  onCancel?: () => void
  submitLabel?: string
}

/**
 * Create or edit a project.
 *
 * The form edits *seeds*, not tokens: four colours, a radius, a density. That
 * is the whole design decision surface, because everything else — hovers,
 * borders, dark mode, chart series, the readable foreground on every fill — is
 * generated from them. A token-by-token editor would be both longer and easier
 * to get wrong.
 *
 * Requires a provider with a registry; without one there is nowhere to save to.
 */
export function ProjectEditor({
  className,
  project,
  basePaletteId,
  onSubmit,
  onCancel,
  submitLabel,
  ...props
}: ProjectEditorProps) {
  const kit = useUIKit()
  const isEditing = Boolean(project)
  const formId = useId()

  const base = useMemo(
    () => project ?? BUILT_IN_PALETTES.find((p) => p.id === basePaletteId) ?? BUILT_IN_PALETTES[0]!,
    [project, basePaletteId],
  )

  const [name, setName] = useState(() => (isEditing ? base.name : ''))
  const [preset, setPreset] = useState(() => base.basePalette ?? base.id)
  const [seed, setSeed] = useState<ProjectSeed>(() => ({ ...base.seed }))
  const [tint, setTint] = useState<NeutralTint>(base.neutralTint)
  const [shape, setShape] = useState(() => ({ ...base.shape }))
  const [showStatus, setShowStatus] = useState(false)

  // Choosing a preset replaces the seed wholesale. Merging instead would leave
  // a half-applied palette — one colour from the new preset, three from the old.
  useEffect(() => {
    if (isEditing) return
    const source = BUILT_IN_PALETTES.find((p) => p.id === preset)
    if (!source) return
    setSeed({ ...source.seed })
    setTint(source.neutralTint)
    setShape({ ...source.shape })
  }, [preset, isEditing])

  /** A throwaway project used only to render the live preview. */
  const draft = useMemo<ProjectDefinition>(
    () => ({
      ...base,
      id: base.id,
      name: name || 'Untitled project',
      seed,
      neutralTint: tint,
      shape,
      builtIn: false,
    }),
    [base, name, seed, tint, shape],
  )
  // Resolved once per edit, not once per colour field per keystroke.
  const draftColors = useMemo(() => resolveProject(draft).light.colors ?? {}, [draft])

  const input: ProjectInput = {
    name: name.trim() || 'Untitled project',
    basePalette: isEditing ? base.basePalette : preset,
    seed,
    neutralTint: tint,
    shape,
    typography: base.typography,
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved =
      isEditing && project ? kit.updateProject?.(project.id, input) : kit.createProject?.(input)
    if (saved) onSubmit?.(saved)
    // A submit button that does nothing at all is the worst way to learn this.
    else if (!kit.registry) {
      console.warn(
        '[shining-ui-kit] <ProjectEditor> has nowhere to save: give <UIKitProvider> a `registry`.',
      )
    }
  }

  const set = (key: keyof ProjectSeed, value: string) =>
    setSeed((current) => ({ ...current, [key]: value }))

  return (
    <form className={cn('sui-project-editor', className)} onSubmit={handleSubmit} {...props}>
      <Field label="Project name" htmlFor={`${formId}-name`}>
        <input
          id={`${formId}-name`}
          className="sui-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Admin"
          autoComplete="off"
          required
        />
      </Field>

      {!isEditing && (
        <Field
          label="Start from"
          description="A preset fills in every colour; change any of them below."
        >
          <div
            className="sui-preset-grid"
            role="radiogroup"
            aria-label="Base palette"
            onKeyDown={(event) =>
              handleRadioGroupKeys(event, (index) => setPreset(BUILT_IN_PALETTES[index]!.id))
            }
          >
            {BUILT_IN_PALETTES.map((palette, index) => (
              <button
                key={palette.id}
                type="button"
                role="radio"
                aria-checked={preset === palette.id}
                // One tab stop, on the checked preset (or the first, for none).
                tabIndex={
                  preset === palette.id ||
                  (index === 0 && !BUILT_IN_PALETTES.some((p) => p.id === preset))
                    ? 0
                    : -1
                }
                className="sui-preset"
                data-selected={preset === palette.id}
                onClick={() => setPreset(palette.id)}
              >
                <PalettePreview project={palette} mode={kit.colorMode} />
                <span className="sui-preset__name">{palette.name}</span>
              </button>
            ))}
          </div>
        </Field>
      )}

      <fieldset className="sui-fieldset">
        <legend className="sui-fieldset__legend">Colours</legend>
        <div className="sui-color-grid">
          {SEED_FIELDS.map((entry) => (
            <ColorInput
              key={entry.key}
              id={`${formId}-${entry.key}`}
              label={entry.label}
              hint={entry.hint}
              value={seed[entry.key] ?? fallbackFor(draftColors, entry.key)}
              onChange={(value) => set(entry.key, value)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setShowStatus((open) => !open)}
        >
          {showStatus ? 'Hide status colours' : 'Status colours'}
        </Button>

        {showStatus && (
          <div className="sui-color-grid">
            {STATUS_FIELDS.map((entry) => (
              <ColorInput
                key={entry.key}
                id={`${formId}-${entry.key}`}
                label={entry.label}
                value={seed[entry.key] ?? fallbackFor(draftColors, entry.key)}
                onChange={(value) => set(entry.key, value)}
              />
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="sui-fieldset">
        <legend className="sui-fieldset__legend">Shape</legend>

        <Field label="Corner radius">
          <div className="sui-toggle-group">
            {RADII.map((option) => (
              <button
                key={option.value}
                type="button"
                className="sui-toggle sui-toggle--sm sui-focusable"
                data-state={shape.radius === option.value ? 'on' : 'off'}
                aria-pressed={shape.radius === option.value}
                onClick={() => setShape((s) => ({ ...s, radius: option.value }))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Density" description="Row height, control height and padding.">
          <div className="sui-toggle-group">
            {DENSITIES.map((option) => (
              <button
                key={option}
                type="button"
                className="sui-toggle sui-toggle--sm sui-focusable"
                data-state={shape.density === option ? 'on' : 'off'}
                aria-pressed={shape.density === option}
                onClick={() => setShape((s) => ({ ...s, density: option }))}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Elevation">
          <div className="sui-toggle-group">
            {ELEVATIONS.map((option) => (
              <button
                key={option}
                type="button"
                className="sui-toggle sui-toggle--sm sui-focusable"
                data-state={shape.elevation === option ? 'on' : 'off'}
                aria-pressed={shape.elevation === option}
                onClick={() => setShape((s) => ({ ...s, elevation: option }))}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Grey tint" description="How much of the brand hue the greys pick up.">
          <div className="sui-toggle-group">
            {TINTS.map((option) => (
              <button
                key={option}
                type="button"
                className="sui-toggle sui-toggle--sm sui-focusable"
                data-state={tint === option ? 'on' : 'off'}
                aria-pressed={tint === option}
                onClick={() => setTint(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>
      </fieldset>

      <div className="sui-project-editor__actions">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="default">
          {submitLabel ?? (isEditing ? 'Save changes' : 'Create project')}
        </Button>
      </div>
    </form>
  )
}

/** What to show in a colour input the user has not set — the generated value. */
function fallbackFor(colors: Partial<ThemeColors>, key: keyof ProjectSeed): string {
  switch (key) {
    case 'accent':
      return colors.chart2 ?? '#888888'
    case 'neutral':
      return colors.mutedForeground ?? '#888888'
    case 'surface':
      return colors.background ?? '#ffffff'
    case 'success':
      return colors.success ?? '#16a34a'
    case 'warning':
      return colors.warning ?? '#d97706'
    case 'destructive':
      return colors.destructive ?? '#dc2626'
    case 'info':
      return colors.info ?? '#2563eb'
    default:
      return colors.primary ?? '#000000'
  }
}

interface ColorInputProps {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}

/**
 * A colour swatch and a hex field, kept in sync.
 *
 * Both are needed: the picker is how a colour gets chosen, and the text field
 * is how an exact brand hex gets pasted in. The text field commits only on a
 * complete value, so typing "#0" does not momentarily repaint the whole app.
 */
function ColorInput({ id, label, hint, value, onChange }: ColorInputProps) {
  const [draft, setDraft] = useState(value)

  // Follow the value when it changes underneath — switching preset, say —
  // but not while the field is mid-edit.
  useEffect(() => setDraft(value), [value])

  const commit = (next: string) => {
    setDraft(next)
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(next.trim())) onChange(next.trim())
  }

  return (
    <div className="sui-color-input">
      <Label htmlFor={id}>{label}</Label>
      <div className="sui-color-input__row">
        <input
          id={id}
          type="color"
          className="sui-color-input__picker"
          value={normalizeHex(value)}
          onChange={(event) => {
            setDraft(event.target.value)
            onChange(event.target.value)
          }}
        />
        <input
          className="sui-input sui-input--sm sui-color-input__hex"
          value={draft}
          onChange={(event) => commit(event.target.value)}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
        />
      </div>
      {hint ? <p className="sui-field__description">{hint}</p> : null}
    </div>
  )
}

/** `<input type="color">` only accepts full six-digit hex. */
function normalizeHex(value: string): string {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  }
  return '#000000'
}

export { DEFAULT_SHAPE }
