import type { Editor } from '@tiptap/core'
import type {
  Block,
  BlockDesign,
  BrandPreview,
  LayoutId,
  MergeFieldDefinition,
  Row,
} from '../design'
import type { UploadedImage } from '../toolbar'
import type { Device } from './devices'

/** What the editor has selected; ``null`` is the email itself. */
export type Selection = null | { kind: 'row' | 'column' | 'block'; id: string }

/** A row saved for reuse (shining-email's `SavedRowModel`). */
export interface SavedRow {
  id: string | number
  name: string
  row: Row
}

/** ``list`` is required. Leave out ``save`` and ``remove`` for a user who may only insert saved
 * rows: the editor then hides "Save as row" and the delete buttons. */
export interface SavedRowsAdapter {
  list(): Promise<SavedRow[]>
  /** ``designWidth`` is the email's width (480–700), for the server to check the row's images against. */
  save?(name: string, row: Row, designWidth?: number): Promise<SavedRow>
  remove?(id: SavedRow['id']): Promise<void>
}

/** A server validation error to show on the canvas. Give ``blockId`` or ``path``
 * (the leading path of the server's message, ``rows[0].columns[0].blocks[1].url``). Prefer
 * ``blockId`` for a background save: a ``path`` is an index into the design as it was sent, and
 * points at the wrong block once the user has moved or inserted rows meanwhile. */
export interface BlockEditorHighlight {
  path?: string
  blockId?: string
  message: string
}

export interface BlockEditorProps {
  /** The stored design. ``null``/``undefined`` is an empty block design. */
  value: unknown
  onChange: (design: BlockDesign) => void
  /** ``GET merge-fields/``. */
  mergeFields: MergeFieldDefinition[]
  /** ``GET brand/``: colours, fonts, logo, social links and business details. */
  brand: BrandPreview
  /** Upload to ``POST assets/``. Without it, images are set by address only. */
  onUploadImage?: (file: File) => Promise<UploadedImage>
  /** Saved rows: listed in the palette, inserted with new ids. */
  savedRows?: SavedRowsAdapter
  device?: Device
  onDeviceChange?: (device: Device) => void
  disabled?: boolean
  /** Shows a server error: the block, column or row it points at is outlined, scrolled into view
   * and selected, and the message is announced. It clears when that target is edited or when
   * ``value`` is replaced. */
  highlight?: BlockEditorHighlight | null
  /** Called when the editor drops the highlight (the target was edited, ``value`` was replaced or
   * the message dismissed), so the host can stop passing it. */
  onHighlightClear?: () => void
  className?: string
  'aria-label'?: string
}

export type PaletteItem =
  | { kind: 'palette-block'; type: Block['type'] }
  | { kind: 'palette-layout'; layout: LayoutId }
  | { kind: 'palette-saved'; id: string }

/** Where a drop lands, and the line the canvas draws for it. */
export type Drop =
  | { kind: 'block'; columnId: string; index: number }
  | { kind: 'new-row-block'; index: number }
  | { kind: 'row'; index: number }

export interface DropHint {
  id: string
  position: 'before' | 'after' | 'inside'
}

export interface DropResolution {
  drop: Drop
  hint: DropHint
}

export interface ActionResult {
  design: BlockDesign
  selection?: Selection
  notice?: string
  /** An element to focus once the change is drawn. */
  focusId?: string
}

/** Where the caret goes when a text block takes focus: the end (Enter) or
 * where the pointer was. One-shot: it is used once, then dropped. */
export interface FocusRequest {
  id: string
  at: 'end' | { x: number; y: number }
}

export interface FormatEditor {
  editor: Editor
  kind: 'heading' | 'text'
}

export interface SavedRowsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: SavedRow[]
  error: string
}
