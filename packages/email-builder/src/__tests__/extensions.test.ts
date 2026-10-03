import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'
import { emailExtensions } from '../extensions'

const fields = [{ key: 'contact.first_name', label: 'First name', group: 'Contact' }]
let editor: Editor | null = null

function make(content: string) {
  editor = new Editor({ extensions: emailExtensions({ mergeFields: fields }), content })
  return editor
}

afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('the document round-trips through the server shape', () => {
  it('keeps merge fields as span + tag text', () => {
    const html = '<p>Hi <span data-merge-field="contact.first_name">{{ contact.first_name|there }}</span>,</p>'
    expect(make(html).getHTML()).toBe(html)
  })

  it('reads a merge field written with the nexus syntax', () => {
    const e = make('<p><span data-merge-field="contact.first_name">{{ contact.first_name | default:"friend" }}</span></p>')
    expect(e.getHTML()).toContain('{{ contact.first_name|friend }}')
  })

  it('drops a merge-field span with an unsafe path', () => {
    expect(make('<p><span data-merge-field="__class__">x</span></p>').getHTML()).not.toContain('data-merge-field')
  })

  it('keeps the button node', () => {
    const html = '<a data-type="button" data-align="right" href="https://book.test/">Book now</a>'
    expect(make(html).getHTML()).toBe(html)
  })

  it('keeps the formatting the server allows', () => {
    const html =
      '<h2 style="text-align: center;">Title</h2><p><strong>b</strong> <em>i</em> <u>u</u> <s>s</s> ' +
      '<span style="color: rgb(255, 0, 0);">red</span> <a href="https://x.test/">link</a></p>' +
      '<ul><li><p>one</p></li></ul><blockquote><p>q</p></blockquote><hr><img src="https://cdn.test/a.png" alt="A">'
    const out = make(html).getHTML()
    for (const part of ['<h2 style="text-align: center;">', '<strong>', '<em>', '<u>', '<s>', 'color: rgb(255, 0, 0)', 'href="https://x.test/"', '<ul>', '<blockquote>', '<hr>', 'alt="A"']) {
      expect(out).toContain(part)
    }
    expect(out).not.toContain('target=')
    expect(out).not.toContain('rel=')
  })

  it('refuses javascript: links and keeps merge-field links', () => {
    const out = make('<p><a href="javascript:alert(1)">bad</a> <a href="{{ unsubscribe_url }}">u</a></p>').getHTML()
    expect(out).not.toContain('javascript:')
    expect(out).toContain('href="{{ unsubscribe_url }}"')
  })
})

describe('commands', () => {
  it('inserts a merge field', () => {
    const e = make('<p>Hi </p>')
    e.commands.focus('end')
    expect(e.commands.insertMergeField('contact.first_name', 'there')).toBe(true)
    expect(e.getHTML()).toContain('<span data-merge-field="contact.first_name">{{ contact.first_name|there }}</span>')
    expect(e.commands.insertMergeField('bad path')).toBe(false)
  })

  it('inserts and then updates a button', () => {
    const e = make('<p>x</p>')
    e.commands.focus('end')
    e.commands.setEmailButton({ label: 'Go', href: 'https://a.test/', align: 'left' })
    expect(e.getHTML()).toContain('<a data-type="button" data-align="left" href="https://a.test/">Go</a>')
    let position = -1
    e.state.doc.descendants((node, pos) => {
      if (node.type.name === 'emailButton') position = pos
    })
    e.commands.setNodeSelection(position)
    e.commands.setEmailButton({ label: 'Go now' })
    const out = e.getHTML()
    expect(out).toContain('>Go now</a>')
    expect(out.match(/data-type="button"/g)).toHaveLength(1)
  })

  it('writes plain text with tags and button URLs', () => {
    const e = make('<p>Hi <span data-merge-field="contact.first_name">{{ contact.first_name }}</span></p><a data-type="button" href="https://a.test/">Go</a>')
    const text = e.getText()
    expect(text).toContain('Hi {{ contact.first_name }}')
    expect(text).toContain('Go: https://a.test/')
  })
})
