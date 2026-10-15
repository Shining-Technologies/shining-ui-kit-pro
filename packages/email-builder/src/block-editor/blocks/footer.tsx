import { useMemo } from 'react'
import type { FooterBlock } from '../../design'
import { Section, TextArea, Toggle } from '../controls'
import { useEditorApi } from '../context'
import { renderInline } from '../sanitize'
import {
  pillLabel,
  boxStyle,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

function View({ block }: ViewProps<FooterBlock>) {
  const api = useEditorApi()
  const { brand } = api
  // The brand's footer text first, then the block's own, as the server renders them.
  const brandHtml = brand.footer_html ?? ''
  const brandExtra = useMemo(
    () => renderInline(brandHtml, api.mergeFields),
    [brandHtml, api.mergeFields],
  )
  const extra = useMemo(
    () => renderInline(block.html ?? '', api.mergeFields),
    [block.html, api.mergeFields],
  )
  const links = brand.social_links ?? []
  return (
    <div
      className="seb-b seb-b-footer"
      style={{ textAlign: 'center', fontSize: 12, lineHeight: 1.5, ...boxStyle(block, api.brand) }}
    >
      <p className="seb-footer-flag" role="note">
        Shown below the email, wherever it is placed
      </p>
      {brandHtml && <div data-brand-footer dangerouslySetInnerHTML={{ __html: brandExtra }} />}
      {block.html && <div dangerouslySetInnerHTML={{ __html: extra }} />}
      {block.show_business && (
        <div>
          {brand.business_name || <em className="seb-muted">Business name from the brand kit</em>}
        </div>
      )}
      {block.show_address && (
        <div>
          {brand.business_address?.replace(/\n/g, ', ') || (
            <em className="seb-muted">Address from the brand kit</em>
          )}
        </div>
      )}
      {block.show_social && links.length > 0 && <div>{links.map(pillLabel).join(' · ')}</div>}
    </div>
  )
}

function Inspector({ block }: InspectorProps<FooterBlock>) {
  const { set } = useBlockEdit(block)
  return (
    <>
      <Section title="Footer">
        <p className="seb-hint">
          An email can have one footer. It replaces the standard one and is always sent below the
          email, wherever you place it.
        </p>
        <Toggle
          label="Show the business name"
          checked={block.show_business}
          onChange={(show_business) => set({ show_business })}
        />
        <Toggle
          label="Show the address"
          checked={block.show_address}
          onChange={(show_address) => set({ show_address })}
        />
        <Toggle
          label="Show social links"
          checked={block.show_social}
          onChange={(show_social) => set({ show_social })}
        />
        <TextArea
          label="Extra text (HTML)"
          value={block.html ?? ''}
          rows={4}
          mono
          onChange={(html) => set({ html: html || undefined }, 'html')}
        />
      </Section>
      <StyleSection block={block} fields={footer.style} />
    </>
  )
}

export const footer: BlockModule<FooterBlock> = {
  type: 'footer',
  label: 'Footer',
  icon: 'footer',
  summary: () => 'business details',
  View,
  Inspector,
  style: ['padding', 'background', 'color', 'font', 'font_size'],
}
