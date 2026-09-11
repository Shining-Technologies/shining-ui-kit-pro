import {
  Badge,
  BUILT_IN_PALETTES,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  LineChart,
  PalettePreview,
  ProjectEditor,
  Sparkline,
  Stat,
  UIKitProvider,
  useUIKit,
  type ProjectDefinition,
} from '@shining-ui-kit/react'
import { useState } from 'react'
import { CHART_MONTHS, SPARK_SERIES } from '../data'
import { Demo } from './Demo'

/**
 * Every palette, rendered at once.
 *
 * Each tile is its own `<UIKitProvider>` in `local` scope — the mode that
 * exists precisely so several projects can be shown side by side on one page
 * without fighting over the document root.
 */
export function Projects() {
  const { project, projects, setProject } = useUIKit()
  const [creating, setCreating] = useState(false)

  const custom = projects.filter((p) => !p.builtIn)

  return (
    <div className="stack">
      <Demo
        title="Presets"
        note="Each tile below renders the same components under a different project. Click one to make it active."
        inline={false}
      >
        <div className="grid-3">
          {BUILT_IN_PALETTES.map((palette) => (
            <ProjectTile
              key={palette.id}
              palette={palette}
              active={palette.id === project.id}
              onSelect={() => setProject(palette.id)}
            />
          ))}
        </div>
      </Demo>

      <Demo
        title="Your projects"
        note="Created here, saved in this browser, and available from the switcher in the bar."
        inline={false}
      >
        {custom.length === 0 ? (
          <Card variant="flat">
            <CardContent className="stack-sm">
              <p className="muted">
                No projects yet. Start from a preset, change the colours that matter, and everything
                else is generated — hovers, borders, dark mode, chart series and a readable label
                colour on every fill.
              </p>
              <Button onClick={() => setCreating(true)} style={{ alignSelf: 'flex-start' }}>
                Create a project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid-3">
            {custom.map((palette) => (
              <ProjectTile
                key={palette.id}
                palette={palette}
                active={palette.id === project.id}
                onSelect={() => setProject(palette.id)}
              />
            ))}
            <Card variant="flat" interactive onClick={() => setCreating(true)}>
              <CardContent className="tile__new">+ New project</CardContent>
            </Card>
          </div>
        )}
      </Demo>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Four colours and a shape. Everything else is derived.
            </DialogDescription>
          </DialogHeader>
          <ProjectEditor onSubmit={() => setCreating(false)} onCancel={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ProjectTileProps {
  palette: ProjectDefinition
  active: boolean
  onSelect: () => void
}

function ProjectTile({ palette, active, onSelect }: ProjectTileProps) {
  return (
    <div className="tile" data-active={active}>
      <UIKitProvider project={palette} mode="light" scope="local" className="tile__preview">
        <Card>
          <CardHeader>
            <CardTitle>{palette.name}</CardTitle>
            <CardDescription>{palette.description}</CardDescription>
          </CardHeader>
          <CardContent className="stack-sm">
            <div className="demo__body demo__body--inline">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Badge tone="success" variant="soft">
                Live
              </Badge>
            </div>
            <Stat label="Revenue" value="$248k" delta="+12.4%" trend="up" />
            <Sparkline data={SPARK_SERIES} area />
            <LineChart
              data={CHART_MONTHS.slice(-8)}
              xKey="month"
              height={90}
              legend={false}
              showXAxis={false}
              showYAxis={false}
              margin={{ left: 4, right: 4, bottom: 4 }}
              series={[{ key: 'bookings' }, { key: 'completed' }, { key: 'cancelled' }]}
              area
              smooth
            />
          </CardContent>
        </Card>
      </UIKitProvider>

      <div className="tile__foot">
        <PalettePreview project={palette} />
        <Button size="sm" variant={active ? 'secondary' : 'outline'} onClick={onSelect}>
          {active ? 'Active' : 'Use this'}
        </Button>
      </div>
    </div>
  )
}
