import type { ReactNode } from 'react'

export interface DemoProps {
  title: string
  /** One line on what this example is showing, or why it looks the way it does. */
  note?: ReactNode
  /** Lay the examples out in a row that wraps, rather than a stack. */
  inline?: boolean
  children: ReactNode
}

/**
 * One labelled example.
 *
 * Deliberately plain — the frame around a component must not compete with it,
 * so this is a heading, a note and a bordered box, and nothing else.
 */
export function Demo({ title, note, inline = true, children }: DemoProps) {
  return (
    <section className="demo">
      <div className="demo__head">
        <h3>{title}</h3>
        {note ? <p>{note}</p> : null}
      </div>
      <div className={inline ? 'demo__body demo__body--inline' : 'demo__body'}>{children}</div>
    </section>
  )
}

/** A grid of demos, for pages with many small examples. */
export function DemoGrid({ children }: { children: ReactNode }) {
  return <div className="demo-grid">{children}</div>
}
