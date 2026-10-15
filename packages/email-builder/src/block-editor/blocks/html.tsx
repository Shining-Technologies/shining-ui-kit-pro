import type { HtmlBlock } from '../../design'
import { Section, TextArea } from '../controls'
import { plainText } from '../sanitize'
import {
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

function View({ block }: ViewProps<HtmlBlock>) {
  // Never rendered as markup in the editor: the server sanitises it and the
  // preview shows the result.
  return (
    <div className="seb-b seb-b-html">
      <div className="seb-html-note">
        <strong>Custom HTML</strong>
        <code>{block.html ? plainText(block.html, 140) || block.html.slice(0, 140) : 'Empty'}</code>
      </div>
    </div>
  )
}

function Inspector({ block }: InspectorProps<HtmlBlock>) {
  const { set } = useBlockEdit(block)
  return (
    <>
      <Section title="HTML">
        <TextArea
          label="HTML"
          value={block.html}
          rows={10}
          mono
          hint="The server cleans it when the email is saved; use Preview to see the result."
          onChange={(html) => set({ html }, 'html')}
        />
      </Section>
      <StyleSection block={block} fields={html.style} />
    </>
  )
}

export const html: BlockModule<HtmlBlock> = {
  type: 'html',
  label: 'HTML',
  icon: 'html',
  summary: (block) => plainText(block.html, 40) || 'custom code',
  View,
  Inspector,
  style: ['padding'],
}
