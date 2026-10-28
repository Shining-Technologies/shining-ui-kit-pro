/**
 * The palette's inline "Delete “name”? / Keep" question (0.3.1): a refused or failed delete closes it
 * and says why under the row, and the question is built to wrap inside a narrow palette.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import { SharedRowInUseError, type SavedRow, type SavedRowsAdapter } from '../block-editor/types'
import { createBlock, createRow, emptyBlockDesign } from '../design'

const REF = '7b0c2f4e-5a1d-4c3b-9e8f-2a6d1b4c9e30'
const LONG = 'Legal footer with a very long name that cannot fit the narrow palette on one line'

function content() {
  const row = createRow('100', [createBlock('divider', 'sb_div')])
  row.id = 'r_saved'
  row.columns[0]!.id = 'c_saved'
  return row
}

const sharedRow = (name = LONG): SavedRow => ({
  id: REF,
  name,
  row: content(),
  shared: true,
  usageCount: 2,
})
const plainRow = (name = LONG): SavedRow => ({ id: 3, name, row: content() })

function mount(savedRows: SavedRowsAdapter) {
  function Harness() {
    const [value, setValue] = useState<unknown>(emptyBlockDesign())
    return (
      <BlockEditor
        value={value}
        onChange={setValue}
        mergeFields={[{ key: 'contact.first_name', label: 'First name' }]}
        brand={{ primary_color: '#aa0000' }}
        savedRows={savedRows}
      />
    )
  }
  return render(<Harness />)
}

afterEach(() => vi.restoreAllMocks())

describe('a refused delete in the palette', () => {
  it('closes the confirm and shows the in-use message under the shared block', async () => {
    const remove = vi.fn(async () => {
      throw new SharedRowInUseError('in use', [
        { id: '1', name: 'Welcome' },
        { id: '2', name: 'Follow-up' },
      ])
    })
    mount({ list: async () => [sharedRow('Legal footer')], remove })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(
      within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
    )
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Legal footer”?' }))

    const message = 'Used in 2 templates: Welcome, Follow-up. Remove it from those templates first.'
    await waitFor(() =>
      expect(group.querySelector('.seb-saved-refusal')).toHaveTextContent(message),
    )
    // The question is gone and the delete button is back; the block is still listed.
    expect(within(group).queryByRole('button', { name: 'Keep' })).toBeNull()
    expect(within(group).queryByRole('button', { name: 'Delete “Legal footer”?' })).toBeNull()
    expect(
      within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
    ).toBeInTheDocument()
    expect(group.querySelector('.seb-saved-item')).not.toHaveAttribute('data-confirming')
  })

  it('clears the message when the author asks to delete again', async () => {
    const remove = vi.fn(async () => {
      throw new SharedRowInUseError('in use', [{ id: '1', name: 'Welcome' }])
    })
    mount({ list: async () => [sharedRow('Legal footer')], remove })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    const open = () =>
      userEvent.click(
        within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
      )
    await open()
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Legal footer”?' }))
    await waitFor(() => expect(group.querySelector('.seb-saved-refusal')).not.toBeNull())
    await open()
    expect(group.querySelector('.seb-saved-refusal')).toBeNull()
    expect(within(group).getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })

  it('does the same for a saved row whose delete fails, with the adapter’s message', async () => {
    const remove = vi.fn(async () => {
      throw new Error('The server is busy')
    })
    mount({ list: async () => [plainRow('Signature')], remove })
    const group = await screen.findByRole('region', { name: 'Saved rows' })
    await userEvent.click(within(group).getByRole('button', { name: 'Delete saved row Signature' }))
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Signature”?' }))
    await waitFor(() =>
      expect(group.querySelector('.seb-saved-refusal')).toHaveTextContent('The server is busy'),
    )
    expect(within(group).queryByRole('button', { name: 'Keep' })).toBeNull()
  })

  it('keeps the notice above the canvas too', async () => {
    const remove = vi.fn(async () => {
      throw new SharedRowInUseError('in use', [{ id: '1', name: 'Welcome' }])
    })
    mount({ list: async () => [sharedRow('Legal footer')], remove })
    const group = await screen.findByRole('region', { name: 'Shared blocks' })
    await userEvent.click(
      within(group).getByRole('button', { name: 'Delete shared block Legal footer' }),
    )
    await userEvent.click(within(group).getByRole('button', { name: 'Delete “Legal footer”?' }))
    await waitFor(() =>
      expect(document.querySelector('.seb-flash')).toHaveTextContent(
        'Used in 1 template: Welcome.',
      ),
    )
  })
})

describe('the inline confirm fits the palette', () => {
  it('keeps its classes, shows the long name in full and offers it as a title', async () => {
    mount({ list: async () => [plainRow(), sharedRow()], remove: async () => undefined })
    for (const [label, region] of [
      ['Delete saved row', 'Saved rows'],
      ['Delete shared block', 'Shared blocks'],
    ] as const) {
      const group = await screen.findByRole('region', { name: region })
      await userEvent.click(within(group).getByRole('button', { name: `${label} ${LONG}` }))
      const confirm = group.querySelector('.seb-saved-confirm')!
      expect(confirm.closest('.seb-saved-item')).toHaveAttribute('data-confirming')
      const ask = within(confirm as HTMLElement).getByRole('button', { name: `Delete “${LONG}”?` })
      expect(ask).toHaveClass('seb-action', 'seb-action-danger')
      expect(ask).toHaveAttribute('title', `Delete “${LONG}”?`)
      expect(
        within(confirm as HTMLElement).getByRole('button', { name: 'Keep' }),
      ).toBeInTheDocument()
    }
  })

  it('has styles that put it on its own line and let the long name wrap', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf8')
    const rule = (selector: string) => {
      const found = new RegExp(
        `\\n\\s*${selector.replace(/[.\s]/g, (c) => `\\${c}`)}\\s*\\{([^}]*)\\}`,
      ).exec(css)
      expect(found, `${selector} rule`).not.toBeNull()
      return found![1]!
    }
    expect(rule('.seb-saved-item')).toMatch(/flex-wrap:\s*wrap/)
    expect(rule('.seb-saved-item')).toMatch(/min-width:\s*0/)
    const confirm = rule('.seb-saved-confirm')
    expect(confirm).toMatch(/flex:\s*1 1 100%/)
    expect(confirm).toMatch(/min-width:\s*0/)
    expect(confirm).toMatch(/flex-wrap:\s*wrap/)
    const action = rule('.seb-saved-confirm .seb-action')
    expect(action).toMatch(/height:\s*auto/)
    expect(action).toMatch(/max-width:\s*100%/)
    expect(action).toMatch(/overflow-wrap:\s*anywhere/)
    expect(rule('.seb-saved-refusal')).toMatch(/overflow-wrap:\s*anywhere/)
  })
})
