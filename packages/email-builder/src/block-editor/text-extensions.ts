import { Node, type AnyExtension } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import type { MergeFieldDefinition } from '../design'
import { MergeField } from '../extensions'

/** A heading is one line of inline content: the document is a single paragraph. */
const SingleLineDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'paragraph',
})

export interface BlockTextOptions {
  kind: 'heading' | 'text'
  mergeFields: MergeFieldDefinition[]
  getMergeFields?: () => MergeFieldDefinition[]
  placeholder?: string
}

/**
 * The marks, links, colour and merge-field chips of the rich-text editor, and
 * nothing else. A heading keeps inline content only (the server's heading
 * allowlist); a text block adds paragraphs, lists and quotes. Buttons, images,
 * rules and headings are separate blocks, so they cannot be typed or pasted in.
 */
export function blockTextExtensions({
  kind,
  mergeFields,
  getMergeFields,
  placeholder = '',
}: BlockTextOptions): AnyExtension[] {
  const heading = kind === 'heading'
  return [
    StarterKit.configure({
      document: heading ? false : undefined,
      heading: false,
      horizontalRule: false,
      code: false,
      codeBlock: false,
      link: false,
      underline: false,
      hardBreak: heading ? false : undefined,
      bulletList: heading ? false : undefined,
      orderedList: heading ? false : undefined,
      listItem: heading ? false : undefined,
      listKeymap: heading ? false : undefined,
      blockquote: heading ? false : undefined,
    }),
    ...(heading ? [SingleLineDocument] : []),
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ['mailto', 'tel'],
      HTMLAttributes: { rel: null, target: null },
      isAllowedUri: (url) =>
        /^(https?:|mailto:|tel:)/i.test(url.trim()) || /^\{\{[^}]+\}\}/.test(url.trim()),
    }),
    Underline,
    TextStyle,
    Color,
    Placeholder.configure({ placeholder }),
    MergeField.configure({ fields: mergeFields, getFields: getMergeFields }),
  ]
}

/** A heading's html is the paragraph's inner HTML; a text block's is the document. */
export function htmlFromEditor(
  editor: { isEmpty: boolean; getHTML: () => string },
  kind: 'heading' | 'text',
): string {
  if (editor.isEmpty) return ''
  const html = editor.getHTML()
  if (kind === 'text') return html
  const match = /^<p[^>]*>([\s\S]*)<\/p>$/.exec(html)
  return match ? match[1]! : html
}

/** A heading is one line: paragraph and line breaks become a space, so pasted
 * or loaded text is joined rather than cut after the first line. */
export function joinLines(html: string): string {
  return html
    .replace(/<\/(?:p|div|h[1-6]|li)>\s*<(?:p|div|h[1-6]|li)\b[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(?:p|div|h[1-6]|ul|ol|li)\b[^>]*>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function contentForEditor(html: string, kind: 'heading' | 'text'): string {
  return kind === 'heading' ? `<p>${joinLines(html)}</p>` : html
}
