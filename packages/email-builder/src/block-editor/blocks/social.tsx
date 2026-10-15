import { resolveBrand, type SocialBlock, type SocialLink } from '../../design'
import { AlignInput, Section, Segmented, TextInput } from '../controls'
import { useEditorApi } from '../context'
import {
  boxStyle,
  pillLabel,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

function linksOf(block: SocialBlock, brandLinks: SocialLink[] | undefined): SocialLink[] {
  return block.source === 'custom' ? (block.links ?? []) : (brandLinks ?? [])
}

function View({ block }: ViewProps<SocialBlock>) {
  const api = useEditorApi()
  const links = linksOf(block, api.brand.social_links)
  return (
    <div
      className="seb-b seb-b-social"
      style={{
        ...boxStyle(block, api.brand),
        display: 'flex',
        justifyContent: JUSTIFY[block.align],
      }}
    >
      {links.length === 0 ? (
        <span className="seb-muted">
          {block.source === 'brand' ? 'No social links in the brand kit yet' : 'No links yet'}
        </span>
      ) : (
        <span className="seb-pills">
          {links.map((link, index) => (
            <span
              key={`${link.network}-${index}`}
              className="seb-pill"
              style={{ color: resolveBrand('brand.link_color', api.brand) }}
            >
              {pillLabel(link)}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

function Inspector({ block }: InspectorProps<SocialBlock>) {
  const { set } = useBlockEdit(block)
  const links = block.links ?? []
  const setLinks = (next: SocialLink[]) => set({ links: next }, 'links')
  return (
    <>
      <Section title="Social links">
        <Segmented
          label="Links from"
          value={block.source}
          options={[
            { value: 'brand', label: 'Brand kit' },
            { value: 'custom', label: 'Custom' },
          ]}
          onChange={(source) =>
            source === 'custom'
              ? set({ source, links: block.links ?? [] })
              : set({ source, links: undefined })
          }
        />
        {block.source === 'custom' && (
          <>
            {links.map((link, index) => (
              <div key={index} className="seb-link-row">
                <TextInput
                  label={`Network ${index + 1}`}
                  value={link.network}
                  placeholder="facebook"
                  onChange={(network) =>
                    setLinks(links.map((l, i) => (i === index ? { ...l, network } : l)))
                  }
                />
                <TextInput
                  label={`Address ${index + 1}`}
                  trim
                  value={link.url}
                  placeholder="https://"
                  onChange={(url) =>
                    setLinks(links.map((l, i) => (i === index ? { ...l, url } : l)))
                  }
                />
                <button
                  type="button"
                  className="seb-action"
                  onClick={() => setLinks(links.filter((_, i) => i !== index))}
                >
                  Remove link {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="seb-action"
              onClick={() => setLinks([...links, { network: '', url: '' }])}
            >
              Add a link
            </button>
          </>
        )}
        <AlignInput value={block.align} onChange={(align) => set({ align })} />
      </Section>
      <StyleSection block={block} fields={social.style} />
    </>
  )
}

export const social: BlockModule<SocialBlock> = {
  type: 'social',
  label: 'Social',
  icon: 'social',
  summary: (block) => (block.source === 'brand' ? 'brand links' : 'custom links'),
  View,
  Inspector,
  style: ['padding', 'background'],
}
