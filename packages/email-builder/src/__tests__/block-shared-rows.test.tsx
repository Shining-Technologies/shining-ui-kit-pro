/**
 * Shared blocks in the BlockEditor (shining-email 0.4): the locked row on the canvas, saving a row
 * as a shared block, the "Edit shared block" dialog, a deleted or loading block, the palette
 * section, and the rule that a shared block in use is never deleted.
 */
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import { canonicalRef } from '../block-editor/refs'
import {
  SharedRowInUseError,
  type BlockEditorProps,
  type SavedRow,
  type SavedRowsAdapter,
} from '../block-editor/types'
import {
  allBlocks,
  blockDesignErrors,
  createBlock,
  createRow,
  emptyBlockDesign,
  isSharedRowRef,
  type BlockDesign,
  type Row,
  type TextBlock,
} from '../design'

const REF = '7b0c2f4e-5a1d-4c3b-9e8f-2a6d1b4c9e30'
const fields = [{ key: 'contact.first_name', label: 'First name', group: 'Contact' }]
const brand = { primary_color: '#aa0000', business_name: 'Acme' }

/** The row a shared block holds: a text and a spacer. */
function content(): Row {
  const row = createRow('100', [
    { ...createBlock('text', 'sb_text'), html: '<p>Terms apply to every order.</p>' } as TextBlock,
    createBlock('spacer', 'sb_spacer'),
  ])
  row.id = 'r_saved'
  row.columns[0]!.id = 'c_saved'
  return row
}

const shared = (patch: Partial<SavedRow> = {}): SavedRow => ({
  id: REF,
  name: 'Legal footer',
  row: content(),
  shared: true,
  usageCount: 3,
  ...patch,
})

/** [heading], then a shared block, then [divider]. */
function design(): BlockDesign {
  const first = createRow('100', [createBlock('heading', 'b_h')])
  first.id = 'r_1'
  const third = createRow('100', [createBlock('divider', 'b_d')])
  third.id = 'r_3'
  return {
    ...emptyBlockDesign(),
    rows: [first, { id: 'r_shared', type: 'shared', ref: REF }, third],
  }
}

function mount(initial: unknown, extra: Partial<BlockEditorProps> = {}) {
  const changes: BlockDesign[] = []
  function Harness() {
    const [value, setValue] = useState<unknown>(initial)
    return (
      <BlockEditor
        value={value}
        onChange={(next) => {
          changes.push(next)
          setValue(next)
        }}
        mergeFields={fields}
        brand={brand}
        {...extra}
      />
    )
  }
  render(<Harness />)
  return { changes, last: () => changes.at(-1)! }
}

/** A full adapter over ``items``; every call is a spy. */
function adapter(items: SavedRow[] = [shared()], patch: Partial<SavedRowsAdapter> = {}) {
  const base = {
    list: vi.fn(async () => items),
    save: vi.fn(
      async (name: string, row: Row, _width?: number, options?: { shared?: boolean }) =>
        ({ id: REF, name, row, shared: options?.shared === true, usageCount: 0 }) as SavedRow,
    ),
    remove: vi.fn(async (_id: SavedRow['id']) => undefined),
    update: vi.fn(
      async (id: SavedRow['id'], change: { name?: string; row?: Row }, _width?: number) =>
        ({ ...shared({ id }), ...change }) as SavedRow,
    ),
    get: vi.fn(async (_id: SavedRow['id']) => null as SavedRow | null),
  }
  return { ...base, ...patch } as typeof base
}

/** The yellow notice above the canvas (dnd-kit has live regions with the same role). */
const flash = () => document.querySelector<HTMLElement>('.seb-flash')

const sharedRow = () => document.querySelector<HTMLElement>('[data-shared-row]')!
const blockCells = () => Array.from(document.querySelectorAll<HTMLElement>('[data-block-id]'))
const toolbar = (n = 2) => screen.getByRole('toolbar', { name: `Row ${n} actions` })
const selectShared = async () => {
  await screen.findByText('Shared · Legal footer')
  await userEvent.click(sharedRow())
}

afterEach(() => vi.restoreAllMocks())

describe('a shared block on the canvas', () => {
  it('is a locked row with a badge, and says so to a screen reader', async () => {
    mount(design(), { savedRows: adapter() })
    expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
    expect(sharedRow()).toHaveAttribute('data-shared-row', 'ready')
    expect(sharedRow()).toHaveAccessibleName('Row 2: shared block “Legal footer”, read-only')
    // Its content is drawn…
    expect(within(sharedRow()).getByText('Terms apply to every order.')).toBeInTheDocument()
    // …but none of its blocks is a cell of the editor: the two normal blocks are the only ones.
    expect(blockCells().map((cell) => cell.dataset.blockId)).toEqual(['b_h', 'b_d'])
    expect(sharedRow().querySelector('[tabindex], .ProseMirror')).toBeNull()
  })

  it('selects as one row; its inner blocks cannot be selected or edited', async () => {
    const { changes } = mount(design(), { savedRows: adapter() })
    await screen.findByText('Shared · Legal footer')
    await userEvent.click(within(sharedRow()).getByText('Terms apply to every order.'))
    expect(sharedRow()).toHaveAttribute('data-selected')
    expect(sharedRow()).toHaveAttribute('aria-current', 'true')
    expect(document.querySelector('.ProseMirror')).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Properties' })).toHaveTextContent(
      'Shared block',
    )
    expect(changes).toHaveLength(0)
    // Properties: name, usage, and where the layout belongs.
    const props = within(screen.getByRole('complementary', { name: 'Properties' }))
    expect(props.getByText('Legal footer')).toBeInTheDocument()
    expect(props.getByText('Used in 3 templates')).toBeInTheDocument()
    expect(
      props.getByText(/Spacing, background and layout belong to the shared block/),
    ).toBeInTheDocument()
  })

  it('has Edit, Detach and Remove in its toolbar, with Detach explained', async () => {
    mount(design(), { savedRows: adapter() })
    await selectShared()
    const bar = within(toolbar())
    for (const name of [
      'Drag row to reorder',
      'Move row up',
      'Move row down',
      'Duplicate',
      'Edit shared block',
      'Detach',
      'Remove',
    ]) {
      expect(bar.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(bar.getByRole('button', { name: 'Detach' })).toHaveAttribute(
      'title',
      'Make a copy you can edit here',
    )
    // It is a shared block, not a row: no row layout or save buttons.
    expect(bar.queryByRole('button', { name: 'Row layout' })).toBeNull()
    expect(bar.queryByRole('button', { name: 'Save as row' })).toBeNull()
  })

  it('has no Edit without update, and keeps Detach', async () => {
    const { update: _update, ...readOnly } = adapter()
    mount(design(), { savedRows: readOnly })
    await selectShared()
    expect(within(toolbar()).queryByRole('button', { name: 'Edit shared block' })).toBeNull()
    expect(within(toolbar()).getByRole('button', { name: 'Detach' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit the shared block' })).toBeNull()
  })

  it('shows a placeholder while it loads, and the block once it is fetched', async () => {
    let finish: (row: SavedRow) => void = () => undefined
    const pending = new Promise<SavedRow>((resolve) => (finish = resolve))
    const source = adapter([], { get: vi.fn(() => pending) })
    mount(design(), { savedRows: source })
    expect(await screen.findByText('Loading shared block…')).toBeInTheDocument()
    expect(sharedRow()).toHaveAttribute('data-shared-row', 'loading')
    await waitFor(() => expect(source.get).toHaveBeenCalledWith(REF))
    await act(async () => finish(shared()))
    expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
    expect(source.get).toHaveBeenCalledTimes(1)
  })

  it('shows a grey box for a deleted block, and only Remove', async () => {
    const source = adapter([], { get: vi.fn(async () => null) })
    const { last } = mount(design(), { savedRows: source })
    expect(await screen.findByText('This shared block was deleted')).toBeInTheDocument()
    expect(sharedRow()).toHaveAttribute('data-shared-row', 'missing')
    await userEvent.click(sharedRow())
    const bar = within(toolbar())
    expect(bar.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Remove'])
    await userEvent.click(bar.getByRole('button', { name: 'Remove' }))
    expect(last().rows.map((r) => r.id)).toEqual(['r_1', 'r_3'])
  })

  it('says a block that could not be fetched is not available, not deleted', async () => {
    const source = adapter([], {
      get: vi.fn(async () => {
        throw new Error('Offline')
      }),
    })
    mount(design(), { savedRows: source })
    expect(await screen.findByText('This shared block could not be loaded.')).toBeInTheDocument()
    expect(screen.queryByText('This shared block was deleted')).toBeNull()
  })

  it('moves, duplicates and removes like a row', async () => {
    const { last } = mount(design(), { savedRows: adapter() })
    await selectShared()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Move row up' }))
    expect(last().rows.map((r) => r.id)).toEqual(['r_shared', 'r_1', 'r_3'])
    await userEvent.click(within(toolbar(1)).getByRole('button', { name: 'Duplicate' }))
    const placeholders = last().rows.filter(isSharedRowRef)
    expect(placeholders).toHaveLength(2)
    expect(placeholders.map((p) => p.ref)).toEqual([REF, REF])
    expect(new Set(last().rows.map((r) => r.id)).size).toBe(4)
    await userEvent.click(within(toolbar(2)).getByRole('button', { name: 'Remove' }))
    expect(last().rows.filter(isSharedRowRef)).toHaveLength(1)
  })

  it('draws the saved row, not its own settings, and hides on the placeholder’s hide_on', async () => {
    const d = design()
    ;(d.rows[1] as { hide_on?: string }).hide_on = 'mobile'
    mount(d, { savedRows: adapter(), device: 'mobile' })
    await screen.findByText('Shared · Legal footer')
    expect(within(sharedRow()).getByText('Hidden on mobile')).toBeInTheDocument()
  })

  it('shows no toolbar when the editor is disabled', async () => {
    mount(design(), { savedRows: adapter(), disabled: true })
    await screen.findByText('Shared · Legal footer')
    await userEvent.click(sharedRow())
    expect(screen.queryByRole('toolbar')).toBeNull()
  })
})

describe('Detach', () => {
  it('makes an editable copy with new ids in place, and Undo brings the placeholder back', async () => {
    const { last } = mount(design(), { savedRows: adapter() })
    await selectShared()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Detach' }))

    const rows = last().rows
    expect(rows.map(isSharedRowRef)).toEqual([false, false, false])
    const copy = rows[1] as Row
    expect(copy.id).not.toBe('r_saved')
    expect(copy.columns[0]!.blocks.map((b) => b.type)).toEqual(['text', 'spacer'])
    expect(copy.columns[0]!.blocks.map((b) => b.id)).not.toContain('sb_text')
    expect(blockDesignErrors(last())).toEqual([])
    // It is a normal row now: its blocks are cells, and the badge is gone.
    expect(screen.queryByText('Shared · Legal footer')).toBeNull()
    expect(blockCells()).toHaveLength(4)
    expect(flash()).toHaveTextContent('Made a copy of “Legal footer”')

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(last().rows.map((r) => r.id)).toEqual(['r_1', 'r_shared', 'r_3'])
    expect(isSharedRowRef(last().rows[1])).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(isSharedRowRef(last().rows[1])).toBe(false)
  })

  it('works from the properties pane too', async () => {
    const { last } = mount(design(), { savedRows: adapter() })
    await selectShared()
    await userEvent.click(screen.getByRole('button', { name: 'Detach into a copy' }))
    expect(last().rows.some(isSharedRowRef)).toBe(false)
  })

  it('says why when the block is still loading', async () => {
    const source = adapter([], { get: vi.fn(() => new Promise<SavedRow | null>(() => undefined)) })
    const { changes } = mount(design(), { savedRows: source })
    await screen.findByText('Loading shared block…')
    await userEvent.click(sharedRow())
    // While loading only Remove is offered, so Detach comes from the properties pane.
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(changes.at(-1)!.rows.some(isSharedRowRef)).toBe(false)
  })
})

describe('Save as shared block', () => {
  const plain = (): BlockDesign => {
    const row = createRow('100', [createBlock('heading', 'b_h')])
    row.id = 'r_1'
    return { ...emptyBlockDesign(), rows: [row] }
  }

  async function saveAs(name: string) {
    await userEvent.click(screen.getByRole('button', { name: 'Save as shared block' }))
    const form = within(screen.getByRole('dialog', { name: 'Save as shared block' }))
    await userEvent.type(form.getByLabelText('Name'), name)
    await userEvent.click(form.getByRole('button', { name: 'Save shared block' }))
  }

  it('saves the row with {shared: true} and puts a placeholder in its place', async () => {
    const source = adapter([])
    const { last } = mount(plain(), { savedRows: source })
    await screen.findByText(/No shared blocks yet/)
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    await saveAs('Legal footer')

    await waitFor(() => expect(source.save).toHaveBeenCalledTimes(1))
    const [name, row, width, options] = source.save.mock.calls[0]!
    expect(name).toBe('Legal footer')
    expect(row).toMatchObject({ columns: [{ blocks: [{ type: 'heading' }] }] })
    // A copy with new ids, so the saved row never shares ids with the email.
    expect(row.id).not.toBe('r_1')
    expect(width).toBe(600)
    expect(options).toEqual({ shared: true })

    await waitFor(() => expect(last().rows[0]).toEqual({ id: 'r_1', type: 'shared', ref: REF }))
    expect(blockDesignErrors(last())).toEqual([])
    expect(flash()).toHaveTextContent('Saved “Legal footer” as a shared block')
    // Listed under Shared blocks, and not under Saved rows.
    const group = screen.getByRole('region', { name: 'Shared blocks' })
    expect(within(group).getByRole('button', { name: /^Legal footer/ })).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Saved rows' })).queryByText('Legal footer'),
    ).toBeNull()
  })

  it('is one undo step away from a normal row again', async () => {
    const { last } = mount(plain(), { savedRows: adapter([]) })
    await screen.findByText(/No shared blocks yet/)
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    await saveAs('Legal footer')
    await waitFor(() => expect(isSharedRowRef(last().rows[0])).toBe(true))
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(isSharedRowRef(last().rows[0])).toBe(false)
  })

  it('asks for a name, and shows the server’s reason when it is refused', async () => {
    const source = adapter([], {
      save: vi.fn(async () => {
        throw new Error('A shared block with that name exists')
      }),
    })
    const { changes } = mount(plain(), { savedRows: source })
    await screen.findByText(/No shared blocks yet/)
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    await userEvent.click(screen.getByRole('button', { name: 'Save as shared block' }))
    const form = within(screen.getByRole('dialog', { name: 'Save as shared block' }))
    await userEvent.click(form.getByRole('button', { name: 'Save shared block' }))
    expect(form.getByText('Give the shared block a name')).toBeInTheDocument()
    await userEvent.type(form.getByLabelText('Name'), 'Dup')
    await userEvent.click(form.getByRole('button', { name: 'Save shared block' }))
    expect(await form.findByText('A shared block with that name exists')).toBeInTheDocument()
    expect(changes).toHaveLength(0)
  })

  it('leaves the row alone if it was removed while the request ran', async () => {
    let finish: (row: SavedRow) => void = () => undefined
    const source = adapter([], { save: vi.fn(() => new Promise<SavedRow>((r) => (finish = r))) })
    const { last } = mount(plain(), { savedRows: source })
    await screen.findByText(/No shared blocks yet/)
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    await saveAs('Gone')
    await waitFor(() => expect(source.save).toHaveBeenCalled())
    await userEvent.click(within(toolbar(1)).getByRole('button', { name: 'Delete row' }))
    expect(last().rows).toHaveLength(0)
    await act(async () => finish({ id: REF, name: 'Gone', row: content(), shared: true }))
    expect(last().rows).toHaveLength(0)
  })

  it('is not offered without save', async () => {
    const { save: _save, ...noSave } = adapter([])
    mount(plain(), { savedRows: noSave })
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    expect(screen.queryByRole('button', { name: 'Save as shared block' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save as row' })).toBeNull()
  })

  it('does not change the plain “Save as row”, which saves without the shared option', async () => {
    const source = adapter([])
    mount(plain(), { savedRows: source })
    await screen.findByText(/No shared blocks yet/)
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    await userEvent.click(screen.getByRole('button', { name: 'Save as row' }))
    const form = within(screen.getByRole('dialog', { name: 'Save as row' }))
    await userEvent.type(form.getByLabelText('Name'), 'Plain')
    await userEvent.click(form.getByRole('button', { name: 'Save row' }))
    await waitFor(() => expect(source.save).toHaveBeenCalledTimes(1))
    expect(source.save.mock.calls[0]!.length).toBe(3)
  })
})

describe('Edit shared block', () => {
  async function openDialog(source = adapter()) {
    const view = mount(design(), { savedRows: source })
    await selectShared()
    const opener = within(toolbar()).getByRole('button', { name: 'Edit shared block' })
    await userEvent.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Edit shared block “Legal footer”' })
    return { ...view, source, dialog, opener }
  }

  it('opens a modal that names the block and what saving does', async () => {
    const { dialog } = await openDialog()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription(
      'Used in 3 templates. Saving changes all of them; emails already sent or queued do not change.',
    )
    // The nested editor shows the shared block's row, at one row, and cannot hold another shared block.
    const inner = within(dialog)
    expect(inner.getByText('Terms apply to every order.')).toBeInTheDocument()
    expect(inner.queryByRole('region', { name: 'Layouts' })).toBeNull()
    expect(inner.queryByRole('region', { name: 'Shared blocks' })).toBeNull()
    expect(inner.queryByRole('region', { name: 'Saved rows' })).toBeNull()
    expect(inner.getByRole('region', { name: 'Blocks' })).toBeInTheDocument()
    expect(inner.queryByRole('button', { name: 'Save as shared block' })).toBeNull()
    expect(inner.queryByRole('button', { name: 'Delete row' })).toBeNull()
  })

  it('moves focus in, keeps Tab inside, and gives focus back when it closes', async () => {
    const { dialog, opener } = await openDialog()
    expect(dialog.contains(document.activeElement)).toBe(true)
    const save = within(dialog).getByRole('button', { name: 'Save shared block' })
    save.focus()
    await userEvent.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: 'Close without saving' }),
    )
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(save)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('discards on Cancel and on Close', async () => {
    const { source } = await openDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull()
    expect(source.update).not.toHaveBeenCalled()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Edit shared block' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close without saving' }))
    expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull()
    expect(source.update).not.toHaveBeenCalled()
  })

  it('saves the edited row with update(), closes, and refreshes the canvas', async () => {
    const edited = content()
    edited.columns[0]!.blocks.push(createBlock('divider', 'sb_new'))
    const source = adapter([shared()], {
      update: vi.fn(async (id: SavedRow['id']) => shared({ id, row: edited, usageCount: 3 })),
    })
    const { dialog, changes } = await openDialog(source)
    // Select a block in the nested editor, then add after it.
    const inner = within(dialog)
    await userEvent.click(inner.getByText('Terms apply to every order.'))
    await userEvent.click(inner.getByRole('button', { name: 'Divider' }))
    await userEvent.click(inner.getByRole('button', { name: 'Save shared block' }))

    await waitFor(() => expect(source.update).toHaveBeenCalledTimes(1))
    const [id, patch, width] = source.update.mock.calls[0]! as unknown as [
      string,
      { row: Row },
      number,
    ]
    expect(id).toBe(REF)
    expect(patch.row.columns[0]!.blocks.map((b) => b.type)).toEqual(['text', 'divider', 'spacer'])
    expect(width).toBe(600)

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull(),
    )
    // The canvas shows the new content; the template's design itself did not change.
    expect(sharedRow().querySelectorAll('[data-type="divider"]')).toHaveLength(1)
    expect(changes).toHaveLength(0)
    expect(flash()).toHaveTextContent('Saved the shared block “Legal footer”')
  })

  it('shows the server’s refusal inside the dialog and stays open', async () => {
    const source = adapter([shared()], {
      update: vi.fn(async () => {
        throw new Error('Template “Welcome”: A design may have only one footer block')
      }),
    })
    const { dialog } = await openDialog(source)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save shared block' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Template “Welcome”: A design may have only one footer block',
    )
    expect(screen.getByRole('dialog', { name: /Edit shared block/ })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Save shared block' })).toBeEnabled()
  })

  it('has its own undo, and Ctrl+Z in it does not undo the email', async () => {
    const { dialog, changes } = await openDialog()
    const inner = within(dialog)
    await userEvent.click(inner.getByText('Terms apply to every order.'))
    await userEvent.click(inner.getByRole('button', { name: 'Divider' }))
    expect(inner.getAllByRole('group', { name: /Divider block/ })).toHaveLength(1)
    await userEvent.click(inner.getByRole('button', { name: 'Undo' }))
    expect(inner.queryAllByRole('group', { name: /Divider block/ })).toHaveLength(0)
    expect(changes).toHaveLength(0)
  })

  it('refuses to remove the one row of the nested editor', async () => {
    const { dialog } = await openDialog()
    // The row itself is selected from the canvas; deleting it would leave none.
    await userEvent.click(dialog.querySelector<HTMLElement>('[data-row-id]')!)
    await userEvent.keyboard('{Delete}')
    expect(dialog.querySelector('.seb-flash')).toHaveTextContent('A shared block is one row.')
    expect(dialog.querySelectorAll('[data-row-id]')).toHaveLength(1)
  })

  it('has no Edit button for a user who may not update', async () => {
    const { update: _update, ...readOnly } = adapter()
    mount(design(), { savedRows: readOnly })
    await selectShared()
    expect(screen.queryByRole('button', { name: /Edit (the )?shared block/ })).toBeNull()
  })
})

describe('the Shared blocks palette section', () => {
  it('lists shared blocks apart from saved rows, with how many templates use each', async () => {
    const plainSaved: SavedRow = { id: 5, name: 'Signature', row: content() }
    mount(null, { savedRows: adapter([shared(), plainSaved]) })
    const sharedGroup = await screen.findByRole('region', { name: 'Shared blocks' })
    const savedGroup = screen.getByRole('region', { name: 'Saved rows' })
    expect(within(sharedGroup).getByRole('button', { name: /^Legal footer/ })).toHaveAccessibleName(
      /Legal footer.*used in 3 templates/,
    )
    expect(within(sharedGroup).queryByText('Signature')).toBeNull()
    expect(within(savedGroup).getByRole('button', { name: 'Signature' })).toBeInTheDocument()
    expect(within(savedGroup).queryByText('Legal footer')).toBeNull()
  })

  it('inserts a placeholder, not a copy, after the selection', async () => {
    const { last } = mount(design(), { savedRows: adapter() })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(within(group).getByRole('button', { name: /^Legal footer/ }))
    const rows = last().rows
    expect(rows).toHaveLength(4)
    const added = rows.find((r) => isSharedRowRef(r) && r.id !== 'r_shared')
    expect(added).toMatchObject({ type: 'shared', ref: REF })
    expect(blockDesignErrors(last())).toEqual([])
    // The new row is selected.
    expect(document.querySelector(`[data-row-id="${added!.id}"]`)).toHaveAttribute('data-selected')
  })

  it('refuses a shared block with a footer when the email has one, and says why', async () => {
    const withFooter = content()
    withFooter.columns[0]!.blocks.push(createBlock('footer', 'sb_footer'))
    const own = createRow('100', [createBlock('footer', 'b_f')])
    own.id = 'r_own'
    const { changes } = mount(
      { ...emptyBlockDesign(), rows: [own] },
      {
        savedRows: adapter([shared({ row: withFooter })]),
      },
    )
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(within(group).getByRole('button', { name: /^Legal footer/ }))
    expect(changes).toHaveLength(0)
    expect(flash()).toHaveTextContent(
      'This shared block has a footer and the email already has one.',
    )
  })

  it('counts a footer inside a shared block when adding a footer block', async () => {
    const withFooter = content()
    withFooter.columns[0]!.blocks.push(createBlock('footer', 'sb_footer'))
    mount(design(), { savedRows: adapter([shared({ row: withFooter })]) })
    await screen.findByText('Shared · Legal footer')
    const blocks = within(screen.getByRole('region', { name: 'Blocks' }))
    expect(blocks.getByRole('button', { name: 'Footer' })).toBeDisabled()
  })

  it('does not duplicate a shared block that has a footer', async () => {
    const withFooter = content()
    withFooter.columns[0]!.blocks.push(createBlock('footer', 'sb_footer'))
    const { changes } = mount(design(), { savedRows: adapter([shared({ row: withFooter })]) })
    await selectShared()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Duplicate' }))
    expect(changes).toHaveLength(0)
    expect(flash()).toHaveTextContent('only one footer')
  })

  it('says when there are none, and how to make one', async () => {
    mount(null, { savedRows: adapter([]) })
    expect(await screen.findByText(/No shared blocks yet\. Select a row/)).toBeInTheDocument()
  })

  it('has no section without a saved-row adapter', () => {
    mount(null)
    expect(screen.queryByRole('region', { name: 'Shared blocks' })).toBeNull()
  })
})

describe('deleting a shared block', () => {
  it('is always refused while templates use it: the notice names them, and there is no force', async () => {
    const remove = vi.fn(async () => {
      throw new SharedRowInUseError('This shared block is used by 2 templates.', [
        { id: '1', name: 'Welcome' },
        { id: '2', name: 'Follow-up' },
      ])
    })
    const source = adapter([shared()], { remove })
    mount(null, { savedRows: source })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(
      within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
    )
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Legal footer”?' }))

    await waitFor(() =>
      expect(flash()).toHaveTextContent(
        'Used in 2 templates: Welcome, Follow-up. Remove it from those templates first.',
      ),
    )
    // Asked once, with the id alone: there is no option to delete it anyway.
    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove.mock.calls[0]).toEqual([REF])
    expect(screen.queryByRole('button', { name: /anyway|force/i })).toBeNull()
    // Still listed.
    expect(within(group).getByRole('button', { name: /^Legal footer/ })).toBeInTheDocument()
  })

  it('says “template” for one', async () => {
    const remove = vi.fn(async () => {
      throw new SharedRowInUseError('in use', [{ id: '1', name: 'Welcome' }])
    })
    mount(null, { savedRows: adapter([shared()], { remove }) })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(
      within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
    )
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Legal footer”?' }))
    await waitFor(() =>
      expect(flash()).toHaveTextContent(
        'Used in 1 template: Welcome. Remove it from those templates first.',
      ),
    )
  })

  it('removes an unused one from the list', async () => {
    const source = adapter([shared({ usageCount: 0 })])
    mount(null, { savedRows: source })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(
      within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
    )
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Legal footer”?' }))
    await waitFor(() => expect(source.remove).toHaveBeenCalledWith(REF))
    await waitFor(() =>
      expect(within(group).queryByRole('button', { name: /^Legal footer/ })).toBeNull(),
    )
  })

  it('has no delete button without remove', async () => {
    const { remove: _remove, ...noRemove } = adapter()
    mount(null, { savedRows: noRemove })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    expect(within(group).queryByRole('button', { name: /Delete shared block/ })).toBeNull()
  })
})

describe('limits for the editor inside a shared block', () => {
  it('does not offer shared blocks or saving one when allowShared is false', async () => {
    const source = adapter()
    const row = createRow('100', [createBlock('heading', 'b_h')])
    mount(
      { ...emptyBlockDesign(), rows: [row] },
      {
        savedRows: source,
        constraints: { allowShared: false },
      },
    )
    await waitFor(() => expect(source.list).toHaveBeenCalled())
    expect(screen.queryByRole('region', { name: 'Shared blocks' })).toBeNull()
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id]')!)
    expect(screen.queryByRole('button', { name: 'Save as shared block' })).toBeNull()
  })
})

describe('a design with shared blocks and the data it is given', () => {
  it('keeps the value it is given when nothing was changed', async () => {
    const d = design()
    const { changes } = mount(d, { savedRows: adapter() })
    await screen.findByText('Shared · Legal footer')
    expect(changes).toHaveLength(0)
    expect(allBlocks(d)).toHaveLength(2)
  })
})

/* -- review fixes --------------------------------------------------------- */

/** A row as the server stores it: compact, with every prop equal to its default left out. */
const compactRow = (): Row =>
  ({
    id: 'r_saved',
    columns: [
      {
        id: 'c_saved',
        width: 100,
        blocks: [
          { id: 'sb_text', type: 'text', html: '<p>Terms apply to every order.</p>' },
          { id: 'sb_button', type: 'button', label: 'Read more', url: 'https://x.test/terms' },
          { id: 'sb_footer', type: 'footer' },
        ],
      },
    ],
  }) as unknown as Row

describe('a shared block as the server stores it (compact)', () => {
  it('draws a listed row that has no padding, gap or block defaults', async () => {
    mount(design(), { savedRows: adapter([shared({ row: compactRow() })]) })
    expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
    expect(within(sharedRow()).getByText('Terms apply to every order.')).toBeInTheDocument()
    expect(within(sharedRow()).getByText('Read more')).toBeInTheDocument()
    // The row’s own padding default was filled in.
    expect(sharedRow().querySelector<HTMLElement>('.seb-row-inner')!.style.padding).toBe(
      '16px 24px',
    )
  })

  it('draws a row fetched with get, too', async () => {
    const source = adapter([], { get: vi.fn(async () => shared({ row: compactRow() })) })
    mount(design(), { savedRows: source })
    expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
    expect(within(sharedRow()).getByText('Read more')).toBeInTheDocument()
  })

  it('edits and detaches it, and sees its footer when adding one', async () => {
    const { last } = mount(design(), { savedRows: adapter([shared({ row: compactRow() })]) })
    await selectShared()
    const blocks = within(screen.getByRole('region', { name: 'Blocks' }))
    expect(blocks.getByRole('button', { name: 'Footer' })).toBeDisabled()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Edit shared block' }))
    const dialog = await screen.findByRole('dialog', { name: /Edit shared block/ })
    expect(within(dialog).getByText('Read more')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Detach' }))
    expect(last().rows.some(isSharedRowRef)).toBe(false)
  })
})

describe('a shared block that cannot be loaded', () => {
  it('is “could not be loaded”, not “deleted”, when the list failed and there is no get', async () => {
    const { get: _get, ...noGet } = adapter([], {
      list: vi.fn(async () => {
        throw new Error('Offline')
      }),
    })
    mount(design(), { savedRows: noGet })
    expect(await screen.findByText('This shared block could not be loaded.')).toBeInTheDocument()
    expect(screen.queryByText('This shared block was deleted')).toBeNull()
  })

  it('has a Try again button that fetches that block again', async () => {
    const get = vi
      .fn<(id: SavedRow['id']) => Promise<SavedRow | null>>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(shared())
    mount(design(), { savedRows: adapter([], { get }) })
    expect(await screen.findByText('This shared block could not be loaded.')).toBeInTheDocument()
    await userEvent.click(within(sharedRow()).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('does not show a second fetch loop: still failing, it waits for the next Try again', async () => {
    const get = vi
      .fn<(id: SavedRow['id']) => Promise<SavedRow | null>>()
      .mockRejectedValue(new Error('Offline'))
    mount(design(), { savedRows: adapter([], { get }) })
    await screen.findByText('This shared block could not be loaded.')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(get).toHaveBeenCalledTimes(1)
    await userEvent.click(within(sharedRow()).getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('This shared block could not be loaded.')).toBeInTheDocument()
  })

  it('tries again when the saved rows are loaded again, not before', async () => {
    const get = vi
      .fn<(id: SavedRow['id']) => Promise<SavedRow | null>>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(shared())
    const list = vi
      .fn<() => Promise<SavedRow[]>>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue([])
    mount(design(), { savedRows: adapter([], { list, get }) })
    expect(await screen.findByText('This shared block could not be loaded.')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(1)
    const saved = within(screen.getByRole('region', { name: 'Saved rows' }))
    await userEvent.click(saved.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(2)
  })
})

describe('Save as shared block, when the row changes meanwhile', () => {
  it('keeps it a normal row and says the shared block is from the earlier version', async () => {
    let finish: (row: SavedRow) => void = () => undefined
    const source = adapter([], { save: vi.fn(() => new Promise<SavedRow>((r) => (finish = r))) })
    const row = createRow('100', [createBlock('heading', 'b_h')])
    row.id = 'r_1'
    const { last } = mount({ ...emptyBlockDesign(), rows: [row] }, { savedRows: source })
    await screen.findByText(/No shared blocks yet/)
    await userEvent.click(document.querySelector<HTMLElement>('[data-row-id="r_1"]')!)
    await userEvent.click(screen.getByRole('button', { name: 'Save as shared block' }))
    const form = within(screen.getByRole('dialog', { name: 'Save as shared block' }))
    await userEvent.type(form.getByLabelText('Name'), 'Early')
    await userEvent.click(form.getByRole('button', { name: 'Save shared block' }))
    await waitFor(() => expect(source.save).toHaveBeenCalled())
    // The row is changed while the request runs.
    await userEvent.selectOptions(screen.getByLabelText('Hide on'), 'mobile')
    expect(last().rows[0]).toMatchObject({ hide_on: 'mobile' })
    await act(async () => finish({ id: REF, name: 'Early', row: content(), shared: true }))
    expect(isSharedRowRef(last().rows[0])).toBe(false)
    expect(flash()).toHaveTextContent('from the earlier version of this row')
    // It is in the palette, though.
    expect(
      within(screen.getByRole('region', { name: 'Shared blocks' })).getByRole('button', {
        name: /^Early/,
      }),
    ).toBeInTheDocument()
  })
})

describe('after a shared block is edited', () => {
  it('says so when the email now has two footers', async () => {
    const withFooter = content()
    withFooter.columns[0]!.blocks.push(createBlock('footer', 'sb_footer'))
    const own = createRow('100', [createBlock('footer', 'b_f')])
    own.id = 'r_own'
    const d = { ...design(), rows: [...design().rows, own] }
    const source = adapter([shared()], {
      update: vi.fn(async (id: SavedRow['id']) => shared({ id, row: withFooter })),
    })
    mount(d, { savedRows: source })
    await selectShared()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Edit shared block' }))
    const dialog = await screen.findByRole('dialog', { name: /Edit shared block/ })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save shared block' }))
    await waitFor(() => expect(flash()).toHaveTextContent('now has more than one footer'))
  })
})

describe('the Edit shared block dialog, closing', () => {
  async function open() {
    mount(design(), { savedRows: adapter() })
    await selectShared()
    await userEvent.click(within(toolbar()).getByRole('button', { name: 'Edit shared block' }))
    const dialog = await screen.findByRole('dialog', { name: /Edit shared block/ })
    return dialog
  }
  const makeChange = async (dialog: HTMLElement) => {
    await userEvent.click(within(dialog).getByText('Terms apply to every order.'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Divider' }))
  }

  it('is portalled to the document body, with the editor’s styles around it', async () => {
    const dialog = await open()
    expect(document.body.contains(dialog)).toBe(true)
    expect(screen.getByRole('group', { name: 'Email builder' }).contains(dialog)).toBe(false)
    expect(dialog.closest('.seb-editor.seb-blocks.seb-portal')).not.toBeNull()
    expect(dialog.parentElement!.parentElement!.parentElement).toBe(document.body)
  })

  it('closes at once when nothing changed', async () => {
    const dialog = await open()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull()
  })

  it('asks before discarding changes, from Cancel, Close and Esc, and Esc keeps editing', async () => {
    const dialog = await open()
    await makeChange(dialog)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    const ask = within(dialog).getByRole('alertdialog', { name: 'Discard changes?' })
    expect(within(ask).getByRole('button', { name: 'Keep editing' })).toHaveFocus()
    // Esc while asking goes back to editing.
    await userEvent.keyboard('{Escape}')
    expect(within(dialog).queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('dialog', { name: /Edit shared block/ })).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close without saving' }))
    expect(within(dialog).getByRole('alertdialog')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
    await userEvent.keyboard('{Escape}')
    expect(within(dialog).getByRole('alertdialog')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard changes' }))
    expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull()
  })

  it('does not close on Esc while a drag is under way in the editor inside', async () => {
    const dialog = await open()
    const inner = dialog.querySelector<HTMLElement>('.seb-editor')!
    inner.setAttribute('data-drag-active', '')
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: /Edit shared block/ })).toBeInTheDocument()
    inner.removeAttribute('data-drag-active')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /Edit shared block/ })).toBeNull()
  })

  it('sets data-drag-active on the editor during a drag', () => {
    mount(design(), { savedRows: adapter() })
    expect(document.querySelector('[data-drag-active]')).toBeNull()
  })
})

describe('refs are matched as the server spells them', () => {
  const asPlaceholder = (ref: string): BlockDesign => ({
    ...emptyBlockDesign(),
    rows: [{ id: 'r_shared', type: 'shared', ref }],
  })

  it('finds a block listed with a hyphenated id from a 32-hex or upper-case ref', async () => {
    for (const ref of [REF.replace(/-/g, ''), REF.toUpperCase()]) {
      const source = adapter([shared()])
      mount(asPlaceholder(ref), { savedRows: source })
      expect(await screen.findByText('Shared · Legal footer')).toBeInTheDocument()
      expect(source.get).not.toHaveBeenCalled()
      cleanup()
    }
  })

  it('canonicalRef hyphenates and lower-cases, and leaves what is not a UUID', () => {
    expect(canonicalRef(REF.replace(/-/g, '').toUpperCase())).toBe(REF)
    expect(canonicalRef(`{${REF.toUpperCase()}}`)).toBe(REF)
    expect(canonicalRef(`urn:uuid:${REF}`)).toBe(REF)
    expect(canonicalRef(REF)).toBe(REF)
    expect(canonicalRef('Not-A-UUID')).toBe('not-a-uuid')
  })
})
