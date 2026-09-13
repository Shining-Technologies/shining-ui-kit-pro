import { CellDateProbe } from './cell-date-probe'

// PACKAGE-BUG probe: CellDate inside a DataTable that sets timeZone/locale.
export default function CellDateProbePage() {
  return (
    <main className="p-6">
      <CellDateProbe />
    </main>
  )
}
