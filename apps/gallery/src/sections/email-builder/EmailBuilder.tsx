import {
  BlockEditor,
  EmailEditor,
  EmailPreview,
  MergeFieldPicker,
  blockDesignErrors,
  formatMergeTag,
  insertAtCursor,
  mergeFieldsIn,
  type BlockDesign,
  type BlockEditorDevice,
  type PreviewDevice,
  type RichTextDesign,
} from '@shining-technologies/email-builder'
import { Badge, Button, Field, Input } from '@shining-technologies/ui'
import { useMemo, useRef, useState } from 'react'
import { Demo } from '../Demo'
import {
  DATA_SOURCES,
  MERGE_FIELDS,
  brand,
  fakeUpload,
  memorySavedRows,
  sampleBlockDesign,
  samplePreview,
  sampleRichTextDesign,
} from './data'
import './EmailBuilder.css'

const BLOCK_CODE = `
import '@shining-technologies/email-builder/styles.css'
import { BlockEditor } from '@shining-technologies/email-builder'

<BlockEditor
  value={design}                // null starts an empty block design
  onChange={setDesign}
  mergeFields={mergeFields}     // GET merge-fields/
  brand={brand}                 // GET brand/
  dataSources={dataSources}     // GET data-sources/, enables the Table block
  savedRows={savedRowsAdapter}  // saved-rows/ and shared blocks
  onUploadImage={async (file) => {
    const asset = await api.uploadAsset(file)
    return { url: asset.url, alt: asset.alt_default, assetId: asset.id }
  }}
/>`

const RICH_CODE = `
import { EmailEditor } from '@shining-technologies/email-builder'

<EmailEditor
  value={design}
  onChange={setDesign}
  mergeFields={mergeFields}
  brandColors={[brand.primary_color]}
  onUploadImage={uploadImage}
/>`

const PREVIEW_CODE = `
import { EmailPreview } from '@shining-technologies/email-builder'

// POST templates/<id>/preview/ → { html, text, subject, warnings }
<EmailPreview {...preview} device={device} onDeviceChange={setDevice} />`

const PICKER_CODE = `
import { MergeFieldPicker, formatMergeTag, insertAtCursor } from '@shining-technologies/email-builder'

<MergeFieldPicker
  fields={mergeFields}
  onSelect={(field, fallback) => {
    const { value, caret } = insertAtCursor(input, formatMergeTag(field.key, fallback))
    setSubject(value)
  }}
/>`

function BlockEditorDemo() {
  const [design, setDesign] = useState<BlockDesign>(sampleBlockDesign)
  const [device, setDevice] = useState<BlockEditorDevice>('desktop')
  const savedRows = useMemo(memorySavedRows, [])
  const brandKit = useMemo(brand, [])
  const errors = blockDesignErrors(design).length
  const blocks = design.rows.length

  return (
    <Demo
      title="Block editor"
      inline={false}
      note="Drag layouts and blocks from the palette, edit text in place, and select anything to see its properties. Saved rows and uploads are kept in memory: the gallery has no server."
      code={BLOCK_CODE}
    >
      <div className="email-demo__meta">
        <Badge>{blocks} rows</Badge>
        <Badge tone={errors ? 'destructive' : 'success'}>
          {errors ? `${errors} problems` : 'Valid for the server'}
        </Badge>
        <span>
          Merge fields used:{' '}
          <code>{mergeFieldsIn(JSON.stringify(design)).join(', ') || 'none'}</code>
        </span>
      </div>
      <BlockEditor
        className="email-demo__block-editor"
        value={design}
        onChange={setDesign}
        mergeFields={MERGE_FIELDS}
        brand={brandKit}
        dataSources={DATA_SOURCES}
        savedRows={savedRows}
        onUploadImage={fakeUpload}
        device={device}
        onDeviceChange={setDevice}
        aria-label="Booking confirmation email"
      />
    </Demo>
  )
}

function RichTextDemo() {
  const [design, setDesign] = useState<RichTextDesign>(sampleRichTextDesign)
  const [showHtml, setShowHtml] = useState(false)

  return (
    <Demo
      title="Rich-text editor"
      inline={false}
      note="The simpler editor: one flow of text with headings, lists, links, images, brand-coloured buttons and merge-field chips. It can only produce what the server keeps."
      code={RICH_CODE}
    >
      <EmailEditor
        value={design}
        onChange={setDesign}
        mergeFields={MERGE_FIELDS}
        brandColors={['#2563eb', '#111827', '#16a34a']}
        onUploadImage={fakeUpload}
        placeholder="Write your email…"
      />
      <Button
        variant="ghost"
        size="sm"
        className="email-demo__toggle"
        onClick={() => setShowHtml((v) => !v)}
      >
        {showHtml ? 'Hide' : 'Show'} the stored HTML
      </Button>
      {showHtml ? (
        <pre className="email-demo__html">
          <code>{design.html}</code>
        </pre>
      ) : null}
    </Demo>
  )
}

function PreviewDemo() {
  const preview = useMemo(samplePreview, [])
  const [device, setDevice] = useState<PreviewDevice>('desktop')

  return (
    <Demo
      title="Email preview"
      inline={false}
      note="The server’s render in a sandboxed frame, with desktop, mobile and plain-text views and the renderer’s warnings. Here the render is a fixed sample."
      code={PREVIEW_CODE}
    >
      <EmailPreview {...preview} device={device} onDeviceChange={setDevice} height={620} />
    </Demo>
  )
}

function MergeFieldPickerDemo() {
  const [subject, setSubject] = useState('Your booking with {{ company.name }}')
  const input = useRef<HTMLInputElement>(null)

  return (
    <Demo
      title="Merge field picker"
      note="Searchable merge fields with an optional fallback. Beside a subject line, it inserts the tag at the caret."
      code={PICKER_CODE}
    >
      <div className="email-demo__subject">
        <Field label="Subject">
          <Input ref={input} value={subject} onChange={(event) => setSubject(event.target.value)} />
        </Field>
        <MergeFieldPicker
          fields={MERGE_FIELDS}
          onSelect={(field, fallback) => {
            const el = input.current
            if (!el) return
            const { value, caret } = insertAtCursor(el, formatMergeTag(field.key, fallback))
            setSubject(value)
            requestAnimationFrame(() => {
              el.focus()
              el.setSelectionRange(caret, caret)
            })
          }}
        />
      </div>
    </Demo>
  )
}

export function EmailBuilderSection() {
  return (
    <>
      <BlockEditorDemo />
      <RichTextDemo />
      <PreviewDemo />
      <MergeFieldPickerDemo />
    </>
  )
}
