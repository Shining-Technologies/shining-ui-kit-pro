import { useState } from 'react'
import {
  resolveBrand,
  type Align,
  type DataSourceDefinition,
  type TableBlock,
  type TableColumn,
} from '../../design'
import {
  ALIGN_OPTIONS,
  ColorInput,
  NumberInput,
  Section,
  Segmented,
  SelectInput,
  TextInput,
  Toggle,
} from '../controls'
import { useEditorApi } from '../context'
import {
  boxStyle,
  sharedStyleOf,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

const MAX_COLUMNS = 6

/** Python's ``round``: halves go to the even number (the server rounds with it). */
function roundHalfEven(value: number): number {
  const floor = Math.floor(value)
  const diff = value - floor
  if (diff > 0.5) return floor + 1
  if (diff < 0.5) return floor
  return floor % 2 === 0 ? floor : floor + 1
}

/**
 * The stripe colour: ``value`` (``#rgb`` or ``#rrggbb``) mixed with white, so it reads as a faint
 * version of the border colour. A port of the server's ``_tint(border, 0.1)``, which also
 * answers ``#f5f5f5`` for anything it cannot read.
 */
export function tintColor(value: string, amount = 0.1): string {
  let digits = value.replace(/^#+/, '')
  if (digits.length === 3) digits = [...digits].map((ch) => ch + ch).join('')
  const parts = [0, 2, 4].map((i) => digits.slice(i, i + 2))
  if (digits.length < 6 || !parts.every((part) => /^[0-9a-fA-F]{2}$/.test(part))) return '#f5f5f5'
  const channels = parts.map((part) => {
    const c = parseInt(part, 16)
    return roundHalfEven(c + (255 - c) * (1 - amount))
  })
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** The columns a block draws at the canvas width: phones lose the ones hidden on phones. */
function shownColumns(block: TableBlock, mobile: boolean): TableColumn[] {
  return block.columns.filter((column) => !(mobile && column.hide_on_mobile))
}

function View({ block }: ViewProps<TableBlock>) {
  const api = useEditorApi()
  const { brand } = api
  const source = api.dataSources.find((candidate) => candidate.key === block.source)
  const style = sharedStyleOf(block)
  const size = style.font_size ?? 14
  const columns = shownColumns(block, api.device === 'mobile')
  const border = resolveBrand(block.border_color ?? 'brand.muted_text_color', brand)
  const headBackground = resolveBrand(block.header_background ?? 'brand.primary_color', brand)
  const headColor = resolveBrand(block.header_color ?? 'brand.button_text_color', brand)
  const muted = resolveBrand('brand.muted_text_color', brand)
  const stripe = tintColor(border)
  const rows = source?.sample ?? []
  // A line with neither a label nor a value is dropped, as the server does.
  const totals = (
    block.totals && block.totals === source?.totals_key ? (source.sample_totals ?? []) : []
  ).filter((total) => total.label || total.value)

  if (!source || rows.length === 0) {
    return (
      <div className="seb-b seb-b-table" style={boxStyle(block, brand)}>
        <p className="seb-table-empty" role="note">
          No sample data for {block.source}
        </p>
      </div>
    )
  }

  const cell = (align: Align | undefined) => ({
    padding: '8px 10px',
    textAlign: align ?? 'left',
    borderBottom: `1px solid ${border}`,
    verticalAlign: 'top' as const,
  })

  return (
    <div className="seb-b seb-b-table" style={{ ...boxStyle(block, brand), fontSize: size }}>
      <span className="seb-table-chip">Sample data</span>
      <table
        className="seb-table"
        style={{ width: '100%', borderCollapse: 'collapse' }}
        aria-label={`Table of ${source.label}, sample data`}
      >
        {block.show_header !== false && (
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th
                  key={`${column.key}-${i}`}
                  scope="col"
                  style={{
                    ...cell(column.align),
                    fontSize: size - 1,
                    fontWeight: 'bold',
                    width: column.width ? `${column.width}%` : undefined,
                    background: headBackground,
                    color: headColor,
                  }}
                >
                  {column.label ?? ''}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, i) => {
                const secondary = column.secondary ? row[column.secondary] : ''
                return (
                  <td
                    key={`${column.key}-${i}`}
                    style={{
                      ...cell(column.align),
                      background: block.striped && rowIndex % 2 === 1 ? stripe : undefined,
                    }}
                  >
                    {row[column.key] ?? ''}
                    {secondary ? (
                      <div style={{ paddingTop: 2, fontSize: size - 2, color: muted }}>
                        {secondary}
                      </div>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
          {totals.map((total, i) => {
            const emphasis = total.emphasis
              ? { fontWeight: 'bold' as const, borderTop: `2px solid ${border}` }
              : {}
            const look = { padding: '8px 10px', textAlign: 'right' as const, ...emphasis }
            if (!total.value || columns.length < 2) {
              // A note has the whole width; with one column a figure follows its label ("Total: 5").
              const shown = !total.value
                ? total.label
                : total.label
                  ? `${total.label}: ${total.value}`
                  : total.value
              return (
                <tr key={`total-${i}`}>
                  <td colSpan={Math.max(columns.length, 1)} style={look}>
                    {shown}
                  </td>
                </tr>
              )
            }
            return (
              <tr key={`total-${i}`}>
                <td colSpan={columns.length - 1} style={look}>
                  {total.label}
                </td>
                <td style={{ ...look, whiteSpace: 'nowrap' }}>{total.value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** A column for the first field of ``source`` that no column shows yet. */
function nextColumn(source: DataSourceDefinition | undefined, columns: TableColumn[]): TableColumn {
  const used = new Set(columns.map((column) => column.key))
  const field = source?.fields.find((candidate) => !used.has(candidate.key)) ?? source?.fields[0]
  return field
    ? { key: field.key, label: field.label, align: field.align ?? 'left' }
    : { key: 'name', label: '' }
}

function Inspector({ block }: InspectorProps<TableBlock>) {
  const { api, set } = useBlockEdit(block)
  const [refusal, setRefusal] = useState<string | null>(null)
  const source = api.dataSources.find((candidate) => candidate.key === block.source)
  // A refusal is shown under the table's settings, except for the text and number fields
  // (those, which pass a coalescing key, show their own).
  const apply = (patch: Partial<TableBlock>, key?: string) => {
    const result = set(patch, key)
    setRefusal(key ? null : result)
    return result
  }
  const setColumns = (columns: TableColumn[], key?: string) => apply({ columns }, key)
  const setColumn = (index: number, patch: Partial<TableColumn>, key?: string) =>
    setColumns(
      block.columns.map((column, i) => (i === index ? { ...column, ...patch } : column)),
      key,
    )
  const without = (index: number, ...names: (keyof TableColumn)[]) => {
    const copy: Record<string, unknown> = { ...block.columns[index] }
    for (const name of names) delete copy[name]
    return setColumns(
      block.columns.map((column, i) => (i === index ? (copy as unknown as TableColumn) : column)),
    )
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= block.columns.length) return
    const next = [...block.columns]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    setColumns(next)
  }

  const sourceOptions = [
    ...(source ? [] : [{ value: block.source, label: `${block.source} (not available)` }]),
    ...api.dataSources.map((candidate) => ({ value: candidate.key, label: candidate.label })),
  ]

  return (
    <>
      <Section title="Table">
        <SelectInput
          label="Data"
          value={block.source}
          options={sourceOptions}
          onChange={(key) => {
            const chosen = api.dataSources.find((candidate) => candidate.key === key)
            if (!chosen) return
            apply({
              source: chosen.key,
              columns: chosen.default_columns
                .slice(0, MAX_COLUMNS)
                .map((column) => ({ ...column })),
              totals: block.totals ? (chosen.totals_key ?? undefined) : undefined,
            })
          }}
        />
        <p className="seb-hint">
          The table lists what the email is about (a deal&rsquo;s items). If there is nothing to
          list when the email is sent, the table is left out.
        </p>
        {refusal && (
          <p className="seb-error" role="alert">
            {refusal}
          </p>
        )}
      </Section>

      <Section title="Columns">
        {block.columns.map((column, index) => {
          const n = index + 1
          const fieldOptions = [
            ...(source?.fields.some((field) => field.key === column.key)
              ? []
              : [{ value: column.key, label: column.key }]),
            ...(source?.fields ?? []).map((field) => ({ value: field.key, label: field.label })),
          ]
          const secondaryOptions = [
            { value: '', label: 'Nothing' },
            ...(source?.fields ?? [])
              .filter((field) => field.key !== column.key)
              .map((field) => ({ value: field.key, label: field.label })),
            ...(column.secondary && !source?.fields.some((field) => field.key === column.secondary)
              ? [{ value: column.secondary, label: column.secondary }]
              : []),
          ]
          return (
            <div key={index} className="seb-link-row" role="group" aria-label={`Column ${n}`}>
              <SelectInput
                label={`Column ${n} shows`}
                value={column.key}
                options={fieldOptions}
                onChange={(key) => setColumn(index, { key })}
              />
              <TextInput
                label={`Column ${n} heading`}
                value={column.label ?? ''}
                onChange={(label) => setColumn(index, { label }, `col${index}.label`)}
              />
              <SelectInput
                label={`Column ${n} second line`}
                value={column.secondary ?? ''}
                options={secondaryOptions}
                onChange={(value) =>
                  value ? setColumn(index, { secondary: value }) : without(index, 'secondary')
                }
              />
              <Segmented
                label={`Column ${n} alignment`}
                value={column.align ?? 'left'}
                options={ALIGN_OPTIONS}
                onChange={(align) => setColumn(index, { align })}
              />
              <Toggle
                label={`Set a width for column ${n}`}
                checked={typeof column.width === 'number'}
                onChange={(on) => (on ? setColumn(index, { width: 20 }) : without(index, 'width'))}
              />
              {typeof column.width === 'number' && (
                <NumberInput
                  label={`Column ${n} width`}
                  value={column.width}
                  min={5}
                  max={90}
                  unit="%"
                  onChange={(width) => setColumn(index, { width }, `col${index}.width`)}
                />
              )}
              <Toggle
                label={`Hide column ${n} on phones`}
                checked={column.hide_on_mobile === true}
                onChange={(hide_on_mobile) =>
                  hide_on_mobile
                    ? setColumn(index, { hide_on_mobile })
                    : without(index, 'hide_on_mobile')
                }
              />
              <div className="seb-chip-list">
                <button
                  type="button"
                  className="seb-action"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  Move column {n} up
                </button>
                <button
                  type="button"
                  className="seb-action"
                  disabled={index === block.columns.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  Move column {n} down
                </button>
                <button
                  type="button"
                  className="seb-action seb-action-danger"
                  disabled={block.columns.length <= 1}
                  onClick={() => setColumns(block.columns.filter((_, i) => i !== index))}
                >
                  Remove column {n}
                </button>
              </div>
            </div>
          )
        })}
        <button
          type="button"
          className="seb-action"
          disabled={block.columns.length >= MAX_COLUMNS}
          onClick={() => setColumns([...block.columns, nextColumn(source, block.columns)])}
        >
          Add a column
        </button>
      </Section>

      <Section title="Look">
        {(source?.totals_key || block.totals) && (
          <Toggle
            label="Show totals under the table"
            checked={Boolean(block.totals)}
            onChange={(on) => apply({ totals: on ? (source?.totals_key ?? undefined) : undefined })}
          />
        )}
        <Toggle
          label="Show the heading row"
          checked={block.show_header !== false}
          onChange={(show_header) => apply({ show_header })}
        />
        <Toggle
          label="Shade every second row"
          checked={block.striped === true}
          onChange={(striped) => apply({ striped })}
        />
        <ColorInput
          label="Heading background"
          value={block.header_background ?? 'brand.primary_color'}
          brand={api.brand}
          onChange={(color) => apply({ header_background: color ?? 'brand.primary_color' })}
        />
        <ColorInput
          label="Heading text"
          value={block.header_color ?? 'brand.button_text_color'}
          brand={api.brand}
          onChange={(color) => apply({ header_color: color ?? 'brand.button_text_color' })}
        />
        <ColorInput
          label="Lines"
          value={block.border_color ?? 'brand.muted_text_color'}
          brand={api.brand}
          onChange={(color) => apply({ border_color: color ?? 'brand.muted_text_color' })}
        />
      </Section>
      <StyleSection block={block} fields={table.style} />
    </>
  )
}

export const table: BlockModule<TableBlock> = {
  type: 'table',
  label: 'Table',
  icon: 'table',
  summary: (block) => block.source,
  View,
  Inspector,
  style: ['padding', 'background', 'color', 'font', 'font_size', 'font_weight'],
}
