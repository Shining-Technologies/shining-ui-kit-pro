import { createContext, useContext } from 'react'
import type {
  Block,
  BlockDesign,
  BlockType,
  BrandPreview,
  Column,
  DataSourceDefinition,
  LayoutId,
  MergeFieldDefinition,
  Row,
} from '../design'
import type { UploadedImage } from '../toolbar'
import type { Device } from './devices'
import type {
  DropHint,
  EditorConstraints,
  FocusRequest,
  FormatEditor,
  Selection,
  SavedRow,
  SavedRowsState,
} from './types'

/** ``null`` when the change was made; otherwise why it was refused. */
export type EditResult = string | null

export interface EditorApi {
  design: BlockDesign
  selection: Selection
  /** ``focusText``: put the caret in the text block at its end, or at a point. */
  select: (selection: Selection, focusText?: false | 'end' | { x: number; y: number }) => void
  device: Device
  disabled: boolean
  brand: BrandPreview
  mergeFields: MergeFieldDefinition[]
  getMergeFields: () => MergeFieldDefinition[]
  onUploadImage?: (file: File) => Promise<UploadedImage>
  /** The lists a table block can show (``GET data-sources/``). */
  dataSources: DataSourceDefinition[]
  /** Limits set by the "Edit shared block" dialog; empty in the main editor. */
  constraints: EditorConstraints
  dropHint: DropHint | null
  /** The block, column or row a server error points at, if any. */
  highlight: { kind: 'block' | 'column' | 'row'; id: string } | null
  /** A text editor that should take focus once it mounts; used once. */
  focusRequest: FocusRequest | null
  clearFocusRequest: () => void
  /** The editor the formatting bar drives (the selected heading or text block). */
  formatEditor: FormatEditor | null
  setFormatEditor: (editor: FormatEditor | null) => void

  /** Apply a change to the design. It is refused (and nothing changes) when it
   * would add a problem `validateBlockDesign` calls an error. */
  edit: (change: (design: BlockDesign) => BlockDesign, coalesceKey?: string) => EditResult
  updateBlock: (id: string, patch: Partial<Block>, coalesceKey?: string) => EditResult
  updateRow: (id: string, patch: Partial<Omit<Row, 'id' | 'columns'>>, key?: string) => EditResult
  updateColumn: (
    id: string,
    patch: Partial<Omit<Column, 'id' | 'width' | 'blocks'>>,
    key?: string,
  ) => EditResult
  updateSettings: (patch: Partial<BlockDesign['settings']>, key?: string) => EditResult

  addBlockAt: (type: BlockType, columnId: string, index: number) => void
  nudgeBlock: (id: string, delta: -1 | 1) => void
  nudgeBlockSideways: (id: string, delta: -1 | 1) => void
  duplicateBlock: (id: string) => void
  removeBlock: (id: string) => void
  setLayout: (rowId: string, layout: LayoutId) => void
  nudgeRow: (id: string, delta: -1 | 1) => void
  duplicateRow: (id: string) => void
  removeRow: (id: string) => void

  /** Shared blocks (shining-email 0.4). */
  sharedRows: SharedRowsApi

  savedRows: SavedRowsState & {
    enabled: boolean
    /** The adapter has ``save`` / ``remove``; without them the matching buttons are hidden. */
    canSave: boolean
    canRemove: boolean
    reload: () => void
    saveRow: (rowId: string, name: string) => Promise<EditResult>
    removeSaved: (id: SavedRow['id']) => Promise<void>
  }
}

/** What the editor knows about a shared block: its saved row, still loading, deleted
 * (``missing``), or not fetchable right now (``unavailable``). */
export type SharedLookup = SavedRow | 'loading' | 'missing' | 'unavailable'

export interface SharedRowsApi {
  /** The shared blocks in the saved-row list. */
  items: SavedRow[]
  /** The adapter lists saved rows at all (shared blocks come from the same list). */
  enabled: boolean
  /** The adapter has ``save``: a row can be saved as a shared block. Never inside a shared block. */
  canShare: boolean
  /** The adapter has ``update``: a shared block can be edited. */
  canEditShared: boolean
  /** The adapter has ``remove``. */
  canRemove: boolean
  /** A shared block's saved row, from the list or fetched with ``get``. */
  resolve: (ref: string) => SharedLookup
  /** The row of a resolved shared block (for footer checks), or ``undefined``. */
  rowOf: (ref: string) => Row | undefined
  /** Fetch a shared block again after `get` failed for it. */
  retry: (ref: string) => void
  insertShared: (id: SavedRow['id']) => void
  /** Save the row as a shared block, then put a placeholder in its place. */
  saveAsShared: (rowId: string, name: string) => Promise<EditResult>
  /** Replace the placeholder with a copy of the shared block's row, editable here. */
  detach: (rowId: string) => void
  /** Open the "Edit shared block" dialog for a placeholder. */
  openEditor: (rowId: string) => void
  /** Save a changed row to the shared block and refresh every place it is shown. */
  updateShared: (id: SavedRow['id'], row: Row) => Promise<EditResult>
}

export const EditorContext = createContext<EditorApi | null>(null)

export function useEditorApi(): EditorApi {
  const api = useContext(EditorContext)
  if (!api) throw new Error('BlockEditor parts must render inside a BlockEditor')
  return api
}
