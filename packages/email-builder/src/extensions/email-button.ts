import { mergeAttributes, Node } from '@tiptap/core'

export type ButtonAlign = 'left' | 'center' | 'right'

export interface EmailButtonAttrs {
  href: string
  label: string
  align: ButtonAlign
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emailButton: {
      /** Insert a button, or replace the selected one. */
      setEmailButton: (attrs: Partial<EmailButtonAttrs>) => ReturnType
    }
  }
}

const ALIGNS: ButtonAlign[] = ['left', 'center', 'right']

/**
 * A block-level call-to-action button. Serialised as
 * ``<a data-type="button" data-align="center" href="…">Book now</a>`` — the
 * shape shining-email's renderer turns into a bulletproof table button in the
 * brand's colours. Atomic: edited through the toolbar, not by typing in it.
 */
export const EmailButton = Node.create({
  name: 'emailButton',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: '' },
      label: { default: 'Button' },
      align: { default: 'center' as ButtonAlign },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="button"]',
        // Before Link, which would otherwise claim every <a>.
        priority: 1000,
        getAttrs: (element) => {
          const el = element as HTMLElement
          const align = el.getAttribute('data-align') as ButtonAlign | null
          return {
            href: el.getAttribute('href') ?? '',
            label: (el.textContent ?? '').trim() || 'Button',
            align: align && ALIGNS.includes(align) ? align : 'center',
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { href, label, align } = node.attrs as EmailButtonAttrs
    const attrs = { ...HTMLAttributes }
    delete attrs.href
    delete attrs.label
    delete attrs.align
    return [
      'a',
      mergeAttributes(attrs, { 'data-type': 'button', 'data-align': align, href }),
      label,
    ]
  },

  renderText({ node }) {
    return `${node.attrs.label as string}: ${node.attrs.href as string}`
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.className = 'seb-button-block'
      dom.setAttribute('data-align', node.attrs.align as string)
      const button = document.createElement('span')
      button.className = 'seb-button'
      button.textContent = node.attrs.label as string
      button.title = (node.attrs.href as string) || 'No link yet'
      dom.appendChild(button)
      return { dom }
    }
  },

  addCommands() {
    return {
      setEmailButton:
        (attrs) =>
        ({ state, commands }) => {
          const selected = state.selection as { node?: { type: { name: string } } }
          if (selected.node?.type.name === this.name) {
            return commands.updateAttributes(this.name, attrs)
          }
          return commands.insertContent({ type: this.name, attrs })
        },
    }
  },
})
