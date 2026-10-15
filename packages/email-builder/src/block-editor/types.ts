import type { Editor } from '@tiptap/core'
import type {
  Block,
  BlockDesign,
  BrandPreview,
  DataSourceDefinition,
  LayoutId,
  MergeFieldDefinition,
  Row,
} from '../design'
import type { UploadedImage } from '../toolbar'
import type { Device } from './devices'

/** What the editor has selected; ``null`` is the email itself. */
export type Selection = null | { kind: 'row' | 'column' | 'block'; id: string }

/** A row saved for reuse (shining-email's `SavedRowModel`). A shared one is inserted as a
 * placeholder, not as a copy, and changes everywhere it is used when it is edited. */
export interface SavedRow {
  id: string | number
  name: string
  row: Row
  /** A shared block (shining-email 0.4's ``is_shared``). Absent or false is a plain saved row. */
  shared?: boolean
  /** How many templates use a shared block. */
  usageCount?: number
}

/**
 * Thrown by ``SavedRowsAdapter.remove`` when a shared block is still in use (shining-email's
 * 409 ``shared_row_in_use``). The editor shows which templates, and never deletes it anyway.
 */
export class SharedRowInUseError extends Error {
  constructor(
    message: string,
    public templates: { id: string; name: string }[],
  ) {
    super(message)
    this.name = 'SharedRowInUseError'
  }
}

/** ``list`` is required. Leave out ``save`` and ``remove`` for a user who may only insert saved
 * rows: the editor then hides "Save as row" and the delete buttons. Shared blocks come through
 * the same adapter: ``list`` returns them with ``shared: true``, ``save`` takes ``{ shared: true }``,
 * and ``update`` / ``get`` are what editing and showing a shared block need. */
export interface SavedRowsAdapter {
  list(): Promise<SavedRow[]>
  /** ``designWidth`` is the email's width (480–700), for the server to check the row's images against.
   * ``options.shared`` saves a shared block; that choice is made when it is created and never changes. */
  save?(
    name: string,
    row: Row,
    designWidth?: number,
    options?: { shared?: boolean },
  ): Promise<SavedRow>
  /** Throw `SharedRowInUseError` when a shared block is used by templates: it is never deleted then. */
  remove?(id: SavedRow['id']): Promise<void>
  /** Change a saved row. Without it the editor hides "Edit shared block". */
  update?(
    id: SavedRow['id'],
    patch: { name?: string; row?: Row },
    designWidth?: number,
  ): Promise<SavedRow>
  /** One saved row, for a shared block that is not in ``list``. ``null`` means it was deleted. */
  get?(id: SavedRow['id']): Promise<SavedRow | null>
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
  /** Saved rows: listed in the palette, inserted with new ids. Shared blocks are in the same list. */
  savedRows?: SavedRowsAdapter
  /** ``GET data-sources/``: the lists a table block can show. Without any, the Table tile is hidden. */
  dataSources?: DataSourceDefinition[]
  /** @internal Limits for the editor inside the "Edit shared block" dialog. */
  constraints?: EditorConstraints
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

/** @internal */
export interface EditorConstraints {
  /** The design is one row and stays one row (a shared block's content). */
  singleRow?: boolean
  /** ``false`` refuses shared-block placeholders (a shared block cannot hold another). */
  allowShared?: boolean
}

export type PaletteItem =
  | { kind: 'palette-block'; type: Block['type'] }
  | { kind: 'palette-layout'; layout: LayoutId }
  | { kind: 'palette-saved'; id: string }
  | { kind: 'palette-shared'; id: string }

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
