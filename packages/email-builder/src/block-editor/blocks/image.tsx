import { findBlock, type BlockDesign, type ImageBlock } from '../../design'
import { AlignInput, NumberInput, Section, TextInput, Toggle, UploadButton } from '../controls'
import { useEditorApi } from '../context'
import { Icon } from '../icons'
import { ImageResizeHandles } from '../image-resize-handles'
import {
  boxStyle,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type OverlayProps,
  type ViewProps,
} from './shared'

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

function View({ block, live }: ViewProps<ImageBlock>) {
  const api = useEditorApi()
  const width = live ?? block.width
  return (
    <div
      className="seb-b seb-b-image"
      style={{
        ...boxStyle(block, api.brand),
        display: 'flex',
        justifyContent: JUSTIFY[block.align],
      }}
    >
      {block.src ? (
        <img
          className="seb-image"
          src={block.src}
          alt={block.alt}
          draggable={false}
          style={{
            display: 'block',
            width: width === 'full' ? '100%' : width,
            maxWidth: '100%',
            height: 'auto',
            borderRadius: block.radius ?? 0,
          }}
        />
      ) : (
        <div className="seb-placeholder" role="img" aria-label="No image yet">
          <Icon name="image" width={24} height={24} />
          <span>Add an image</span>
          <small>Upload one or paste an address in the properties.</small>
        </div>
      )}
    </div>
  )
}

function Overlay({ block, frame, onLive }: OverlayProps<ImageBlock>) {
  const { updateBlock, design } = useEditorApi()
  // The server allows up to the column's share of the design width.
  const maxWidth = columnPx(design, block.id)
  return (
    <ImageResizeHandles
      block={block}
      maxWidth={maxWidth}
      frame={frame}
      onLive={onLive}
      onCommit={(width) => updateBlock(block.id, { width })}
    />
  )
}

/** What the server allows an image: its column's share of the design width. */
function columnPx(design: BlockDesign, id: string): number {
  const column = findBlock(design, id)?.column
  return column ? Math.max(1, Math.floor((design.settings.width * column.width) / 100)) : 700
}

function Inspector({ block }: InspectorProps<ImageBlock>) {
  const { api, set } = useBlockEdit(block)
  const limit = columnPx(api.design, block.id)
  return (
    <>
      <Section title="Image">
        {api.onUploadImage && (
          <UploadButton
            label="Upload an image"
            onFile={async (file) => {
              const uploaded = await api.onUploadImage!(file)
              const next: Partial<ImageBlock> = { src: uploaded.url }
              if (uploaded.assetId) next.asset_id = uploaded.assetId
              if (uploaded.alt && !block.alt) next.alt = uploaded.alt
              const refused = set(next)
              if (refused) throw new Error(refused)
            }}
          />
        )}
        <TextInput
          label="Image address"
          value={block.src}
          placeholder="https://"
          onChange={(src) => set({ src, asset_id: undefined }, 'src')}
        />
        <TextInput
          label="Description (alt text)"
          value={block.alt}
          placeholder="What the image shows"
          onChange={(alt) => set({ alt }, 'alt')}
        />
        <Toggle
          label="Full width"
          checked={block.width === 'full'}
          onChange={(full) => set({ width: full ? 'full' : Math.min(320, limit) })}
        />
        {block.width !== 'full' && (
          <NumberInput
            label="Width"
            value={block.width}
            min={1}
            max={limit}
            unit="px"
            onChange={(width) => set({ width }, 'width')}
          />
        )}
        <AlignInput value={block.align} onChange={(align) => set({ align })} />
        <TextInput
          label="Link address"
          value={block.link ?? ''}
          placeholder="https://"
          hint="Optional. Opens when the image is clicked."
          onChange={(link) => set({ link: link.trim() ? link : undefined }, 'link')}
        />
        <NumberInput
          label="Corner radius"
          value={block.radius ?? 0}
          min={0}
          max={40}
          unit="px"
          onChange={(radius) => set({ radius }, 'radius')}
        />
      </Section>
      <StyleSection block={block} fields={image.style} />
    </>
  )
}

export const image: BlockModule<ImageBlock> = {
  type: 'image',
  label: 'Image',
  icon: 'image',
  summary: (block) => block.alt || (block.src ? 'picture' : 'no picture yet'),
  View,
  Inspector,
  style: ['padding', 'background'],
  Overlay,
}
