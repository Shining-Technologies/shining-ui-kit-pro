import { mergeAttributes, Node } from '@tiptap/core'
import { formatMergeTag, isMergePath, parseMergeTag, type MergeFieldDefinition } from '../design'

export interface MergeFieldOptions {
  /** Labels for the chip; a field not listed shows its path. */
  fields: MergeFieldDefinition[]
  /** Read at render time instead of ``fields``, so a list that arrives after
   * the editor was created needs no new editor. */
  getFields?: () => MergeFieldDefinition[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mergeField: {
      /** Insert a merge field at the selection. */
      insertMergeField: (path: string, fallback?: string) => ReturnType
    }
  }
}

/**
 * An inline, atomic merge field. Serialised as
 * ``<span data-merge-field="contact.first_name">{{ contact.first_name|there }}</span>``:
 * the text is what the server substitutes, the attribute lets the editor
 * rebuild the chip on load. Shown as a chip with the field's label.
 */
export const MergeField = Node.create<MergeFieldOptions>({
  name: 'mergeField',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { fields: [], getFields: undefined }
  },

  addAttributes() {
    return {
      path: { default: '' },
      fallback: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-merge-field]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const path = el.getAttribute('data-merge-field') ?? ''
          if (!isMergePath(path)) return false
          const parsed = parseMergeTag(el.textContent ?? '')
          return { path, fallback: parsed?.path === path ? parsed.fallback : '' }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { path, fallback } = node.attrs as { path: string; fallback: string }
    const attrs = { ...HTMLAttributes }
    delete attrs.path
    delete attrs.fallback
    return ['span', mergeAttributes(attrs, { 'data-merge-field': path }), formatMergeTag(path, fallback)]
  },

  renderText({ node }) {
    return formatMergeTag(node.attrs.path as string, node.attrs.fallback as string)
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      const path = node.attrs.path as string
      const fallback = node.attrs.fallback as string
      const fields = this.options.getFields?.() ?? this.options.fields
      const field = fields.find((f) => f.key === path)
      dom.className = 'seb-merge-chip'
      dom.setAttribute('data-merge-field', path)
      dom.setAttribute('contenteditable', 'false')
      dom.title = fallback ? `${path} (if empty: ${fallback})` : path
      dom.textContent = field?.label ?? path
      return { dom }
    }
  },

  addCommands() {
    return {
      insertMergeField:
        (path, fallback = '') =>
        ({ commands }) => {
          if (!isMergePath(path)) return false
          return commands.insertContent({ type: this.name, attrs: { path, fallback } })
        },
    }
  },
})
