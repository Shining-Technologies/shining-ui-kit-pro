import { describe, expect, it } from 'vitest'
import {
  emptyDesign,
  formatMergeTag,
  insertAtCursor,
  isRichTextDesign,
  mergeFieldsIn,
  parseMergeTag,
  toRichTextDesign,
  unknownMergeFields,
} from '../design'

describe('designs', () => {
  it('builds and recognises rich-text designs', () => {
    expect(emptyDesign('<p>x</p>')).toEqual({
      version: 1,
      mode: 'richtext',
      settings: {},
      html: '<p>x</p>',
    })
    expect(isRichTextDesign({ html: '<p>x</p>' })).toBe(true)
    expect(isRichTextDesign({ mode: 'blocks', rows: [] })).toBe(false)
    expect(isRichTextDesign({ mode: 'richtext', version: 2 })).toBe(false)
  })

  it('normalises stored designs and refuses ones it cannot edit', () => {
    expect(toRichTextDesign(null)).toEqual(emptyDesign())
    expect(toRichTextDesign({ html: '<p>a</p>' })).toEqual(emptyDesign('<p>a</p>'))
    expect(toRichTextDesign({ mode: 'blocks', version: 1, settings: {}, rows: [] })).toBeNull()
  })
})

describe('merge tags', () => {
  it('formats the server syntax', () => {
    expect(formatMergeTag('contact.first_name')).toBe('{{ contact.first_name }}')
    expect(formatMergeTag('contact.first_name', ' there ')).toBe('{{ contact.first_name|there }}')
    expect(formatMergeTag('a', 'x}}{{')).toBe('{{ a|x }}')
    expect(() => formatMergeTag('__class__')).toThrow()
    expect(() => formatMergeTag('a.__b')).toThrow()
  })

  it('parses both syntaxes', () => {
    expect(parseMergeTag('Hi {{ contact.first_name|there }}!')).toEqual({
      path: 'contact.first_name',
      fallback: 'there',
    })
    expect(parseMergeTag('{{ contact.first_name | default:"friend" }}')).toEqual({
      path: 'contact.first_name',
      fallback: 'friend',
    })
    expect(parseMergeTag('{% if %}')).toBeNull()
  })

  it('lists fields used and the unknown ones', () => {
    const used = mergeFieldsIn('{{ a.b }} {{a.b|x}}', '{{ c }} {{ brand.phone }}')
    expect(used).toEqual(['a.b', 'c', 'brand.phone'])
    expect(unknownMergeFields(used, [{ key: 'a.b', label: 'A' }])).toEqual(['c'])
  })

  it('inserts at the caret', () => {
    expect(
      insertAtCursor({ value: 'Hello !', selectionStart: 6, selectionEnd: 6 }, '{{ x }}'),
    ).toEqual({
      value: 'Hello {{ x }}!',
      caret: 13,
    })
    expect(
      insertAtCursor({ value: 'ab', selectionStart: null, selectionEnd: null }, 'c').value,
    ).toBe('abc')
  })
})
