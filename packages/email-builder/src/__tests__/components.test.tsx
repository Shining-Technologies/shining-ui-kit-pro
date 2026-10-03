import type { Editor } from '@tiptap/core'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { emptyDesign, type RichTextDesign } from '../design'
import { EmailEditor } from '../email-editor'
import { EmailPreview } from '../email-preview'
import { MergeFieldPicker } from '../merge-field-picker'

const fields = [
  { key: 'contact.first_name', label: 'First name', group: 'Contact' },
  { key: 'deal.title', label: 'Deal title', group: 'Deal' },
]

async function mountEditor(initial: unknown = emptyDesign('<p>Hello</p>'), props = {}) {
  const changes: RichTextDesign[] = []
  let editor: Editor | null = null
  function Harness() {
    const [value, setValue] = useState(initial)
    return (
      <>
        <EmailEditor
          value={value}
          onChange={(next) => {
            changes.push(next)
            setValue(next)
          }}
          mergeFields={fields}
          onReady={(e) => {
            editor = e
          }}
          {...props}
        />
        <button type="button" onClick={() => setValue(emptyDesign('<p>Loaded</p>'))}>
          load
        </button>
      </>
    )
  }
  render(<Harness />)
  await waitFor(() => expect(editor).not.toBeNull())
  return { changes, editor: () => editor as unknown as Editor }
}

describe('EmailEditor', () => {
  it('renders the design and a toolbar', async () => {
    await mountEditor()
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email body' })).toHaveTextContent('Hello')
  })

  it('emits a full design on change', async () => {
    const { changes, editor } = await mountEditor()
    act(() => {
      editor().chain().focus('end').insertContent(' world').run()
    })
    const last = changes.at(-1)!
    expect(last).toMatchObject({ version: 1, mode: 'richtext', settings: {} })
    expect(last.html).toBe('<p>Hello world</p>')
  })

  it('emits an empty string for an empty document', async () => {
    const { changes, editor } = await mountEditor()
    act(() => {
      editor().commands.clearContent(true)
    })
    expect(changes.at(-1)!.html).toBe('')
  })

  it('follows a value loaded from outside', async () => {
    const { editor } = await mountEditor()
    await userEvent.click(screen.getByRole('button', { name: 'load' }))
    await waitFor(() => expect(editor().getHTML()).toBe('<p>Loaded</p>'))
  })

  it('applies toolbar formatting', async () => {
    const { changes, editor } = await mountEditor()
    act(() => {
      editor().commands.selectAll()
    })
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(changes.at(-1)!.html).toBe('<p><strong>Hello</strong></p>')
  })

  it('inserts a merge field from the picker as a labelled chip', async () => {
    const { changes } = await mountEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Insert field' }))
    await userEvent.type(screen.getByLabelText('If empty, show'), 'there')
    await userEvent.click(screen.getByRole('option', { name: /First name/ }))
    expect(changes.at(-1)!.html).toContain('{{ contact.first_name|there }}')
    expect(document.querySelector('.seb-merge-chip')).toHaveTextContent('First name')
  })

  it('adds a button through its panel, validating the address', async () => {
    const { changes } = await mountEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Button' }))
    await userEvent.type(screen.getByLabelText('Label'), 'Book now')
    await userEvent.type(screen.getByLabelText('Link address'), 'javascript:alert(1)')
    await userEvent.click(screen.getByRole('button', { name: 'Add button' }))
    expect(screen.getByText(/Use an address starting with/)).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Link address'))
    await userEvent.type(screen.getByLabelText('Link address'), 'https://book.test/')
    await userEvent.click(screen.getByRole('button', { name: 'Add button' }))
    expect(changes.at(-1)!.html).toContain('<a data-type="button" data-align="center" href="https://book.test/">Book now</a>')
  })

  it('uploads an image through the caller', async () => {
    const onUploadImage = vi.fn().mockResolvedValue({ url: 'https://cdn.test/pic.png', alt: 'A pic' })
    const { changes } = await mountEditor(undefined, { onUploadImage })
    await userEvent.click(screen.getByRole('button', { name: 'Image' }))
    const file = new File(['x'], 'pic.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText('Upload an image'), file)
    await waitFor(() => expect(screen.getByLabelText('Image address')).toHaveValue('https://cdn.test/pic.png'))
    await userEvent.click(screen.getByRole('button', { name: 'Insert image' }))
    expect(onUploadImage).toHaveBeenCalledWith(file)
    expect(changes.at(-1)!.html).toContain('<img src="https://cdn.test/pic.png" alt="A pic">')
  })

  it('survives merge fields arriving after mount and relabels the chips', async () => {
    let editor: Editor | null = null
    const design = emptyDesign('<p>Hi {{ contact.first_name|there }}</p>')
    const props = { value: design, onChange: () => undefined, onReady: (e: Editor) => (editor = e) }
    const { rerender } = render(<EmailEditor {...props} mergeFields={[]} />)
    await waitFor(() => expect(editor).not.toBeNull())
    // A tag written as text loads as a chip, labelled by its path until the list arrives.
    expect(document.querySelector('.seb-merge-chip')).toHaveTextContent('contact.first_name')
    const first = editor
    rerender(<EmailEditor {...props} mergeFields={fields} />)
    rerender(<EmailEditor {...props} value={emptyDesign('<p>Hello {{ contact.first_name }}</p>')} mergeFields={fields} />)
    await waitFor(() => expect(document.querySelector('.seb-merge-chip')).toHaveTextContent('First name'))
    expect(editor).toBe(first)
    expect((editor as unknown as Editor).isDestroyed).toBe(false)
  })

  it('shows a notice instead of editing a block design', async () => {
    render(<EmailEditor value={{ version: 1, mode: 'blocks', settings: {}, rows: [] }} onChange={() => undefined} />)
    expect(screen.getByRole('status')).toHaveTextContent('designed with blocks')
    expect(screen.queryByRole('toolbar')).toBeNull()
  })

  it('hides the toolbar when disabled', async () => {
    let ready = false
    render(<EmailEditor value={emptyDesign('<p>x</p>')} onChange={() => undefined} disabled onReady={() => (ready = true)} />)
    await waitFor(() => expect(ready).toBe(true))
    expect(screen.queryByRole('toolbar')).toBeNull()
  })
})

describe('MergeFieldPicker', () => {
  it('filters, groups and picks with the keyboard', async () => {
    const onSelect = vi.fn()
    render(<MergeFieldPicker fields={fields} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Insert field' }))
    expect(screen.getByRole('group', { name: 'Contact' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search fields'), 'deal')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(fields[1], '')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on Escape', async () => {
    render(<MergeFieldPicker fields={fields} onSelect={() => undefined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Insert field' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('EmailPreview', () => {
  it('renders the server html in a sandboxed frame with warnings and a text view', async () => {
    render(
      <EmailPreview
        html="<p>Hi</p><script>parent.x=1</script>"
        text="Hi"
        subject="Hello"
        preheader="Pre"
        warnings={['An image has no alt text.']}
      />,
    )
    const frame = screen.getByTitle('Preview: Hello')
    expect(frame).toHaveAttribute('sandbox', '')
    expect(screen.getByText('An image has no alt text.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Mobile' }))
    expect(document.querySelector('[data-device="mobile"]')).not.toBeNull()
    await userEvent.click(screen.getByRole('tab', { name: 'Plain text' }))
    expect(screen.getByText('Hi', { selector: 'pre' })).toBeInTheDocument()
  })
})
