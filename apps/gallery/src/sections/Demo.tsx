import { CopyButton } from '@shining-technologies/ui'
import { createContext, useContext, type ReactNode } from 'react'

/** The page a demo is on, so its anchor link can name it. */
export const SectionIdContext = createContext('')

/**
 * `'Tree view — multiple'` → `'tree-view-multiple'`: the demo's anchor. A component
 * name splits at its capitals, so `'TreeView'` finds the "Tree view" demo.
 */
export function slugify(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface DemoProps {
  title: string
  /** One line on what this example is showing, or why it looks the way it does. */
  note?: ReactNode
  /** Lay the examples out in a row that wraps, rather than a stack. */
  inline?: boolean
  /** The smallest code that reproduces the example, shown under it with a Copy button. */
  code?: string
  children: ReactNode
}

/**
 * One labelled example.
 *
 * Deliberately plain — the frame around a component must not compete with it,
 * so this is a heading, a note and a bordered box, and nothing else. The
 * heading carries an anchor (`#<page>/<demo>`), so any example can be linked
 * to directly; `code` adds a collapsed snippet that can be copied.
 */
export function Demo({ title, note, inline = true, code, children }: DemoProps) {
  const sectionId = useContext(SectionIdContext)
  const slug = slugify(title)

  return (
    <section className="demo" id={`demo-${slug}`}>
      <div className="demo__head">
        <h2>
          {title}
          {sectionId ? (
            <a className="demo__anchor" href={`#${sectionId}/${slug}`} aria-label={`Link to ${title}`}>
              #
            </a>
          ) : null}
        </h2>
        {note ? <p>{note}</p> : null}
      </div>
      <div className={inline ? 'demo__body demo__body--inline' : 'demo__body'}>{children}</div>
      {code ? (
        <details className="demo__code">
          <summary>Code</summary>
          <div className="demo__code-body">
            <CopyButton
              value={code.trim()}
              size="sm"
              variant="outline"
              className="demo__copy"
              label={`Copy the ${title} code`}
            >
              Copy
            </CopyButton>
            <pre>
              <code>{code.trim()}</code>
            </pre>
          </div>
        </details>
      ) : null}
    </section>
  )
}

/** A grid of demos, for pages with many small examples. */
export function DemoGrid({ children }: { children: ReactNode }) {
  return <div className="demo-grid">{children}</div>
}
