import {
  Button,
  CellText,
  ConfirmDialog,
  DataTable,
  Empty,
  Field,
  Input,
  PageHeader,
  PencilIcon,
  PlusIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  StatusBadge,
  TrashIcon,
  UserIcon,
  useToast,
  ToastProvider,
  Toaster,
  type ColumnDef,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

interface Customer {
  id: string
  name: string
  email: string
  plan: 'starter' | 'team' | 'enterprise'
  status: 'active' | 'trial' | 'churned'
  seats: number
}

const SEED: Customer[] = [
  { id: 'C-1001', name: 'Northwind Traders', email: 'ops@northwind.example', plan: 'team', status: 'active', seats: 24 },
  { id: 'C-1002', name: 'Contoso Ltd', email: 'it@contoso.example', plan: 'enterprise', status: 'active', seats: 180 },
  { id: 'C-1003', name: 'Fabrikam', email: 'hello@fabrikam.example', plan: 'starter', status: 'trial', seats: 3 },
  { id: 'C-1004', name: 'Globex', email: 'admin@globex.example', plan: 'team', status: 'churned', seats: 0 },
  { id: 'C-1005', name: 'Initech', email: 'billing@initech.example', plan: 'team', status: 'active', seats: 42 },
  { id: 'C-1006', name: 'Umbrella Corp', email: 'it@umbrella.example', plan: 'enterprise', status: 'active', seats: 310 },
  { id: 'C-1007', name: 'Hooli', email: 'ops@hooli.example', plan: 'starter', status: 'trial', seats: 5 },
  { id: 'C-1008', name: 'Soylent', email: 'team@soylent.example', plan: 'team', status: 'active', seats: 18 },
]

const STATUSES = {
  active: { label: 'Active', tone: 'success' as const },
  trial: { label: 'Trial', tone: 'info' as const },
  churned: { label: 'Churned', tone: 'neutral' as const },
}

const PLAN_LABEL = { starter: 'Starter', team: 'Team', enterprise: 'Enterprise' }

const columns: ColumnDef<Customer>[] = [
  { accessorKey: 'name', header: 'Customer', filter: { type: 'text' }, cell: ({ value }) => <CellText>{value}</CellText> },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'plan',
    header: 'Plan',
    filter: {
      type: 'select',
      options: Object.entries(PLAN_LABEL).map(([value, label]) => ({ value, label })),
    },
    cell: ({ value }) => PLAN_LABEL[value as Customer['plan']],
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filter: {
      type: 'multiSelect',
      options: Object.entries(STATUSES).map(([value, status]) => ({ value, label: status.label })),
    },
    cell: ({ value }) => <StatusBadge status={String(value)} statuses={STATUSES} />,
  },
  { accessorKey: 'seats', header: 'Seats', meta: { align: 'right' } },
]

function CrudPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState(SEED)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer[] | null>(null)
  const [draft, setDraft] = useState({ name: '', email: '', plan: 'starter' as Customer['plan'] })
  const [error, setError] = useState<string | null>(null)

  const openEditor = (customer: Customer | null) => {
    setDraft(customer ? { name: customer.name, email: customer.email, plan: customer.plan } : { name: '', email: '', plan: 'starter' })
    setError(null)
    setEditing(customer ?? { id: '', name: '', email: '', plan: 'starter', status: 'trial', seats: 1 })
  }

  const save = () => {
    if (!draft.name.trim()) {
      setError('Enter the customer’s name.')
      return
    }
    if (editing?.id) {
      setRows((list) => list.map((row) => (row.id === editing.id ? { ...row, ...draft } : row)))
      toast({ title: 'Customer updated', tone: 'success' })
    } else {
      const id = `C-${2001 + rows.length}`
      setRows((list) => [{ id, status: 'trial', seats: 1, ...draft }, ...list])
      toast({ title: 'Customer added', description: draft.name, tone: 'success' })
    }
    setEditing(null)
  }

  return (
    <div className="pattern-frame stack">
      <PageHeader
        title="Customers"
        description="Every organisation with an account, its plan and its seats."
        as="h2"
        actions={
          <Button onClick={() => openEditor(null)}>
            <PlusIcon />
            New customer
          </Button>
        }
      />

      <DataTable
        label="Customers"
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        pageSize={5}
        enableRowSelection
        rowActions={(row) => [
          { icon: PencilIcon, label: 'Edit', onClick: () => openEditor(row.original) },
          { icon: TrashIcon, label: 'Delete', destructive: true, onClick: () => setDeleting([row.original]) },
        ]}
        slots={{
          selectionActions: ({ table }) => (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleting(table.getSelectedRowModel().rows.map((row) => row.original))}
            >
              <TrashIcon />
              Delete
            </Button>
          ),
        }}
        emptyState={
          <Empty
            icon={<UserIcon />}
            title="No customers yet"
            description="Customers appear here when they sign up or when you add one."
            actions={
              <Button size="sm" onClick={() => openEditor(null)}>
                Add a customer
              </Button>
            }
          />
        }
      />

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing?.id ? `Edit ${editing.name}` : 'New customer'}</SheetTitle>
            <SheetDescription>The customer is emailed when their plan changes.</SheetDescription>
          </SheetHeader>
          <form
            id="customer-form"
            className="stack-sm"
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <Field label="Name" required error={error}>
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Billing email">
              <Input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </Field>
            <Field label="Plan">
              <Select value={draft.plan} onValueChange={(plan) => setDraft({ ...draft, plan: plan as Customer['plan'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </form>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="customer-form">
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        destructive
        title={deleting?.length === 1 ? `Delete ${deleting[0]!.name}?` : `Delete ${deleting?.length ?? 0} customers?`}
        description="Their users lose access immediately. Invoices are kept for your records."
        confirmLabel="Delete"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 600))
          const ids = new Set(deleting?.map((row) => row.id))
          setRows((list) => list.filter((row) => !ids.has(row.id)))
          toast({ title: `${ids.size} deleted`, tone: 'success' })
        }}
      />
    </div>
  )
}

export function CrudPattern() {
  return (
    <div className="stack">
      <Demo
        title="Customers"
        note="Page header with the primary action; the table's own search, filters, pagination and column options; row actions; bulk delete from the selection bar; an editor in a sheet; a confirm that waits for the delete. Delete every row to see the empty state."
        inline={false}
        code={`
<PageHeader title="Customers" actions={<Button onClick={create}>New customer</Button>} />
<DataTable
  data={rows}
  columns={columns}
  enableRowSelection
  rowActions={(row) => [
    { icon: PencilIcon, label: 'Edit', onClick: () => edit(row.original) },
    { icon: TrashIcon, label: 'Delete', destructive: true, onClick: () => confirmDelete([row.original]) },
  ]}
  slots={{
    selectionActions: ({ table }) => (
      <Button size="sm" variant="destructive"
        onClick={() => confirmDelete(table.getSelectedRowModel().rows.map((r) => r.original))}>
        Delete
      </Button>
    ),
  }}
  emptyState={<Empty title="No customers yet" actions={<Button onClick={create}>Add a customer</Button>} />}
/>
<ConfirmDialog open={…} destructive title="Delete 3 customers?" onConfirm={deleteThem} />`}
      >
        <ToastProvider>
          <CrudPage />
          <Toaster position="bottom-right" />
        </ToastProvider>
      </Demo>
    </div>
  )
}
