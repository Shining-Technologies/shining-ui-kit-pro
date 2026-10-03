'use client'

import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useMemo, useRef } from 'react'
import { chipMergeTags } from './chips'
import { emptyDesign, toRichTextDesign, type MergeFieldDefinition, type RichTextDesign } from './design'
import { emailExtensions } from './extensions'
import { Toolbar, type UploadedImage } from './toolbar'

export interface EmailEditorProps {
  /** The stored design. ``null``/``undefined`` is an empty rich-text design. */
  value: unknown
  onChange: (design: RichTextDesign) => void
  /** ``GET merge-fields/``. */
  mergeFields?: MergeFieldDefinition[]
  /** Upload to ``POST assets/`` and return its ``url``. Without it, images are
   * inserted by address only. */
  onUploadImage?: (file: File) => Promise<UploadedImage>
  /** Swatches for the text colour (the brand kit's colours). */
  brandColors?: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
  /** The TipTap editor, once created — for tests and advanced callers. */
  onReady?: (editor: Editor) => void
}

/** What the editor emits for an empty document: no markup at all. */
function htmlOf(editor: Editor) {
  return editor.isEmpty ? '' : editor.getHTML()
}

/** A destroyed editor (one being replaced, or unmounted) throws on most calls. */
function usable(editor: Editor | null): editor is Editor {
  return editor !== null && !editor.isDestroyed
}

/**
 * The rich-text email editor (shining-email PRD §7.7).
 *
 * Controlled: ``value`` is the design JSON, ``onChange`` receives the next one.
 * The editor can only produce what the server's sanitiser keeps, and the
 * server renders the email — use ``EmailPreview`` with ``POST
 * templates/<id>/preview/`` or ``compose/preview/`` to show it.
 *
 * A block-mode design (shining-email 0.2) is shown as read-only notice rather
 * than flattened into rich text.
 */
export function EmailEditor({
  value,
  onChange,
  mergeFields = [],
  onUploadImage,
  brandColors = [],
  placeholder = 'Write your email…',
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Email body',
  onReady,
}: EmailEditorProps) {
  const design = useMemo(() => toRichTextDesign(value), [value])
  const lastEmitted = useRef<string | null>(null)
  const settings = useRef(design?.settings ?? {})
  settings.current = design?.settings ?? {}
  const latestOnChange = useRef(onChange)
  latestOnChange.current = onChange
  const fields = useRef(mergeFields)
  fields.current = mergeFields

  const editor = useEditor(
    {
      extensions: emailExtensions({ mergeFields, getMergeFields: () => fields.current, placeholder }),
      content: chipMergeTags(design?.html ?? ''),
      editable: !disabled && design !== null,
      // Created after mount: safe under server rendering and the App Router.
      immediatelyRender: false,
      editorProps: { attributes: { 'aria-label': ariaLabel, 'aria-multiline': 'true', role: 'textbox' } },
      onUpdate: ({ editor: current }) => {
        const html = htmlOf(current)
        lastEmitted.current = html
        latestOnChange.current({ ...emptyDesign(html), settings: settings.current })
      },
    },
    // Never rebuilt for the merge fields: they usually arrive after mount, and
    // a rebuild would drop the undo history and race the value effects.
    [placeholder],
  )

  useEffect(() => {
    if (usable(editor) && onReady) onReady(editor)
  }, [editor, onReady])

  // Relabel the chips already drawn when the field list arrives or changes;
  // a new chip reads the current list itself.
  const fieldsKey = mergeFields.map((f) => `${f.key}:${f.label}`).join('|')
  useEffect(() => {
    if (!usable(editor)) return
    let dom: HTMLElement
    try {
      dom = editor.view.dom
    } catch {
      return // not mounted yet
    }
    const labels = new Map(fields.current.map((f) => [f.key, f.label]))
    dom.querySelectorAll<HTMLElement>('.seb-merge-chip').forEach((chip) => {
      const path = chip.getAttribute('data-merge-field') ?? ''
      chip.textContent = labels.get(path) ?? path
    })
  }, [editor, fieldsKey])

  const editable = !disabled && design !== null
  useEffect(() => {
    // Without emitting: setEditable's update event would reach onChange, and a
    // parent that stores the value would re-render us into a loop.
    if (usable(editor) && editor.isEditable !== editable) editor.setEditable(editable, false)
  }, [editor, editable])

  // Follow a value changed from outside (a template loaded, a starter applied),
  // but never echo our own edits back into the editor.
  useEffect(() => {
    if (!usable(editor) || design === null) return
    const incoming = design.html
    if (incoming === lastEmitted.current || incoming === htmlOf(editor)) return
    lastEmitted.current = incoming
    editor.commands.setContent(chipMergeTags(incoming), { emitUpdate: false })
  }, [editor, design])

  if (design === null) {
    return (
      <div className={['seb-editor', className].filter(Boolean).join(' ')}>
        <p className="seb-notice" role="status">
          This email was designed with blocks, which this version of the editor cannot change.
        </p>
      </div>
    )
  }

  return (
    <div
      className={['seb-editor', className].filter(Boolean).join(' ')}
      data-disabled={disabled || undefined}
    >
      {editor && !disabled && (
        <Toolbar
          editor={editor}
          mergeFields={mergeFields}
          brandColors={brandColors}
          onUploadImage={onUploadImage}
        />
      )}
      <EditorContent editor={editor} className="seb-content" />
    </div>
  )
}
