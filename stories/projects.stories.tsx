import type { Meta, StoryObj } from '@storybook/react'
import {
  BUILT_IN_PALETTES,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ColorModeToggle,
  LineChart,
  ProjectEditor,
  ProjectRegistry,
  ProjectSwitcher,
  Stat,
  TokenSwatchGrid,
  UIKitProvider,
  createProject,
  resolveProject,
} from '@shining-technologies/ui-kit-react'
import { useMemo } from 'react'

/**
 * The project system: what a palette is, and what switching one actually does.
 *
 * Each story mounts its own `<UIKitProvider>` in `local` scope, which is the
 * mode that exists so several projects can share a page without fighting over
 * the document root.
 */
const meta = {
  title: 'Projects/Palettes',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const DATA = [
  { month: 'Jan', a: 420, b: 388, c: 120 },
  { month: 'Feb', a: 468, b: 431, c: 168 },
  { month: 'Mar', a: 512, b: 480, c: 142 },
  { month: 'Apr', a: 498, b: 452, c: 190 },
  { month: 'May', a: 586, b: 548, c: 176 },
  { month: 'Jun', a: 631, b: 602, c: 214 },
]
const SERIES = [{ key: 'a' }, { key: 'b' }, { key: 'c' }]

function Sampler({ name, description }: { name: string; description?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="sb-stack">
        <div className="sb-row">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Badge tone="success">Live</Badge>
          <Badge tone="warning">Due</Badge>
        </div>
        <Stat label="Revenue" value="$248k" delta="+12.4%" trend="up" />
        <LineChart
          data={DATA}
          xKey="month"
          series={SERIES}
          height={110}
          legend={false}
          showYAxis={false}
          area
          smooth
        />
      </CardContent>
    </Card>
  )
}

/** Every shipped palette, rendering the same components. */
export const AllPalettes: Story = {
  render: () => (
    <div className="sb-grid">
      {BUILT_IN_PALETTES.map((palette) => (
        <UIKitProvider key={palette.id} project={palette} mode="light" scope="local">
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem' }}>
            <Sampler name={palette.name} description={palette.description} />
          </div>
        </UIKitProvider>
      ))}
    </div>
  ),
}

/** The same palette in both modes. Dark is generated, not hand-authored. */
export const LightAndDark: Story = {
  render: () => (
    <div className="sb-grid">
      {(['light', 'dark'] as const).map((mode) => (
        <UIKitProvider key={mode} project="shining" mode={mode} scope="local">
          <div style={{ padding: '1rem', borderRadius: '0.75rem' }}>
            <Sampler name={`Shining — ${mode}`} />
          </div>
        </UIKitProvider>
      ))}
    </div>
  ),
}

/**
 * An arbitrary brand colour, with nothing else supplied.
 *
 * The generator still produces a full palette, a matching dark mode, five
 * chart series and a readable label colour on every filled surface.
 */
export const FromOneColour: Story = {
  render: function FromOneColourStory() {
    const projects = useMemo(
      () =>
        ['#e11d48', '#38bdf8', '#facc15', '#7c3aed'].map((primary) =>
          createProject({ name: primary, seed: { primary } }),
        ),
      [],
    )

    return (
      <div className="sb-grid">
        {projects.map((project) => (
          <UIKitProvider key={project.id} project={project} mode="light" scope="local">
            <div style={{ padding: '0.75rem', borderRadius: '0.75rem' }}>
              <Sampler
                name={project.name}
                description={`primaryForeground resolved to ${resolveProject(project).light.colors?.primaryForeground}`}
              />
            </div>
          </UIKitProvider>
        ))}
      </div>
    )
  },
}

/** The switcher, the mode toggle and the token grid, backed by a real registry. */
export const SwitchingLive: Story = {
  render: function SwitchingLiveStory() {
    const registry = useMemo(() => new ProjectRegistry({ storage: null }), [])
    return (
      <UIKitProvider registry={registry} defaultProject="shining" defaultMode="light" scope="local">
        <div style={{ padding: '1rem', borderRadius: '0.75rem' }} className="sb-stack">
          <div className="sb-row">
            <ProjectSwitcher />
            <ColorModeToggle />
          </div>
          <Sampler name="Live" description="Switch project or mode above." />
          <TokenSwatchGrid />
        </div>
      </UIKitProvider>
    )
  },
}

/** The editor an application embeds to let people build their own project. */
export const Editor: Story = {
  render: function EditorStory() {
    const registry = useMemo(() => new ProjectRegistry({ storage: null }), [])
    return (
      <UIKitProvider registry={registry} defaultProject="slate" scope="local">
        <div style={{ padding: '1rem', borderRadius: '0.75rem', maxWidth: '46rem' }}>
          <ProjectEditor />
        </div>
      </UIKitProvider>
    )
  },
}
