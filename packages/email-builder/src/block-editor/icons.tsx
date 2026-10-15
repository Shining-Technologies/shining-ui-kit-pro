import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'heading'
  | 'text'
  | 'image'
  | 'avatar'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'social'
  | 'video'
  | 'footer'
  | 'html'
  | 'table'
  | 'unlink'
  | 'edit'
  | 'grip'
  | 'up'
  | 'down'
  | 'copy'
  | 'trash'
  | 'undo'
  | 'redo'
  | 'layout'
  | 'paint'
  | 'eye'
  | 'save'
  | 'plus'
  | 'close'
  | 'panel-left'
  | 'panel-right'
  | 'upload'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'link'
  | 'list'
  | 'list-ordered'
  | 'quote'
  | 'palette'
  | 'play'
  | 'align-left'
  | 'align-center'
  | 'align-right'

const PATHS: Record<IconName, ReactNode> = {
  heading: <path d="M6 4v16M18 4v16M6 12h12" />,
  text: <path d="M4 7h16M4 12h16M4 17h10" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-8 8" />
    </>
  ),
  avatar: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  button: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M9 12h6" />
    </>
  ),
  divider: <path d="M3 12h18" />,
  spacer: <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" />,
  social: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  footer: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 15h18M7 18h4" />
    </>
  ),
  html: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 10v10" />
    </>
  ),
  unlink: (
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M8 8 4 4M20 20l-4-4M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  ),
  edit: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM14 6l4 4" />,
  grip: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  undo: <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />,
  redo: <path d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" />,
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
    </>
  ),
  paint: <path d="M5 4h10l4 4v4H5zM5 12v2a2 2 0 0 0 2 2h4v4" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  save: <path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  'panel-left': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  'panel-right': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </>
  ),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  bold: <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />,
  italic: <path d="M10 5h8M6 19h8M14 5l-4 14" />,
  underline: <path d="M7 5v7a5 5 0 0 0 10 0V5M5 20h14" />,
  strike: <path d="M5 12h14M16 7a4 3 0 0 0-8 1c0 3 8 2 8 6a4 3 0 0 1-8 1" />,
  link: (
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </>
  ),
  'list-ordered': <path d="M10 6h10M10 12h10M10 18h10M4 5l1-1v4M4 14h2l-2 3h2" />,
  quote: <path d="M5 17v-5h4v5l-2 3M14 17v-5h4v5l-2 3M5 12V9h4M14 12V9h4" />,
  palette: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16" cy="11" r="1" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7z" />,
  'align-left': <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />,
  'align-center': <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />,
  'align-right': <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />,
}

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
