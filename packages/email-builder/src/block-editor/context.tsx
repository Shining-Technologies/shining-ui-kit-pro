import { createContext, useContext } from 'react'
import type {
  Block,
  BlockDesign,
  BlockType,
  BrandPreview,
  Column,
  LayoutId,
  MergeFieldDefinition,
  Row,
} from '../design'
import type { UploadedImage } from '../toolbar'
import type { Device } from './devices'
import type { DropHint, FormatEditor, Selection, SavedRow, SavedRowsState } from './types'

/** ``null`` when the change was made; otherwise why it was refused. */
export type EditResult = string | null

export interface EditorApi {
  design: BlockDesign
  selection: Selection
  select: (selection: Selection, focusText?: boolean) => void
  device: Device
  disabled: boolean
  brand: BrandPreview
  mergeFields: MergeFieldDefinition[]
  getMergeFields: () => MergeFieldDefinition[]
  onUploadImage?: (file: File) => Promise<UploadedImage>
  dropHint: DropHint | null
  /** The block whose text editor should take focus once it mounts. */
  focusTextId: string | null
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

  savedRows: SavedRowsState & {
    enabled: boolean
    reload: () => void
    saveRow: (rowId: string, name: string) => Promise<EditResult>
    removeSaved: (id: SavedRow['id']) => Promise<void>
  }
}

export const EditorContext = createContext<EditorApi | null>(null)

export function useEditorApi(): EditorApi {
  const api = useContext(EditorContext)
  if (!api) throw new Error('BlockEditor parts must render inside a BlockEditor')
  return api
}
