import {
  Button,
  type Density,
  type FilterLayout,
  type ResponsiveMode,
  type TableLayout,
  type TableVariant,
} from '@shining-ui-kit/react'
import { Choice, Flag, Segmented } from './controls'

/** Every knob the playground offers, in one object so the panel stays a view. */
export interface PlaygroundState {
  variant: TableVariant
  density: Density
  responsiveMode: ResponsiveMode
  tableLayout: TableLayout
  filterLayout: FilterLayout
  themeName: string
  selection: boolean
  expansion: boolean
  actions: boolean
  pinActions: boolean
  framed: boolean
}

export const PLAYGROUND_DEFAULTS: PlaygroundState = {
  variant: 'default',
  density: 'comfortable',
  responsiveMode: 'scroll',
  tableLayout: 'fixed',
  filterLayout: 'panel',
  themeName: 'none',
  selection: true,
  expansion: false,
  actions: true,
  pinActions: true,
  framed: true,
}

const VARIANTS: TableVariant[] = [
  'default',
  'minimal',
  'compact',
  'borderless',
  'striped',
  'dashboard',
]
const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious']
const RESPONSIVE: ResponsiveMode[] = ['scroll', 'cards', 'auto']
const LAYOUTS: TableLayout[] = ['fixed', 'auto']
const FILTER_LAYOUTS: FilterLayout[] = ['panel', 'inline']

export interface PlaygroundControlsProps {
  value: PlaygroundState
  onChange: (patch: Partial<PlaygroundState>) => void
  onReset: () => void
  themeNames: string[]
}

/**
 * The playground's control panel — built out of the kit it is demonstrating.
 *
 * Raw `<select>` and `<input type="checkbox">` elements would have been less
 * code, and they would have been the one part of this gallery that does not
 * look like the library. The controls are grouped by what they affect rather
 * than listed in a row, because eleven knobs on one line is a wall, not a
 * choice.
 */
export function PlaygroundControls({
  value,
  onChange,
  onReset,
  themeNames,
}: PlaygroundControlsProps) {
  const dirty = (Object.keys(PLAYGROUND_DEFAULTS) as (keyof PlaygroundState)[]).some(
    (key) => value[key] !== PLAYGROUND_DEFAULTS[key],
  )

  return (
    <div className="pg__panel">
      <section className="pg__group">
        <h4 className="pg__legend">Appearance</h4>
        <div className="pg__fields">
          <Choice
            label="Variant"
            value={value.variant}
            options={VARIANTS}
            onChange={(variant) => onChange({ variant })}
          />
          <Choice
            label="Theme"
            value={value.themeName}
            options={themeNames}
            onChange={(themeName) => onChange({ themeName })}
          />
          <Segmented
            label="Density"
            value={value.density}
            options={DENSITIES}
            onChange={(density) => onChange({ density })}
          />
        </div>
      </section>

      <section className="pg__group">
        <h4 className="pg__legend">Layout</h4>
        <div className="pg__fields">
          <Segmented
            label="Responsive"
            value={value.responsiveMode}
            options={RESPONSIVE}
            onChange={(responsiveMode) => onChange({ responsiveMode })}
          />
          <Segmented
            label="Column widths"
            value={value.tableLayout}
            options={LAYOUTS}
            onChange={(tableLayout) => onChange({ tableLayout })}
          />
          <Segmented
            label="Filters"
            value={value.filterLayout}
            options={FILTER_LAYOUTS}
            onChange={(filterLayout) => onChange({ filterLayout })}
          />
        </div>
      </section>

      <section className="pg__group">
        <h4 className="pg__legend">Features</h4>
        <div className="pg__switches">
          <Flag
            label="Selection"
            checked={value.selection}
            onChange={(selection) => onChange({ selection })}
          />
          <Flag
            label="Expandable rows"
            checked={value.expansion}
            onChange={(expansion) => onChange({ expansion })}
          />
          <Flag
            label="Row actions"
            checked={value.actions}
            onChange={(actions) => onChange({ actions })}
          />
          <Flag
            label="Actions pinned right"
            checked={value.pinActions}
            disabled={!value.actions}
            onChange={(pinActions) => onChange({ pinActions })}
          />
          <Flag
            label="Scrolling rows only"
            checked={value.framed}
            onChange={(framed) => onChange({ framed })}
          />
        </div>
      </section>

      <div className="pg__foot">
        <pre className="pg__code">
          <code>{snippet(value)}</code>
        </pre>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>
          Reset
        </Button>
      </div>
    </div>
  )
}

/**
 * The current combination, as the code that produces it.
 *
 * Only the props that differ from their defaults appear, so the snippet stays
 * short and doubles as a statement about how little most tables need to say.
 */
function snippet(state: PlaygroundState): string {
  const props = [
    'data={users}',
    'columns={columns}',
    state.variant !== 'default' && `variant="${state.variant}"`,
    state.density !== 'comfortable' && `density="${state.density}"`,
    state.themeName !== 'none' && `theme={${state.themeName}Theme}`,
    state.responsiveMode !== 'scroll' && `responsiveMode="${state.responsiveMode}"`,
    state.tableLayout !== 'fixed' && `tableLayout="${state.tableLayout}"`,
    state.filterLayout !== 'panel' && `filterLayout="${state.filterLayout}"`,
    state.selection && 'enableRowSelection',
    state.expansion && 'renderExpandedRow={(row) => <Details row={row} />}',
    state.actions && 'rowActions={(row) => [{ icon: EyeIcon, label: "View", onClick: … }, …]}',
    state.actions && !state.pinActions && 'features={{ pinning: { actions: false } }}',
    state.framed && 'maxHeight={460}',
  ].filter((line): line is string => typeof line === 'string')

  return `<DataTable\n  ${props.join('\n  ')}\n/>`
}
