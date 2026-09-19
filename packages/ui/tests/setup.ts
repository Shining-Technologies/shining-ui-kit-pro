import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
  // Tables remember pinning in browser storage by default; one test's pins
  // must not carry into the next.
  if (typeof window !== 'undefined') {
    window.localStorage?.clear()
    window.sessionStorage?.clear()
  }
})

// Absent in `// @vitest-environment node` files, which render with react-dom/server.
const dom = typeof window !== 'undefined'

// jsdom does not implement these; several Radix primitives rely on them.
if (dom && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

if (dom && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// Radix Select/DropdownMenu drive their listboxes with the Pointer Capture API,
// which jsdom does not implement. Without these, opening a select never
// resolves and the test hangs rather than failing.
if (dom && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => undefined
  Element.prototype.releasePointerCapture = () => undefined
}

if (dom && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// Floating UI (under every Radix popper) calls `autoUpdate`, which builds an
// IntersectionObserver to watch for layout shifts. jsdom has neither, and the
// resulting throw happens inside an effect, so it surfaces as a hung render
// rather than a readable error.
if (dom && !window.IntersectionObserver) {
  window.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: number[] = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
}

if (dom && !window.DOMRect) {
  window.DOMRect = class {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0,
    ) {}
    get top() {
      return this.y
    }
    get left() {
      return this.x
    }
    get right() {
      return this.x + this.width
    }
    get bottom() {
      return this.y + this.height
    }
    toJSON() {
      return { ...this }
    }
    static fromRect(rect?: DOMRectInit) {
      return new window.DOMRect(rect?.x, rect?.y, rect?.width, rect?.height)
    }
  } as unknown as typeof DOMRect
}
