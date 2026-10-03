'use client'

import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { MergeFieldDefinition } from './design'
import type { ButtonAlign, EmailButtonAttrs } from './extensions/email-button'
import { MergeFieldPicker } from './merge-field-picker'

export interface UploadedImage {
  url: string
  alt?: string
}

export interface ToolbarProps {
  editor: Editor
  mergeFields: MergeFieldDefinition[]
  brandColors: string[]
  onUploadImage?: (file: File) => Promise<UploadedImage>
}

type Panel = null | 'link' | 'button' | 'image' | 'color'

const URL_OK = /^(https?:|mailto:|tel:)/i
const MERGE_URL = /^\{\{[^}]+\}\}/

function validUrl(value: string) {
  const url = value.trim()
  return URL_OK.test(url) || MERGE_URL.test(url)
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="seb-tool"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function Toolbar({ editor, mergeFields, brandColors, onUploadImage }: ToolbarProps) {
  const [panel, setPanel] = useState<Panel>(null)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      button: e.isActive('emailButton'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      href: (e.getAttributes('link').href as string | undefined) ?? '',
      buttonAttrs: e.getAttributes('emailButton') as Partial<EmailButtonAttrs>,
    }),
  })
  const chain = () => editor.chain().focus()
  const toggle = (name: Panel) => setPanel((current) => (current === name ? null : name))

  return (
    <div className="seb-toolbar-wrap">
      <div className="seb-toolbar" role="toolbar" aria-label="Formatting">
        <div className="seb-group">
          <Tool label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>↶</Tool>
          <Tool label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>↷</Tool>
        </div>
        <div className="seb-group">
          <Tool label="Paragraph" active={!state.h1 && !state.h2 && !state.h3} onClick={() => chain().setParagraph().run()}>¶</Tool>
          <Tool label="Heading 1" active={state.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>H1</Tool>
          <Tool label="Heading 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</Tool>
          <Tool label="Heading 3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</Tool>
        </div>
        <div className="seb-group">
          <Tool label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}><b>B</b></Tool>
          <Tool label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}><i>I</i></Tool>
          <Tool label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}><u>U</u></Tool>
          <Tool label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}><s>S</s></Tool>
          <Tool label="Text colour" active={panel === 'color'} onClick={() => toggle('color')}>A</Tool>
        </div>
        <div className="seb-group">
          <Tool label="Align left" active={state.left} onClick={() => chain().setTextAlign('left').run()}>⇤</Tool>
          <Tool label="Align centre" active={state.center} onClick={() => chain().setTextAlign('center').run()}>↔</Tool>
          <Tool label="Align right" active={state.right} onClick={() => chain().setTextAlign('right').run()}>⇥</Tool>
        </div>
        <div className="seb-group">
          <Tool label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>•</Tool>
          <Tool label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>1.</Tool>
          <Tool label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>❝</Tool>
          <Tool label="Divider" onClick={() => chain().setHorizontalRule().run()}>―</Tool>
        </div>
        <div className="seb-group">
          <Tool label="Link" active={state.link || panel === 'link'} onClick={() => toggle('link')}>🔗</Tool>
          <Tool label="Button" active={state.button || panel === 'button'} onClick={() => toggle('button')}>▭</Tool>
          <Tool label="Image" active={panel === 'image'} onClick={() => toggle('image')}>🖼</Tool>
        </div>
        <div className="seb-group">
          <MergeFieldPicker
            fields={mergeFields}
            onSelect={(field, fallback) => chain().insertMergeField(field.key, fallback).run()}
          />
        </div>
      </div>
      {panel === 'link' && (
        <LinkPanel
          initial={state.href}
          onApply={(href) => {
            if (href) chain().extendMarkRange('link').setLink({ href }).run()
            setPanel(null)
          }}
          onRemove={() => {
            chain().extendMarkRange('link').unsetLink().run()
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      )}
      {panel === 'button' && (
        <ButtonPanel
          initial={state.button ? state.buttonAttrs : {}}
          onApply={(attrs) => {
            chain().setEmailButton(attrs).run()
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      )}
      {panel === 'image' && (
        <ImagePanel
          onUploadImage={onUploadImage}
          onApply={({ url, alt }) => {
            chain().setImage({ src: url, alt: alt ?? '' }).run()
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      )}
      {panel === 'color' && (
        <ColorPanel
          colors={brandColors}
          onApply={(color) => {
            if (color) chain().setColor(color).run()
            else chain().unsetColor().run()
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      )}
    </div>
  )
}

function PanelForm({
  label,
  onSubmit,
  onCancel,
  children,
  submitLabel = 'Apply',
  extra,
}: {
  label: string
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  children: ReactNode
  submitLabel?: string
  extra?: ReactNode
}) {
  return (
    <form
      className="seb-panel seb-inline-panel"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(event)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      {children}
      <div className="seb-panel-actions">
        {extra}
        <button type="button" className="seb-action" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="seb-action seb-action-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function LinkPanel({
  initial,
  onApply,
  onRemove,
  onCancel,
}: {
  initial: string
  onApply: (href: string) => void
  onRemove: () => void
  onCancel: () => void
}) {
  const [href, setHref] = useState(initial)
  const [error, setError] = useState('')
  return (
    <PanelForm
      label="Link"
      onCancel={onCancel}
      onSubmit={() => (validUrl(href) ? onApply(href.trim()) : setError('Use an address starting with https://, mailto: or tel:'))}
      extra={
        initial ? (
          <button type="button" className="seb-action" onClick={onRemove}>
            Remove link
          </button>
        ) : null
      }
    >
      <label className="seb-field">
        <span>Link address</span>
        <input
          className="seb-input"
          autoFocus
          value={href}
          placeholder="https://"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setHref(event.target.value)
            setError('')
          }}
        />
      </label>
      {error && <p className="seb-error">{error}</p>}
    </PanelForm>
  )
}

function ButtonPanel({
  initial,
  onApply,
  onCancel,
}: {
  initial: Partial<EmailButtonAttrs>
  onApply: (attrs: EmailButtonAttrs) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initial.label ?? '')
  const [href, setHref] = useState(initial.href ?? '')
  const [align, setAlign] = useState<ButtonAlign>(initial.align ?? 'center')
  const [error, setError] = useState('')
  return (
    <PanelForm
      label="Button"
      submitLabel={initial.label ? 'Update button' : 'Add button'}
      onCancel={onCancel}
      onSubmit={() => {
        if (!label.trim()) return setError('Give the button a label')
        if (!validUrl(href)) return setError('Use an address starting with https://, mailto: or tel:')
        onApply({ label: label.trim(), href: href.trim(), align })
      }}
    >
      <label className="seb-field">
        <span>Label</span>
        <input className="seb-input" autoFocus value={label} placeholder="Book now" onChange={(e) => setLabel(e.target.value)} />
      </label>
      <label className="seb-field">
        <span>Link address</span>
        <input className="seb-input" value={href} placeholder="https://" onChange={(e) => setHref(e.target.value)} />
      </label>
      <label className="seb-field">
        <span>Alignment</span>
        <select className="seb-input" value={align} onChange={(e) => setAlign(e.target.value as ButtonAlign)}>
          <option value="left">Left</option>
          <option value="center">Centre</option>
          <option value="right">Right</option>
        </select>
      </label>
      {error && <p className="seb-error">{error}</p>}
    </PanelForm>
  )
}

function ImagePanel({
  onUploadImage,
  onApply,
  onCancel,
}: {
  onUploadImage?: (file: File) => Promise<UploadedImage>
  onApply: (image: UploadedImage) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const upload = async (chosen: File | undefined) => {
    if (!chosen || !onUploadImage) return
    setBusy(true)
    setError('')
    try {
      const uploaded = await onUploadImage(chosen)
      setUrl(uploaded.url)
      if (uploaded.alt && !alt) setAlt(uploaded.alt)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PanelForm
      label="Image"
      submitLabel="Insert image"
      onCancel={onCancel}
      onSubmit={() => {
        if (!/^https?:/i.test(url.trim())) return setError('Upload an image or give an https:// address')
        onApply({ url: url.trim(), alt: alt.trim() })
      }}
    >
      {onUploadImage && (
        <div className="seb-field">
          <span>Upload</span>
          <input
            ref={file}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            aria-label="Upload an image"
            disabled={busy}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          {busy && <span className="seb-hint">Uploading…</span>}
        </div>
      )}
      <label className="seb-field">
        <span>Image address</span>
        <input className="seb-input" value={url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="seb-field">
        <span>Description (alt text)</span>
        <input className="seb-input" value={alt} placeholder="What the image shows" onChange={(e) => setAlt(e.target.value)} />
      </label>
      {error && <p className="seb-error">{error}</p>}
    </PanelForm>
  )
}

function ColorPanel({
  colors,
  onApply,
  onCancel,
}: {
  colors: string[]
  onApply: (color: string | null) => void
  onCancel: () => void
}) {
  const [custom, setCustom] = useState(colors[0] ?? '#000000')
  return (
    <PanelForm label="Text colour" onCancel={onCancel} onSubmit={() => onApply(custom)}>
      <div className="seb-swatches" role="group" aria-label="Brand colours">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className="seb-swatch"
            style={{ background: color }}
            aria-label={`Colour ${color}`}
            title={color}
            onClick={() => onApply(color)}
          />
        ))}
        <button type="button" className="seb-action" onClick={() => onApply(null)}>
          Default
        </button>
      </div>
      <label className="seb-field">
        <span>Other colour</span>
        <input type="color" value={custom} onChange={(e) => setCustom(e.target.value)} />
      </label>
    </PanelForm>
  )
}
