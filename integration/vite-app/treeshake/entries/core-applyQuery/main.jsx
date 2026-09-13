import { applyQuery } from '@shining-technologies/ui/core'
const r = applyQuery([{ a: 1 }, { a: 2 }], { pageIndex: 0, pageSize: 10 }, { columns: [{ accessorKey: 'a' }] })
document.body.textContent = String(r.total)