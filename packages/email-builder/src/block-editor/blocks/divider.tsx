import { resolveBrand, type DividerBlock } from '../../design'
import { ColorInput, NumberInput, Section } from '../controls'
import { useEditorApi } from '../context'
import {
  boxStyle,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

function View({ block }: ViewProps<DividerBlock>) {
  const api = useEditorApi()
  return (
    <div className="seb-b seb-b-divider" style={boxStyle(block, api.brand)}>
      <div
        role="separator"
        style={{
          width: `${block.width}%`,
          margin: '0 auto',
          borderTop: `${block.thickness}px solid ${resolveBrand(block.color, api.brand)}`,
        }}
      />
    </div>
  )
}

function Inspector({ block }: InspectorProps<DividerBlock>) {
  const { api, set } = useBlockEdit(block)
  return (
    <>
      <Section title="Divider">
        <ColorInput
          label="Colour"
          value={block.color}
          brand={api.brand}
          onChange={(color) => set({ color: color ?? '#d1d5db' })}
        />
        <NumberInput
          label="Thickness"
          value={block.thickness}
          min={1}
          max={8}
          unit="px"
          onChange={(thickness) => set({ thickness }, 'thickness')}
        />
        <NumberInput
          label="Width"
          value={block.width}
          min={10}
          max={100}
          unit="%"
          onChange={(width) => set({ width }, 'width')}
        />
      </Section>
      <StyleSection block={block} fields={divider.style} />
    </>
  )
}

export const divider: BlockModule<DividerBlock> = {
  type: 'divider',
  label: 'Divider',
  icon: 'divider',
  summary: () => 'line',
  View,
  Inspector,
  style: ['padding', 'background'],
}
