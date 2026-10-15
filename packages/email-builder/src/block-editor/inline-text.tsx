'use client'

import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { chipMergeTags } from '../chips'
import type { HeadingBlock, TextBlock } from '../design'
import { useEditorApi } from './context'
import { blockTextExtensions, contentForEditor, htmlFromEditor, joinLines } from './text-extensions'

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
        ...(kind === 'heading'
          ? {
              transformPastedHTML: joinLines,
              transformPastedText: (pasted: string) => pasted.replace(/\s*[\r\n]+\s*/g, ' '),
            }
          : {}),
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

  // Take the caret when the block was selected by clicking it (where the pointer was) or
  // pressing Enter on it (at the end). One-shot: the request is dropped once used, so a
  // later render never pulls focus back here.
  const request = api.focusRequest?.id === block.id ? api.focusRequest : null
  const clearFocusRequest = api.clearFocusRequest
  useEffect(() => {
    if (!usable(editor) || !request) return
    // One frame later: the editor's DOM is in the page and laid out, so a point maps to the
    // text under it.
    const frame = requestAnimationFrame(() => {
      if (!usable(editor)) return
      if (editable) {
        let placed = false
        if (request.at !== 'end') {
          try {
            const found = editor.view.posAtCoords({ left: request.at.x, top: request.at.y })
            if (found) {
              editor.chain().focus().setTextSelection(found.pos).run()
              placed = true
            }
          } catch {
            // No layout to ask (a test environment): fall back to the end.
          }
        }
        if (!placed) editor.commands.focus('end')
      }
      clearFocusRequest()
    })
    return () => cancelAnimationFrame(frame)
  }, [editor, request, editable, clearFocusRequest])

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
      onBlur={() => clearFocusRequest()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          clearFocusRequest()
          event.currentTarget.closest<HTMLElement>('[data-block-id]')?.focus()
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
