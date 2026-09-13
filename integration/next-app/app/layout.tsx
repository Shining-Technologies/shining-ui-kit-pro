import '@shining-technologies/ui/styles.css'
import '@shining-technologies/ui/presets.css'
import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ColorModeScript } from '@shining-technologies/ui'

export const metadata = { title: 'Shining UI V2 — Next.js integration' }

const LINKS = [
  ['/', 'Home'],
  ['/users', 'Users'],
  ['/client-table', 'Client table'],
  ['/shell', 'Shell'],
  ['/theme', 'Theme'],
  ['/charts', 'Charts'],
] as const

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeScript defaultMode="light" />
      </head>
      <body className="sui-scope">
        <nav className="app-nav" aria-label="Pages">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </body>
    </html>
  )
}
