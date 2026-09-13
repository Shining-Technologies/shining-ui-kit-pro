import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
  CheckIcon,
  ColorInput,
  CopyIcon,
  Field,
  Input,
  MetricGrid,
  MetricTile,
  PaletteIcon,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  normalizeHex,
} from '@shining-technologies/ui'
import { BarChart, Sparkline } from '@shining-technologies/ui/charts'
import {
  THEME_PRESETS,
  createThemeCss,
  type CreateThemeOptions,
  type NeutralTint,
  type ThemePreset,
} from '@shining-technologies/ui/theme'
import { useMemo, useState } from 'react'
import { CHART_MONTHS, SPARK_SERIES } from '../data'
import { useGalleryTheme } from '../theme'
import { Demo } from './Demo'
import './Themes.css'

/** The class every scoped preview carries, so its rules cannot reach `<html>`. */
const PREVIEW = 'gallery-preview'
const CUSTOM_ID = 'gallery-custom'

const SWATCH_TOKENS = ['primary', 'secondary', 'muted', 'chart-1', 'chart-2', 'chart-3'] as const

function presetOptions(preset: ThemePreset): CreateThemeOptions {
  return { ...preset.seed, neutralTint: preset.neutralTint, radius: preset.radius }
}

/**
 * Scoped rules for one theme id. The light rule is keyed on the preview class
 * as well as `data-theme`, and the dark rule on a `.dark` ancestor, so a tile
 * follows the gallery's colour mode without touching the page's own theme.
 */
function scopedCss(id: string, options: CreateThemeOptions): string {
  const target = `[data-theme='${id}'].${PREVIEW}`
  return createThemeCss(options, { selector: target, darkSelector: `.dark ${target}` })
}

/**
 * Every preset, side by side.
 *
 * The gallery's global stylesheet keys each preset on `:root[data-theme]`,
 * which cannot reach a nested element. So this page renders its own
 * `createThemeCss` output with element-scoped selectors — the same function an
 * application uses for a per-tenant theme.
 */
export function Themes() {
  const { theme, setThemeId } = useGalleryTheme()
  const presetCss = useMemo(
    () => THEME_PRESETS.map((preset) => scopedCss(preset.id, presetOptions(preset))).join('\n'),
    [],
  )

  return (
    <div className="stack">
      <style>{presetCss}</style>

      <Demo
        title="Presets"
        note={
          <>
            Each tile renders the same components under a different preset. The page is currently
            using <strong>{theme.name}</strong>; apply another and the whole gallery repaints.
          </>
        }
        inline={false}
      >
        <div className="grid-3">
          {THEME_PRESETS.map((preset) => (
            <PresetTile
              key={preset.id}
              preset={preset}
              active={preset.id === theme.id}
              onApply={() => setThemeId(preset.id)}
            />
          ))}
        </div>
      </Demo>

      <ThemeBuilder />
    </div>
  )
}

interface PresetTileProps {
  preset: ThemePreset
  active: boolean
  onApply: () => void
}

function PresetTile({ preset, active, onApply }: PresetTileProps) {
  return (
    <div className="themes-tile" data-active={active}>
      <div data-theme={preset.id} className={`${PREVIEW} sui-theme`}>
        <Card>
          <CardHeader>
            <CardTitle as="h3">{preset.name}</CardTitle>
            <CardDescription>{preset.description}</CardDescription>
          </CardHeader>
          <CardContent className="stack-sm">
            <div className="themes-tile__row">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Badge tone="success">Live</Badge>
              <Badge tone="primary" variant="solid">
                New
              </Badge>
            </div>
            <MetricTile label="Revenue" value="$248k" delta="+12.4%" trend="up" tone="primary" />
            <Sparkline data={SPARK_SERIES} height={36} />
            <Progress value={68} size="sm" aria-label="Quarterly target" />
          </CardContent>
        </Card>
        <div className="themes-tile__foot">
          <span className="themes-swatches" aria-hidden="true">
            {SWATCH_TOKENS.map((token) => (
              <span
                key={token}
                className="themes-swatch"
                title={`--${token}`}
                style={{ background: `var(--${token})` }}
              />
            ))}
          </span>
          <Button
            size="sm"
            variant={active ? 'secondary' : 'outline'}
            onClick={onApply}
            disabled={active}
            aria-label={active ? `${preset.name} is applied` : `Apply ${preset.name}`}
          >
            {active ? (
              <>
                <CheckIcon /> Applied
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

const TINTS: { value: NeutralTint; label: string }[] = [
  { value: 'pure', label: 'Pure grey' },
  { value: 'subtle', label: 'Subtle tint' },
  { value: 'tinted', label: 'Tinted' },
]

/** Seed colours in, a complete light and dark theme out. */
function ThemeBuilder() {
  const [primary, setPrimary] = useState('#0f766e')
  const [accent, setAccent] = useState('#f97362')
  const [radius, setRadius] = useState(0.75)
  const [tint, setTint] = useState<NeutralTint>('subtle')
  const [copied, setCopied] = useState(false)

  const options = useMemo<CreateThemeOptions>(() => {
    // The hex field can be mid-edit or empty; the generator throws on a
    // non-colour, so fall back rather than blank the preview.
    const next: CreateThemeOptions = {
      primary: normalizeHex(primary) ?? '#0f766e',
      neutralTint: tint,
      radius: `${radius}rem`,
    }
    const accentHex = normalizeHex(accent)
    if (accentHex) next.accent = accentHex
    return next
  }, [primary, accent, radius, tint])

  const previewCss = useMemo(() => scopedCss(CUSTOM_ID, options), [options])
  const shippedCss = useMemo(() => createThemeCss(options), [options])

  function startFrom(id: string) {
    const preset = THEME_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setPrimary(preset.seed.primary)
    setAccent('accent' in preset.seed ? preset.seed.accent : '')
    setRadius(Number.parseFloat(preset.radius))
    setTint(preset.neutralTint)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shippedCss)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the CSS is still selectable in the block below.
    }
  }

  return (
    <Demo
      title="Build your own"
      note="Pick a brand colour, an accent and a radius. createThemeCss derives every other token, with each fill and its label checked to 4.5:1 in both modes."
      inline={false}
    >
      <style>{previewCss}</style>
      <div className="stack">
        <div className="themes-builder">
          <div className="stack-sm">
            <Field label="Start from a preset">
              <Select onValueChange={startFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Primary" description="Filled buttons, active states and focus rings.">
              <ColorInput value={primary} onValueChange={setPrimary} />
            </Field>
            <Field label="Accent" description="The second chart series. Clear it to derive one.">
              <ColorInput value={accent} onValueChange={setAccent} />
            </Field>
            <Field label={`Radius — ${radius}rem`}>
              <Slider
                min={0}
                max={1.5}
                step={0.125}
                value={[radius]}
                onValueChange={([value]) => setRadius(value ?? 0)}
              />
            </Field>
            <Field label="Neutral tint" description="How much the greys pick up the brand hue.">
              <Select value={tint} onValueChange={(value) => setTint(value as NeutralTint)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TINTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div data-theme={CUSTOM_ID} className={`${PREVIEW} sui-theme`}>
            <Card>
              <CardHeader>
                <CardIcon>
                  <PaletteIcon />
                </CardIcon>
                <CardTitle as="h3">Invoice INV-1042</CardTitle>
                <CardDescription>Harbour Street fit-out · due in 5 days</CardDescription>
                <CardAction>
                  <Badge tone="info">Sent</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="stack-sm">
                <MetricGrid columns={2}>
                  <MetricTile label="Amount" value="$18,420" tone="primary" />
                  <MetricTile label="Paid" value="62%" delta="+8%" trend="up" tone="success" />
                </MetricGrid>
                <Progress value={62} aria-label="Paid so far" />
                <Field label="Reminder email">
                  <Input type="email" defaultValue="accounts@harbourst.example" />
                </Field>
                <label className="choice">
                  <Switch defaultChecked /> Send a reminder before the due date
                </label>
                <BarChart
                  data={CHART_MONTHS.slice(-6)}
                  xKey="month"
                  height={150}
                  series={[
                    { key: 'bookings', label: 'Invoiced' },
                    { key: 'completed', label: 'Paid' },
                  ]}
                />
              </CardContent>
              <CardFooter bordered>
                <Button variant="outline" size="sm">
                  Download PDF
                </Button>
                <Button size="sm">Record payment</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="stack-sm">
          <div className="themes-code-head">
            <strong>Generated CSS</strong>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="code-block themes-code">{shippedCss}</pre>
        </div>

        <Alert tone="info">
          <AlertTitle>Ship it as CSS</AlertTitle>
          <AlertDescription>
            Paste the output into your global stylesheet, or render it in a{' '}
            <code>&lt;style&gt;</code> from a Server Component for a per-tenant theme. Pass{' '}
            <code>selector</code> and <code>darkSelector</code> to scope it, as this preview does.
          </AlertDescription>
        </Alert>
      </div>
    </Demo>
  )
}
