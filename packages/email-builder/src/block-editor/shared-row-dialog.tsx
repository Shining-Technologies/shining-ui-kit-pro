'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  isSharedRowRef,
  toBlockDesign,
  type BlockDesign,
  type BlockSettings,
  type BrandPreview,
  type DataSourceDefinition,
  type MergeFieldDefinition,
  type Row,
} from '../design'
import type { UploadedImage } from '../toolbar'
import { BlockEditor } from './block-editor'
import { Icon } from './icons'
import type { SavedRow } from './types'

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/**
 * A modal dialog's focus handling: focus moves in when it opens (to the first control), Tab and
 * Shift+Tab stay inside, Escape closes, and focus goes back to whatever opened it.
 */
export function useDialog(onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => {
      if (opener && opener.isConnected) opener.focus()
    }
  }, [])
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      // Esc during a keyboard drag in the editor inside cancels the drag, not the dialog.
      if (panel.current?.querySelector('[data-drag-active]')) return
      event.stopPropagation()
      closeRef.current()
      return
    }
    if (event.key !== 'Tab' || !panel.current) return
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement
    if (event.shiftKey && (active === first || !panel.current.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !panel.current.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }
  return { panel, onKeyDown }
}

export interface SharedRowDialogProps {
  saved: SavedRow
  /** The email's settings: the shared block is edited at the same width, in the same brand. */
  settings: BlockSettings
  mergeFields: MergeFieldDefinition[]
  brand: BrandPreview
  onUploadImage?: (file: File) => Promise<UploadedImage>
  dataSources: DataSourceDefinition[]
  /** Save the edited row; resolves to why it was refused (the server's message), or ``null``. */
  onSave: (row: Row) => Promise<string | null>
  onClose: () => void
}

/**
 * "Edit shared block": the shared block's row in an editor of its own, in a modal. Saving
 * changes every template that uses the block; emails already sent or queued do not change.
 * The nested editor has its own undo, is limited to one row, and cannot hold another shared
 * block. Cancel discards.
 */
export function SharedRowDialog({
  saved,
  settings,
  mergeFields,
  brand,
  onUploadImage,
  dataSources,
  onSave,
  onClose,
}: SharedRowDialogProps) {
  const titleId = useId()
  const noteId = useId()
  const { panel, onKeyDown } = useDialog(() => requestClose())
  const [draft, setDraft] = useState<BlockDesign>(() => ({
    version: 1,
    mode: 'blocks',
    settings,
    rows: [saved.row],
  }))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const keep = useRef<HTMLButtonElement>(null)
  const opened = useRef(JSON.stringify(toBlockDesign(draft)))
  const changed = () => JSON.stringify(toBlockDesign(draft)) !== opened.current
  // Closing with changes asks first; Esc while it asks goes back to editing.
  const requestClose = () => {
    if (confirming) setConfirming(false)
    else if (changed()) setConfirming(true)
    else onClose()
  }
  const saveButton = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  useEffect(() => {
    // Focus follows the question in, and back to the dialog's own buttons when it is answered.
    if (confirming) keep.current?.focus()
    else if (wasConfirming.current) saveButton.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const used = saved.usageCount
  const usage =
    typeof used === 'number'
      ? `Used in ${used} ${used === 1 ? 'template' : 'templates'}. `
      : 'It may be used in other templates. '

  const save = async () => {
    const row = toBlockDesign(draft)?.rows[0]
    if (!row || isSharedRowRef(row)) return
    setBusy(true)
    setError('')
    const refused = await onSave(row)
    if (!mounted.current) return
    setBusy(false)
    if (refused) setError(refused)
    else onClose()
  }

  // In the document body, so a transformed or clipped ancestor of the editor cannot hide or
  // misplace it; the wrapper brings the editor's styles and tokens along.
  return createPortal(
    <div className="seb-editor seb-blocks seb-portal">
      <div className="seb-dialog-backdrop">
        <div
          ref={panel}
          className="seb-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={noteId}
          onKeyDown={onKeyDown}
        >
          <header className="seb-dialog-head">
            <h2 id={titleId}>Edit shared block “{saved.name}”</h2>
            <button
              type="button"
              className="seb-icon-btn"
              aria-label="Close without saving"
              onClick={requestClose}
            >
              <Icon name="close" />
            </button>
          </header>
          <p id={noteId} className="seb-dialog-note">
            {usage}Saving changes all of them; emails already sent or queued do not change.
          </p>
          <div className="seb-dialog-body">
            <BlockEditor
              value={draft}
              onChange={setDraft}
              mergeFields={mergeFields}
              brand={brand}
              onUploadImage={onUploadImage}
              dataSources={dataSources}
              constraints={{ singleRow: true, allowShared: false }}
              aria-label={`Shared block “${saved.name}”`}
            />
          </div>
          {error && (
            <p className="seb-dialog-error" role="alert">
              {error}
            </p>
          )}
          {confirming ? (
            <footer className="seb-dialog-foot" role="alertdialog" aria-label="Discard changes?">
              <p className="seb-dialog-ask">Discard changes?</p>
              <button type="button" className="seb-action seb-action-danger" onClick={onClose}>
                Discard changes
              </button>
              <button
                ref={keep}
                type="button"
                className="seb-action seb-action-primary"
                onClick={() => setConfirming(false)}
              >
                Keep editing
              </button>
            </footer>
          ) : (
            <footer className="seb-dialog-foot">
              <button type="button" className="seb-action" onClick={requestClose}>
                Cancel
              </button>
              <button
                ref={saveButton}
                type="button"
                className="seb-action seb-action-primary"
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? 'Saving…' : 'Save shared block'}
              </button>
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
