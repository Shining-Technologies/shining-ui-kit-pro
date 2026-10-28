import type { BlockDesign, Row } from '../design'

/** The rows of a design that holds no shared-block placeholder, as normal rows. */
export const rowsOf = (design: BlockDesign): Row[] => design.rows as Row[]
