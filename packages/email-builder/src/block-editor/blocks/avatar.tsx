import type { AvatarBlock, AvatarShape } from '../../design'
import { AlignInput, NumberInput, Section, SelectInput, TextInput, UploadButton } from '../controls'
import { useEditorApi } from '../context'
import { Icon } from '../icons'
import {
  boxStyle,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const
const RADIUS: Record<AvatarShape, string> = { circle: '50%', rounded: '12%', square: '0' }

function View({ block }: ViewProps<AvatarBlock>) {
  const api = useEditorApi()
  const box = { width: block.size, height: block.size, borderRadius: RADIUS[block.shape] }
  return (
    <div
      className="seb-b seb-b-avatar"
      style={{
        ...boxStyle(block, api.brand),
        display: 'flex',
        justifyContent: JUSTIFY[block.align],
      }}
    >
      {block.src ? (
        <img
          src={block.src}
          alt={block.alt}
          draggable={false}
          style={{ ...box, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div className="seb-avatar-empty" role="img" aria-label="No picture yet" style={box}>
          <Icon
            name="avatar"
            width={Math.round(block.size / 2)}
            height={Math.round(block.size / 2)}
          />
        </div>
      )}
    </div>
  )
}

function Inspector({ block }: InspectorProps<AvatarBlock>) {
  const { api, set } = useBlockEdit(block)
  return (
    <>
      <Section title="Avatar">
        {api.onUploadImage && (
          <UploadButton
            label="Upload a picture"
            onFile={async (file) => {
              const uploaded = await api.onUploadImage!(file)
              const next: Partial<AvatarBlock> = { src: uploaded.url }
              if (uploaded.assetId) next.asset_id = uploaded.assetId
              if (uploaded.alt && !block.alt) next.alt = uploaded.alt
              const refused = set(next)
              if (refused) throw new Error(refused)
            }}
          />
        )}
        <TextInput
          label="Picture address"
          trim
          value={block.src}
          placeholder="https://"
          onChange={(src) => set({ src, asset_id: undefined }, 'src')}
        />
        <TextInput
          label="Description (alt text)"
          value={block.alt}
          placeholder="Who is in the picture"
          onChange={(alt) => set({ alt }, 'alt')}
        />
        <NumberInput
          label="Size"
          value={block.size}
          min={24}
          max={128}
          unit="px"
          onChange={(size) => set({ size }, 'size')}
        />
        <SelectInput
          label="Shape"
          value={block.shape}
          options={[
            { value: 'circle', label: 'Circle' },
            { value: 'rounded', label: 'Rounded' },
            { value: 'square', label: 'Square' },
          ]}
          onChange={(shape) => set({ shape })}
        />
        <AlignInput value={block.align} onChange={(align) => set({ align })} />
      </Section>
      <StyleSection block={block} fields={avatar.style} />
    </>
  )
}

export const avatar: BlockModule<AvatarBlock> = {
  type: 'avatar',
  label: 'Avatar',
  icon: 'avatar',
  summary: (block) => block.alt || (block.src ? 'picture' : 'no picture yet'),
  View,
  Inspector,
  style: ['padding', 'background'],
}
