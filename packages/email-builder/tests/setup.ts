import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// ProseMirror measures the selection on focus; happy-dom has no layout.
if (typeof window !== 'undefined') {
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => undefined
  if (!document.elementFromPoint) document.elementFromPoint = () => null
}
