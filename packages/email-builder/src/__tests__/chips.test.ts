import { describe, expect, it } from 'vitest'
import { chipMergeTags } from '../chips'

describe('chipMergeTags', () => {
  it('turns text tags into merge-field spans, fallback and all', () => {
    expect(
      chipMergeTags('<p>Hi {{ contact.first_name|there }}, from {{organization.name}}</p>'),
    ).toBe(
      '<p>Hi <span data-merge-field="contact.first_name">{{ contact.first_name|there }}</span>, from ' +
        '<span data-merge-field="organization.name">{{ organization.name }}</span></p>',
    )
  })

  it("reads nexus's default: syntax", () => {
    expect(chipMergeTags('<p>{{ contact.first_name | default:"friend" }}</p>')).toBe(
      '<p><span data-merge-field="contact.first_name">{{ contact.first_name|friend }}</span></p>',
    )
  })

  it('leaves attributes, existing chips and non-tags alone', () => {
    const html =
      '<p><a href="{{ unsubscribe_url }}">x</a> <span data-merge-field="a.b">{{ a.b }}</span> {{ 1bad }} {{}}</p>'
    expect(chipMergeTags(html)).toBe(html)
    expect(chipMergeTags('<p>plain</p>')).toBe('<p>plain</p>')
  })
})
