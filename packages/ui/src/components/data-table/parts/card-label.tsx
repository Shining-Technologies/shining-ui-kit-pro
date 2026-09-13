import { cn } from '../../../lib/cn'

/**
 * A cell's column name, for the card layout.
 *
 * Cards hide the header row, and with it the column headers a screen reader
 * pairs each cell with — so the name has to be in the cell itself, as text,
 * not as a `::before` label that is announced unevenly or not at all. The
 * table layout hides it (the header says it there); a card shows it.
 * `visuallyHidden` keeps it for screen readers on a column that shows its
 * value without a label (`meta.hideLabelInCards`).
 *
 * The trailing space keeps the name and the value two words in the accessible
 * name ("Email ada@example.com"); on a card it collapses at the end of the
 * label's own line.
 */
export function CardLabel({
  label,
  visuallyHidden = false,
}: {
  label: string
  visuallyHidden?: boolean
}) {
  return (
    <span className={cn('sui-td__label', visuallyHidden && 'sui-td__label--hidden')}>
      {`${label} `}
    </span>
  )
}
