'use client'

import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { chipMergeTags } from '../chips'
import type { HeadingBlock, TextBlock } from '../design'
import { useEditorApi } from './context'
import { blockTextExtensions, contentForEditor, htmlFromEditor } from './text-extensions'

function usable(editor: Editor | null): editor is Editor {
  return editor !== null && !editor.isDestroyed
}

/**
 * The selected heading or text block, edited in place with the rich-text
 * editor's extensions. Only the selected block mounts one; the others are
 * drawn as static HTML. Controlled like `EmailEditor`: edits go out through
 * `updateBlock`, and a value changed from outside (undo) is followed.
 */
export function InlineText({
  block,
  kind,
  style,
  className,
  placeholder,
}: {
  block: HeadingBlock | TextBlock
  kind: 'heading' | 'text'
  style?: CSSProperties
  className?: string
  placeholder: string
}) {
  const api = useEditorApi()
  const lastEmitted = useRef<string | null>(null)
  const idRef = useRef(block.id)
  idRef.current = block.id
  const updateRef = useRef(api.updateBlock)
  updateRef.current = api.updateBlock
  const fields = useRef(api.mergeFields)
  fields.current = api.mergeFields
  const editable = !api.disabled

  const editor = useEditor(
    {
      extensions: blockTextExtensions({
        kind,
        mergeFields: api.mergeFields,
        getMergeFields: () => fields.current,
        placeholder,
      }),
      content: contentForEditor(chipMergeTags(block.html), kind),
      editable,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          'aria-label': kind === 'heading' ? 'Heading text' : 'Text',
          'aria-multiline': kind === 'heading' ? 'false' : 'true',
          role: 'textbox',
        },
      },
      onUpdate: ({ editor: current }) => {
        const html = htmlFromEditor(current, kind)
        lastEmitted.current = html
        updateRef.current(idRef.current, { html }, `${idRef.current}:html`)
      },
    },
    [kind],
  )

  // Tell the canvas which editor the formatting bar drives.
  const setFormatEditor = api.setFormatEditor
  useEffect(() => {
    if (!usable(editor)) return
    setFormatEditor({ editor, kind })
    return () => setFormatEditor(null)
  }, [editor, kind, setFormatEditor])

  // Take the caret when the block was selected by clicking or pressing Enter on it.
  const wantsFocus = api.focusTextId === block.id
  useEffect(() => {
    if (usable(editor) && wantsFocus && editable) editor.commands.focus('end')
  }, [editor, wantsFocus, editable])

  useEffect(() => {
    if (usable(editor) && editor.isEditable !== editable) editor.setEditable(editable, false)
  }, [editor, editable])

  // Follow a value changed from outside, never echo our own edits back.
  useEffect(() => {
    if (!usable(editor)) return
    if (block.html === lastEmitted.current || block.html === htmlFromEditor(editor, kind)) return
    lastEmitted.current = block.html
    editor.commands.setContent(contentForEditor(chipMergeTags(block.html), kind), {
      emitUpdate: false,
    })
  }, [editor, block.html, kind])

  const labels = api.mergeFields.map((f) => `${f.key}:${f.label}`).join('|')
  useEffect(() => {
    if (!usable(editor)) return
    let dom: HTMLElement
    try {
      dom = editor.view.dom
    } catch {
      return
    }
    const map = new Map(fields.current.map((f) => [f.key, f.label]))
    dom.querySelectorAll<HTMLElement>('.seb-merge-chip').forEach((chip) => {
      const path = chip.getAttribute('data-merge-field') ?? ''
      chip.textContent = map.get(path) ?? path
    })
  }, [editor, labels])

  return (
    <div
      className={className}
      style={style}
      data-inline-editor={kind}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.closest<HTMLElement>('[data-block-id]')?.focus()
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
