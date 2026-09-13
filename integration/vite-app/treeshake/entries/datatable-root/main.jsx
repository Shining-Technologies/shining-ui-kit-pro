import { createRoot } from 'react-dom/client'
import { DataTable } from '@shining-technologies/ui'
createRoot(document.getElementById('root')).render(<DataTable data={[{ a: 1 }]} columns={[{ accessorKey: 'a', header: 'A' }]} />)