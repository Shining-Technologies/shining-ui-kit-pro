import type { ColumnDef } from '@shining-technologies/ui-kit-react'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive'
  score: number
  createdAt: string
}

export const users: User[] = [
  {
    id: '1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'admin',
    status: 'active',
    score: 92,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'editor',
    status: 'active',
    score: 78,
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Alan Turing',
    email: 'alan@example.com',
    role: 'viewer',
    status: 'inactive',
    score: 64,
    createdAt: '2023-11-02',
  },
  {
    id: '4',
    name: 'Katherine Johnson',
    email: 'katherine@example.com',
    role: 'editor',
    status: 'active',
    score: 88,
    createdAt: '2024-03-05',
  },
  {
    id: '5',
    name: 'Barbara Liskov',
    email: 'barbara@example.com',
    role: 'admin',
    status: 'inactive',
    score: 71,
    createdAt: '2023-08-19',
  },
]

export const userColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    filter: {
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filter: {
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  },
  {
    accessorKey: 'score',
    header: 'Score',
    meta: { align: 'right' },
    filter: { type: 'number' },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    filter: { type: 'date' },
  },
]

/** Generate `count` deterministic rows, for pagination and performance tests. */
export function makeUsers(count: number): User[] {
  const roles: User['role'][] = ['admin', 'editor', 'viewer']
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    name: `User ${String(index + 1).padStart(4, '0')}`,
    email: `user${index + 1}@example.com`,
    role: roles[index % 3] as User['role'],
    status: index % 4 === 0 ? 'inactive' : 'active',
    score: (index * 7) % 101,
    createdAt: new Date(2024, index % 12, (index % 27) + 1).toISOString().slice(0, 10),
  }))
}
