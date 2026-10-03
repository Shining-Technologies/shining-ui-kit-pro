import type { AnyExtension } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import type { MergeFieldDefinition } from '../design'
import { EmailButton } from './email-button'
import { MergeField } from './merge-field'

export { EmailButton, type ButtonAlign, type EmailButtonAttrs } from './email-button'
export { MergeField, type MergeFieldOptions } from './merge-field'

export interface EmailExtensionOptions {
  mergeFields?: MergeFieldDefinition[]
  /** Overrides ``mergeFields`` for chip labels: read whenever a chip is drawn. */
  getMergeFields?: () => MergeFieldDefinition[]
  placeholder?: string
}

/**
 * Exactly the formatting shining-email's sanitiser keeps (its
 * ``rendering/sanitize.py``): paragraphs, headings 1–3, bold, italic,
 * underline, strike, colour, alignment, lists, quotes, links, images, rules,
 * buttons and merge fields. Nothing the editor can make is stripped on save.
 */
export function emailExtensions({
  mergeFields = [],
  getMergeFields,
  placeholder = '',
}: EmailExtensionOptions = {}): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // StarterKit v3 bundles Link and Underline; added below, configured.
      link: false,
      underline: false,
      code: false,
      codeBlock: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ['mailto', 'tel'],
      HTMLAttributes: { rel: null, target: null },
      // The server's rule: http(s), mailto and tel, or a merge field that
      // becomes one ({{ unsubscribe_url }}). Anything else would be dropped.
      isAllowedUri: (url) => /^(https?:|mailto:|tel:)/i.test(url.trim()) || /^\{\{[^}]+\}\}/.test(url.trim()),
    }),
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder }),
    EmailButton,
    MergeField.configure({ fields: mergeFields, getFields: getMergeFields }),
  ]
}
