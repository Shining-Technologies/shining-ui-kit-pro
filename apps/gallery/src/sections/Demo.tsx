import { CopyButton } from '@shining-technologies/ui'
import { createContext, useContext, useId, useState, type ReactNode } from 'react'

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
 * One labelled example, framed the way component docs usually are: a heading
 * with an anchor (`#<page>/<demo>`), a line of explanation, then the example in
 * a bordered preview. When there is `code`, Preview and Code tabs switch the
 * frame between the live example and a snippet that can be copied.
 */
export function Demo({ title, note, inline = true, code, children }: DemoProps) {
  const sectionId = useContext(SectionIdContext)
  const slug = slugify(title)
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const tabsId = useId()
  const snippet = code?.trim()

  return (
    <section className="demo" id={`demo-${slug}`} data-demo-title={title}>
      <div className="demo__head">
        <h2>
          {sectionId ? (
            <a className="demo__anchor" href={`#${sectionId}/${slug}`}>
              {title}
            </a>
          ) : (
            title
          )}
        </h2>
        {note ? <p>{note}</p> : null}
      </div>

      {snippet ? (
        <div className="demo__tabs" role="tablist" aria-label={`${title} views`}>
          {(['preview', 'code'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`${tabsId}-${tab}-tab`}
              aria-controls={`${tabsId}-${tab}`}
              aria-selected={view === tab}
              tabIndex={view === tab ? 0 : -1}
              className="demo__tab"
              onClick={() => setView(tab)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                const next = view === 'preview' ? 'code' : 'preview'
                setView(next)
                document.getElementById(`${tabsId}-${next}-tab`)?.focus()
              }}
            >
              {tab === 'preview' ? 'Preview' : 'Code'}
            </button>
          ))}
        </div>
      ) : null}

      <div
        id={`${tabsId}-preview`}
        role={snippet ? 'tabpanel' : undefined}
        aria-labelledby={snippet ? `${tabsId}-preview-tab` : undefined}
        hidden={view !== 'preview'}
        className="demo__frame"
      >
        <div className={inline ? 'demo__body demo__body--inline' : 'demo__body'}>{children}</div>
      </div>

      {snippet ? (
        <div
          id={`${tabsId}-code`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-code-tab`}
          hidden={view !== 'code'}
          className="demo__code"
        >
          <CopyButton
            value={snippet}
            size="sm"
            variant="ghost"
            className="demo__copy"
            label={`Copy the ${title} code`}
          />
          <pre>
            <code>{snippet}</code>
          </pre>
        </div>
      ) : null}
    </section>
  )
}

/** A grid of demos, for pages with many small examples. */
export function DemoGrid({ children }: { children: ReactNode }) {
  return <div className="demo-grid">{children}</div>
}
