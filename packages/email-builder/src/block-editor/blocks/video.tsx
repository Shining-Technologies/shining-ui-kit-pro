import { resolveBrand, youtubeThumbnail, type VideoBlock, type VideoThumbnail } from '../../design'
import { Section, TextInput, UploadButton } from '../controls'
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

function View({ block }: ViewProps<VideoBlock>) {
  const api = useEditorApi()
  const src = block.thumbnail?.src || youtubeThumbnail(block.url)
  return (
    <div className="seb-b seb-b-video" style={boxStyle(block, api.brand)}>
      <div className="seb-video">
        {src ? <img src={src} alt={block.alt} draggable={false} /> : <span>Video thumbnail</span>}
        <span className="seb-play" aria-hidden="true">
          <Icon name="play" width={20} height={20} />
        </span>
      </div>
      {block.caption && (
        <p className="seb-caption" style={{ color: resolveBrand('brand.link_color', api.brand) }}>
          {block.caption}
        </p>
      )}
    </div>
  )
}

function Inspector({ block }: InspectorProps<VideoBlock>) {
  const { api, set } = useBlockEdit(block)
  return (
    <>
      <Section title="Video">
        <TextInput
          label="Video address"
          value={block.url}
          placeholder="https://"
          hint="The email shows a picture that links here; it never embeds the video."
          onChange={(url) => {
            // A YouTube address brings its own thumbnail, as the server does.
            const own = youtubeThumbnail(url)
            const old = youtubeThumbnail(block.url)
            const current = block.thumbnail?.src ?? ''
            const patch: Partial<VideoBlock> = { url }
            if (own && (!current || current === old)) patch.thumbnail = { src: own }
            else if (!own && current && current === old) patch.thumbnail = undefined
            return set(patch, 'url')
          }}
        />
        {api.onUploadImage && (
          <UploadButton
            label="Upload a thumbnail"
            onFile={async (file) => {
              const uploaded = await api.onUploadImage!(file)
              const thumbnail: VideoThumbnail = { src: uploaded.url }
              if (uploaded.assetId) thumbnail.asset_id = uploaded.assetId
              const refused = set({ thumbnail })
              if (refused) throw new Error(refused)
            }}
          />
        )}
        <TextInput
          label="Thumbnail address"
          value={block.thumbnail?.src ?? ''}
          placeholder="https://"
          hint="A YouTube address gets its own thumbnail when this is empty."
          onChange={(src) => set({ thumbnail: src ? { src } : undefined }, 'thumbnail')}
        />
        <TextInput
          label="Description (alt text)"
          value={block.alt}
          onChange={(alt) => set({ alt }, 'alt')}
        />
        <TextInput
          label="Caption"
          value={block.caption}
          onChange={(caption) => set({ caption }, 'caption')}
        />
      </Section>
      <StyleSection block={block} fields={video.style} />
    </>
  )
}

export const video: BlockModule<VideoBlock> = {
  type: 'video',
  label: 'Video',
  icon: 'video',
  summary: (block) => block.caption || 'video',
  View,
  Inspector,
  style: ['padding', 'background'],
}
