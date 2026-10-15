import type { SpacerBlock } from '../../design'
import { NumberInput, Section } from '../controls'
import { useEditorApi } from '../context'
import {
  boxStyle,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

function View({ block }: ViewProps<SpacerBlock>) {
  const api = useEditorApi()
  return (
    <div className="seb-b seb-b-spacer" style={boxStyle(block, api.brand)}>
      <div className="seb-spacer" style={{ height: block.height }}>
        <span>{block.height}px</span>
      </div>
    </div>
  )
}

function Inspector({ block }: InspectorProps<SpacerBlock>) {
  const { set } = useBlockEdit(block)
  return (
    <>
      <Section title="Spacer">
        <NumberInput
          label="Height"
          value={block.height}
          min={4}
          max={120}
          unit="px"
          onChange={(height) => set({ height }, 'height')}
        />
      </Section>
      <StyleSection block={block} fields={spacer.style} />
    </>
  )
}

export const spacer: BlockModule<SpacerBlock> = {
  type: 'spacer',
  label: 'Spacer',
  icon: 'spacer',
  summary: (block) => `${block.height} pixels`,
  View,
  Inspector,
  style: ['background'],
}
