import { CopyButton } from '@shining-technologies/ui'
import type { ReactNode } from 'react'
import { go } from '../../router'

const REPO = 'https://github.com/Shining-Technologies/shining-ui-kit-pro'
const DOCS = `${REPO}/blob/master/packages/ui/docs`

/** A code block with a copy button, as on the component pages. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const text = code.trim()
  return (
    <div className="code">
      {label ? <div className="code__label">{label}</div> : null}
      <CopyButton value={text} size="sm" variant="ghost" className="code__copy" label="Copy code" />
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  )
}

function PageLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a
      href={`#${to}`}
      onClick={(event) => {
        event.preventDefault()
        go(to)
      }}
    >
      {children}
    </a>
  )
}

function LinkCard({
  to,
  href,
  title,
  children,
}: {
  to?: string
  href?: string
  title: string
  children: ReactNode
}) {
  const body = (
    <>
      <strong>{title}</strong>
      <span>{children}</span>
    </>
  )
  if (href) {
    return (
      <a className="link-card" href={href} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }
  return (
    <a
      className="link-card"
      href={`#${to}`}
      onClick={(event) => {
        event.preventDefault()
        go(to!)
      }}
    >
      {body}
    </a>
  )
}

export function Introduction() {
  return (
    <div className="prose">
      <p className="prose__lead">
        Shining UI is a React component library for business applications: forms, data tables,
        dashboards, boards, calendars and an email builder, all painted from one set of CSS
        variables.
      </p>
      <p>
        It follows shadcn/ui’s token names, so a theme from tweakcn or your own brand colours reach
        every component. There is no provider and no runtime styling: the theme is a stylesheet,
        dark mode is a class, and a named preset is a <code>data-theme</code> attribute.
      </p>

      <h2 id="principles">Principles</h2>
      <ul>
        <li>
          <strong>Server Components work.</strong> Pure components such as <code>Button</code>,{' '}
          <code>Badge</code>, <code>Card</code> and <code>Table</code> render on the server with no
          client JavaScript. Interactive ones mark their own <code>'use client'</code> boundary.
        </li>
        <li>
          <strong>The theme is CSS.</strong> Semantic tokens with shadcn names, light and dark. Swap
          a few seed colours and the whole interface follows. Try the theme picker in the top bar.
        </li>
        <li>
          <strong>The data table’s logic is framework-independent.</strong> Filtering, sorting,
          pagination and URL state live in <code>/core</code> and give the same result in the
          browser and on a server.
        </li>
        <li>
          <strong>Accessible by default.</strong> Keyboard support, focus management and
          screen-reader labels are part of each component, not an add-on.
        </li>
      </ul>

      <h2 id="packages">Packages</h2>
      <div className="link-grid">
        <LinkCard to="actions" title="@shining-technologies/ui">
          Components, the data table, charts and theming. Everything on the Components pages.
        </LinkCard>
        <LinkCard to="email-builder" title="@shining-technologies/email-builder">
          A drag-and-drop email editor, a rich-text editor and the rendered preview, for
          shining-email.
        </LinkCard>
      </div>

      <h2 id="next">Where next</h2>
      <div className="link-grid">
        <LinkCard to="installation" title="Installation">
          Add the package, load the stylesheet and render your first page.
        </LinkCard>
        <LinkCard to="themes" title="Theming">
          Compare every preset in light and dark, and see how a theme is built.
        </LinkCard>
        <LinkCard to="overview" title="Examples">
          A dashboard and full pages built only from the package.
        </LinkCard>
        <LinkCard href={`${DOCS}/README.md`} title="Reference docs">
          Every component’s props, on GitHub.
        </LinkCard>
      </div>
    </div>
  )
}

export function Installation() {
  return (
    <div className="prose">
      <p className="prose__lead">
        Install the package, import its stylesheet once, and use the components. React 18.3 or 19;
        ESM only.
      </p>

      <ol className="steps">
        <li>
          <h2 id="install">Install the package</h2>
          <CodeBlock label="Terminal" code="npm install @shining-technologies/ui" />
          <p>
            Optional peers: <code>recharts</code> for <code>@shining-technologies/ui/charts</code>{' '}
            and <code>@tanstack/react-virtual</code> for{' '}
            <code>@shining-technologies/ui/virtualized</code>.
          </p>
        </li>
        <li>
          <h2 id="styles">Import the stylesheet</h2>
          <p>Once, at the root of your app. It holds the components and the default theme.</p>
          <CodeBlock label="app/layout.tsx" code="import '@shining-technologies/ui/styles.css'" />
        </li>
        <li>
          <h2 id="dark-mode">Set up dark mode</h2>
          <p>
            <code>ColorModeScript</code> applies the saved mode before the first paint, so there is
            no flash.
          </p>
          <CodeBlock
            label="app/layout.tsx"
            code={`
import '@shining-technologies/ui/styles.css'
import { ColorModeScript } from '@shining-technologies/ui'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeScript defaultMode="system" />
      </head>
      <body className="sui-scope">{children}</body>
    </html>
  )
}`}
          />
        </li>
        <li>
          <h2 id="use">Use the components</h2>
          <CodeBlock
            label="app/page.tsx"
            code={`
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@shining-technologies/ui'

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge tone="success">Live</Badge> <Button>New order</Button>
      </CardContent>
    </Card>
  )
}`}
          />
        </li>
        <li>
          <h2 id="theme">Pick a theme</h2>
          <p>
            Load the presets and set <code>data-theme</code> on any element, or generate a theme
            from your own colours. See <PageLink to="themes">Themes</PageLink>.
          </p>
          <CodeBlock
            label="Presets"
            code={`
import '@shining-technologies/ui/presets.css'

<html data-theme="ember" className="dark">`}
          />
        </li>
      </ol>

      <h2 id="typescript">TypeScript</h2>
      <p>
        Set <code>moduleResolution</code> to <code>"bundler"</code>, <code>"node16"</code> or{' '}
        <code>"nodenext"</code>. Every entry point ships its declarations.
      </p>

      <h2 id="guides">Guides</h2>
      <div className="link-grid">
        <LinkCard href={`${DOCS}/getting-started.md`} title="Getting started">
          The first page and the first data table, step by step.
        </LinkCard>
        <LinkCard href={`${DOCS}/nextjs.md`} title="Next.js">
          Server Components, URL-driven tables and per-tenant themes.
        </LinkCard>
        <LinkCard href={`${DOCS}/theming.md`} title="Theming">
          Tokens, brand colours, Tailwind and tweakcn themes.
        </LinkCard>
        <LinkCard href={`${DOCS}/data-table.md`} title="Data table">
          Columns, filters, server mode, selection and export.
        </LinkCard>
      </div>
    </div>
  )
}
