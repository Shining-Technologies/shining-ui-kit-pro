import type { Block, BlockType } from '../../design'
import { avatar } from './avatar'
import { button } from './button'
import { divider } from './divider'
import { footer } from './footer'
import { heading } from './heading'
import { html } from './html'
import { image } from './image'
import type { BlockModule } from './shared'
import { social } from './social'
import { spacer } from './spacer'
import { table } from './table'
import { text } from './text'
import { video } from './video'

/** One module per block type: palette entry, canvas view, inspector. */
export const BLOCKS: { [T in BlockType]: BlockModule<Extract<Block, { type: T }>> } = {
  heading,
  text,
  image,
  avatar,
  button,
  divider,
  spacer,
  social,
  video,
  footer,
  html,
  table,
}

export function blockModule(type: BlockType): BlockModule {
  return BLOCKS[type] as unknown as BlockModule
}

export function blockLabel(type: BlockType): string {
  return BLOCKS[type].label
}

export function blockSummary(block: Block): string {
  return blockModule(block.type).summary(block)
}

export type { BlockModule } from './shared'
