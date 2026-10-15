'use client'

import {
  ROW_LAYOUTS,
  findBlock,
  findColumn,
  findRow,
  layoutOf,
  type HideOn,
  type VAlign,
} from '../design'
import { blockLabel, blockModule } from './blocks'
import { SaveRowForm } from './canvas'
import {
  ColorInput,
  FontInput,
  NumberInput,
  PaddingInput,
  Section,
  Segmented,
  SelectInput,
} from './controls'
import { useEditorApi } from './context'
import { Icon } from './icons'

const HIDE_OPTIONS: { value: 'none' | 'mobile' | 'desktop'; label: string }[] = [
  { value: 'none', label: 'Nothing (show everywhere)' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
]
const hideValue = (value: HideOn) => value ?? 'none'
const hideFrom = (value: 'none' | 'mobile' | 'desktop'): HideOn => (value === 'none' ? null : value)

function EmailSettings() {
  const api = useEditorApi()
  const { settings } = api.design
  return (
    <>
      <header className="seb-props-head">
        <h2>Email settings</h2>
        <p>These apply to the whole email. Select a block, row or column to change it.</p>
      </header>
      <Section title="Layout">
        <NumberInput
          label="Width"
          value={settings.width}
          min={480}
          max={700}
          unit="px"
          onChange={(width) => api.updateSettings({ width }, 'settings.width')}
        />
        <PaddingInput
          label="Padding"
          value={settings.padding}
          fallback={settings.padding}
          max={100}
          onChange={(padding) => (padding ? api.updateSettings({ padding }) : null)}
        />
      </Section>
      <Section title="Colour and font">
        <ColorInput
          label="Page background"
          value={settings.background}
          brand={api.brand}
          onChange={(background) =>
            api.updateSettings({ background: background ?? 'brand.background_color' })
          }
        />
        <ColorInput
          label="Content background"
          value={settings.content_background}
          brand={api.brand}
          onChange={(content_background) =>
            api.updateSettings({
              content_background: content_background ?? 'brand.content_background_color',
            })
          }
        />
        <FontInput
          value={settings.font}
          onChange={(font) => api.updateSettings({ font: font ?? 'brand.body_font' })}
        />
      </Section>
    </>
  )
}

function RowSettings({ id }: { id: string }) {
  const api = useEditorApi()
  const found = findRow(api.design, id)
  if (!found) return null
  const { row, index } = found
  const current = layoutOf(row)
  return (
    <>
      <header className="seb-props-head">
        <h2>Row {index + 1}</h2>
        <p>{row.columns.length === 1 ? 'One column' : `${row.columns.length} columns`}</p>
      </header>
      <Section title="Layout">
        <div className="seb-layout-choices" role="group" aria-label="Row layout">
          {ROW_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              className="seb-tile"
              aria-label={`Row layout ${layout.label}`}
              aria-pressed={current === layout.id}
              onClick={() => api.setLayout(row.id, layout.id)}
            >
              <span className="seb-layout-preview" aria-hidden="true">
                {layout.widths.map((width, i) => (
                  <span key={i} style={{ flex: `${width} 1 0` }} />
                ))}
              </span>
              <span>{layout.label}</span>
            </button>
          ))}
        </div>
        {row.columns.length > 1 && (
          <NumberInput
            label="Gap between columns"
            value={row.gap ?? 16}
            min={0}
            max={40}
            unit="px"
            onChange={(gap) => api.updateRow(row.id, { gap }, `${row.id}:gap`)}
          />
        )}
        <div className="seb-field" role="group" aria-label="Columns">
          <span>Columns</span>
          <div className="seb-chip-list">
            {row.columns.map((column, i) => (
              <button
                key={column.id}
                type="button"
                className="seb-action"
                onClick={() => api.select({ kind: 'column', id: column.id })}
              >
                Column {i + 1} ({column.width}%)
              </button>
            ))}
          </div>
        </div>
      </Section>
      <Section title="Style">
        <PaddingInput
          label="Padding"
          value={row.padding}
          fallback={row.padding}
          max={100}
          onChange={(padding) => (padding ? api.updateRow(row.id, { padding }) : null)}
        />
        <ColorInput
          label="Background"
          value={row.background}
          brand={api.brand}
          clearable
          onChange={(background) => api.updateRow(row.id, { background })}
        />
        <SelectInput
          label="Hide on"
          value={hideValue(row.hide_on)}
          options={HIDE_OPTIONS}
          onChange={(value) => api.updateRow(row.id, { hide_on: hideFrom(value) })}
        />
      </Section>
      {api.savedRows.enabled && (
        <Section title="Save as row">
          <p className="seb-hint">Keep this row to reuse in other emails.</p>
          <SaveRowForm rowId={row.id} />
        </Section>
      )}
      <Section title="Row actions">
        <div className="seb-chip-list">
          <button type="button" className="seb-action" onClick={() => api.duplicateRow(row.id)}>
            <Icon name="copy" /> Duplicate row
          </button>
          <button
            type="button"
            className="seb-action seb-action-danger"
            onClick={() => api.removeRow(row.id)}
          >
            <Icon name="trash" /> Delete row
          </button>
        </div>
      </Section>
    </>
  )
}

function ColumnSettings({ id }: { id: string }) {
  const api = useEditorApi()
  const found = findColumn(api.design, id)
  if (!found) return null
  const { column, rowIndex, columnIndex } = found
  return (
    <>
      <header className="seb-props-head">
        <h2>
          Column {columnIndex + 1} of row {rowIndex + 1}
        </h2>
        <p>{column.width}% wide</p>
      </header>
      <Section title="Column">
        <Segmented
          label="Vertical alignment"
          value={column.valign}
          options={[
            { value: 'top', label: 'Top' },
            { value: 'middle', label: 'Middle' },
            { value: 'bottom', label: 'Bottom' },
          ]}
          onChange={(valign) => api.updateColumn(column.id, { valign: valign as VAlign })}
        />
        <SelectInput
          label="Hide on"
          value={hideValue(column.hide_on)}
          options={HIDE_OPTIONS}
          onChange={(value) => api.updateColumn(column.id, { hide_on: hideFrom(value) })}
        />
        <ColorInput
          label="Background"
          value={column.background}
          brand={api.brand}
          clearable
          onChange={(background) => api.updateColumn(column.id, { background })}
        />
        <PaddingInput
          label="Padding"
          value={column.padding}
          fallback={[0, 0, 0, 0]}
          max={80}
          nullable
          onChange={(padding) => api.updateColumn(column.id, { padding })}
        />
      </Section>
      <Section title="Row">
        <button
          type="button"
          className="seb-action"
          onClick={() => api.select({ kind: 'row', id: found.row.id })}
        >
          Select row {rowIndex + 1}
        </button>
      </Section>
    </>
  )
}

function BlockSettings({ id }: { id: string }) {
  const api = useEditorApi()
  const found = findBlock(api.design, id)
  if (!found) return null
  const block = found.block
  const Inspector = blockModule(block.type).Inspector as (props: {
    block: typeof block
  }) => JSX.Element
  return (
    <>
      <header className="seb-props-head">
        <h2>{blockLabel(block.type)}</h2>
        <p>
          Row {found.rowIndex + 1}, column {found.columnIndex + 1}
        </p>
      </header>
      <Inspector block={block} />
      <Section title="Block actions">
        <div className="seb-chip-list">
          <button
            type="button"
            className="seb-action"
            disabled={block.type === 'footer'}
            onClick={() => api.duplicateBlock(block.id)}
          >
            <Icon name="copy" /> Duplicate block
          </button>
          <button
            type="button"
            className="seb-action seb-action-danger"
            onClick={() => api.removeBlock(block.id)}
          >
            <Icon name="trash" /> Delete block
          </button>
          <button
            type="button"
            className="seb-action"
            onClick={() => api.select({ kind: 'row', id: found.row.id })}
          >
            Select row {found.rowIndex + 1}
          </button>
        </div>
      </Section>
    </>
  )
}

/** Right pane: the selection's settings, or the email's own when nothing is selected. */
export function Properties() {
  const api = useEditorApi()
  const { selection } = api
  return (
    <fieldset className="seb-props" disabled={api.disabled}>
      {!selection && <EmailSettings />}
      {selection?.kind === 'row' && <RowSettings key={selection.id} id={selection.id} />}
      {selection?.kind === 'column' && <ColumnSettings key={selection.id} id={selection.id} />}
      {selection?.kind === 'block' && <BlockSettings key={selection.id} id={selection.id} />}
    </fieldset>
  )
}
