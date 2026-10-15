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

export interface SavedRowsAdapter {
  list(): Promise<SavedRow[]>
  /** ``designWidth`` is the email's width (480–700), for the server to check the row's images against. */
  save(name: string, row: Row, designWidth?: number): Promise<SavedRow>
  remove(id: SavedRow['id']): Promise<void>
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

export interface FormatEditor {
  editor: Editor
  kind: 'heading' | 'text'
}

export interface SavedRowsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: SavedRow[]
  error: string
}
