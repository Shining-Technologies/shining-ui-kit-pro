import {
  Badge,
  Button,
  CalendarIcon,
  ChevronDownIcon,
  Command,
  CommandMenu,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  CopyIcon,
  CreditCardIcon,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FileIcon,
  InboxIcon,
  LinkIcon,
  MailIcon,
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  MenuShortcut,
  MoonIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
  type CommandItem,
} from '@shining-technologies/ui'
import { useMemo, useState } from 'react'
import { Demo } from '../Demo'

const STATUSES = ['Scheduled', 'In progress', 'On hold', 'Completed']

export function Menus() {
  const [lastAction, setLastAction] = useState('Nothing yet')
  const [pinned, setPinned] = useState(true)
  const [status, setStatus] = useState('In progress')
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(false)
  const [zoom, setZoom] = useState('100')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'new-job',
        label: 'New job',
        group: 'Create',
        icon: <PlusIcon />,
        shortcut: '⌘N',
        keywords: ['add', 'booking'],
      },
      {
        id: 'new-invoice',
        label: 'New invoice',
        group: 'Create',
        icon: <CreditCardIcon />,
        keywords: ['bill'],
      },
      {
        id: 'import',
        label: 'Import customers',
        group: 'Create',
        icon: <UploadIcon />,
        description: 'From a CSV file',
        keywords: ['csv', 'upload'],
      },
      { id: 'inbox', label: 'Inbox', group: 'Go to', icon: <InboxIcon />, shortcut: 'G I' },
      {
        id: 'schedule',
        label: 'Schedule',
        group: 'Go to',
        icon: <CalendarIcon />,
        shortcut: 'G S',
      },
      { id: 'documents', label: 'Documents', group: 'Go to', icon: <FileIcon /> },
      { id: 'settings', label: 'Settings', group: 'Go to', icon: <SlidersIcon />, shortcut: '⌘,' },
      {
        id: 'light',
        label: 'Switch to light mode',
        group: 'Preferences',
        icon: <SunIcon />,
        keywords: ['theme'],
      },
      {
        id: 'dark',
        label: 'Switch to dark mode',
        group: 'Preferences',
        icon: <MoonIcon />,
        keywords: ['theme'],
      },
      {
        id: 'billing',
        label: 'Billing portal',
        group: 'Preferences',
        icon: <CreditCardIcon />,
        disabled: true,
        description: 'Owners only',
      },
    ],
    [],
  )

  return (
    <div className="stack">
      <Demo
        title="Dropdown menu"
        note="Opened from a button. The same item row is used by every menu on this page, and MenuShortcut adds the key hint at the end of a row."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Job actions <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>JOB-4812</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setLastAction('Edit')}>
              <PencilIcon /> Edit <MenuShortcut>⌘E</MenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLastAction('Duplicate')}>
              <CopyIcon /> Duplicate <MenuShortcut>⌘D</MenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MailIcon /> Send to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setLastAction('Send to customer')}>
                  Customer
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLastAction('Send to crew')}>
                  Crew lead
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
              Pinned
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setLastAction('Delete')}>
              <TrashIcon /> Delete <MenuShortcut>⌫</MenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="muted">Last action: {lastAction}</span>
      </Demo>

      <Demo
        title="Context menu"
        note="Opens on right-click, or on a long press on touch screens. Nothing on screen shows that it exists, so treat it as a shortcut: every action in it must also be available somewhere visible."
        inline={false}
      >
        <div className="grid-2">
          <ContextMenu>
            <ContextMenuTrigger className="nav-demo__target">
              <span className="nav-demo__target-title">JOB-4812 · Deep clean</span>
              <span className="muted">
                Right-click this card, or long-press it on a touch screen.
              </span>
              <span>
                <Badge tone={status === 'Completed' ? 'success' : 'primary'}>{status}</Badge>{' '}
                {pinned ? <Badge tone="warning">Pinned</Badge> : null}
              </span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => setLastAction('Open')}>
                Open <MenuShortcut>↵</MenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction('Copy link')}>
                <LinkIcon /> Copy link <MenuShortcut>⌘C</MenuShortcut>
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>Set status</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuRadioGroup value={status} onValueChange={setStatus}>
                    {STATUSES.map((s) => (
                      <ContextMenuRadioItem key={s} value={s}>
                        {s}
                      </ContextMenuRadioItem>
                    ))}
                  </ContextMenuRadioGroup>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
                <PinIcon /> Pinned
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuLabel>Danger zone</ContextMenuLabel>
              <ContextMenuItem destructive onSelect={() => setLastAction('Delete')}>
                <TrashIcon /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <div className="stack-sm">
            <p className="muted">Last action: {lastAction}</p>
            <p className="muted">
              The status submenu and the Pinned toggle share their state with the card, so the
              badges update as you change them.
            </p>
          </div>
        </div>
      </Demo>

      <Demo
        title="Menubar"
        note="A menu bar like a desktop application's. Once one menu is open, ←/→ move to the next menu and moving the pointer along the bar switches between them. Check and radio items keep state."
        inline={false}
      >
        <div className="stack-sm">
          <Menubar aria-label="Editor">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => setLastAction('New file')}>
                  New file <MenuShortcut>⌘N</MenuShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction('Open…')}>
                  Open… <MenuShortcut>⌘O</MenuShortcut>
                </MenubarItem>
                <MenubarSub>
                  <MenubarSubTrigger>Open recent</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem onSelect={() => setLastAction('Open quote-2291.pdf')}>
                      quote-2291.pdf
                    </MenubarItem>
                    <MenubarItem onSelect={() => setLastAction('Open site-plan.png')}>
                      site-plan.png
                    </MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setLastAction('Save')}>
                  Save <MenuShortcut>⌘S</MenuShortcut>
                </MenubarItem>
                <MenubarItem disabled>
                  Export as PDF <MenuShortcut>⇧⌘E</MenuShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => setLastAction('Undo')}>
                  Undo <MenuShortcut>⌘Z</MenuShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction('Redo')}>
                  Redo <MenuShortcut>⇧⌘Z</MenuShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setLastAction('Cut')}>
                  Cut <MenuShortcut>⌘X</MenuShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction('Copy')}>
                  Copy <MenuShortcut>⌘C</MenuShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction('Paste')}>
                  Paste <MenuShortcut>⌘V</MenuShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
                  Show grid
                </MenubarCheckboxItem>
                <MenubarCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
                  Show rulers
                </MenubarCheckboxItem>
                <MenubarSeparator />
                <MenubarLabel>Zoom</MenubarLabel>
                <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
                  <MenubarRadioItem value="50">50%</MenubarRadioItem>
                  <MenubarRadioItem value="100">100%</MenubarRadioItem>
                  <MenubarRadioItem value="200">200%</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Help</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => setLastAction('Keyboard shortcuts')}>
                  Keyboard shortcuts <MenuShortcut>?</MenuShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction('Release notes')}>
                  Release notes
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <p className="muted">
            Last action: {lastAction} · grid {showGrid ? 'on' : 'off'} · rulers{' '}
            {showRulers ? 'on' : 'off'} · zoom {zoom}%
          </p>
        </div>
      </Demo>

      <Demo
        title="Command menu"
        note="A command palette. Press ⌘K (Ctrl+K on Windows) anywhere on this page, or use the button. Type to filter, press ↑/↓ to move and Enter to run. Choosing an item closes the menu, and focus returns to where it was before."
      >
        <Button variant="outline" className="nav-demo__search" onClick={() => setPaletteOpen(true)}>
          <SearchIcon />
          <span>Search or run a command…</span>
          <kbd className="nav-demo__kbd">⌘K</kbd>
        </Button>
        <span className="muted">Last command: {picked ?? 'none'}</span>
        <CommandMenu
          items={commands}
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onSelect={(item) => setPicked(item.label)}
          footer={
            <>
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> to move
              </span>
              <span>
                <kbd>↵</kbd> to run
              </span>
              <span>
                <kbd>esc</kbd> to close
              </span>
            </>
          }
        />
      </Demo>

      <Demo
        title="Command — inline"
        note="The same search and list without the dialog, for a page, a popover or an empty state. Disabled items are shown but skipped by the arrow keys."
        inline={false}
      >
        <div style={{ maxWidth: '32rem' }}>
          <Command
            items={commands}
            onSelect={(item) => setPicked(item.label)}
            placeholder="Filter commands…"
            emptyMessage="No commands match. Try 'invoice' or 'theme'."
          />
        </div>
      </Demo>
    </div>
  )
}
