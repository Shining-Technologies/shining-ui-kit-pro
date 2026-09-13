'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  Button,
  ColorModeToggle,
  Combobox,
  DateField,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
  ToastProvider,
  Toaster,
  useToast,
  type SidebarNavEntry,
} from '@shining-technologies/ui'

const NAV: SidebarNavEntry[] = [
  {
    type: 'section',
    id: 'main',
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', href: '/' },
      { id: 'shell', label: 'Shell', href: '/shell' },
      {
        id: 'data',
        label: 'Data',
        children: [
          { id: 'users', label: 'Users', href: '/users' },
          { id: 'client', label: 'Client table', href: '/client-table' },
        ],
      },
      {
        id: 'look',
        label: 'Look',
        children: [
          { id: 'theme', label: 'Theme', href: '/theme' },
          { id: 'charts', label: 'Charts', href: '/charts' },
        ],
      },
    ],
  },
]

function ToastButton() {
  const { toast } = useToast()
  return (
    <Button onClick={() => toast({ title: 'Saved', description: 'Toast from useToast', tone: 'success' })}>
      Show toast
    </Button>
  )
}

export function ShellDemo() {
  const pathname = usePathname()
  const [fruit, setFruit] = useState<string>('')
  const [framework, setFramework] = useState<string | null>(null)
  const [date, setDate] = useState<string | undefined>(undefined)
  const [menuChoice, setMenuChoice] = useState('none')

  return (
    <ToastProvider>
      <SidebarProvider>
        <AppShell>
          <Sidebar aria-label="Demo navigation" header={<SidebarBrand name="Shining" />}>
            <SidebarNav
              items={NAV}
              currentPath={pathname}
              renderLink={({ href, children, ...rest }) => (
                <Link href={href} {...rest}>
                  {children}
                </Link>
              )}
            />
          </Sidebar>
          <AppShellContent>
            <AppShellHeader start={<SidebarTrigger />} end={<ColorModeToggle />}>
              <span>Shell demo</span>
            </AppShellHeader>
            <div className="p-6 space-y-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="open-dialog">Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Demo dialog</DialogTitle>
                    <DialogDescription>A dialog in a client component.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close dialog</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setMenuChoice('edit')}>Edit</DropdownMenuItem>
                  <DropdownMenuItem destructive onSelect={() => setMenuChoice('delete')}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p data-testid="menu-choice">{menuChoice}</p>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open popover</Button>
                </PopoverTrigger>
                <PopoverContent>Popover body</PopoverContent>
              </Popover>

              <div>
                <Select value={fruit} onValueChange={setFruit}>
                  <SelectTrigger aria-label="Fruit">
                    <SelectValue placeholder="Pick a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="banana">Banana</SelectItem>
                    <SelectItem value="cherry">Cherry</SelectItem>
                  </SelectContent>
                </Select>
                <p data-testid="fruit">{fruit}</p>
              </div>

              <div>
                <Combobox
                  aria-label="Framework"
                  options={[
                    { value: 'next', label: 'Next.js' },
                    { value: 'remix', label: 'Remix' },
                    { value: 'astro', label: 'Astro' },
                  ]}
                  value={framework}
                  onValueChange={setFramework}
                  placeholder="Pick a framework"
                />
                <p data-testid="framework">{framework ?? ''}</p>
              </div>

              <div>
                <DateField label="Start date" value={date} onChange={setDate} locale="en-AU" />
                <p data-testid="date">{date ?? ''}</p>
              </div>

              <ToastButton />
            </div>
          </AppShellContent>
        </AppShell>
      </SidebarProvider>
      <Toaster />
    </ToastProvider>
  )
}
