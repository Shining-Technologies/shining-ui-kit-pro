'use client'

import { useState } from 'react'

export type PreviewDevice = 'desktop' | 'mobile' | 'text'

export interface EmailPreviewProps {
  /** ``html`` from a preview endpoint — the server's render, never the editor's. */
  html: string
  /** ``text``, for the plain-text tab. */
  text?: string
  subject?: string
  preheader?: string
  /** ``warnings`` from the preview endpoint. */
  warnings?: string[]
  device?: PreviewDevice
  onDeviceChange?: (device: PreviewDevice) => void
  /** Frame height in pixels. */
  height?: number
  className?: string
}

const DEVICES: { value: PreviewDevice; label: string }[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'text', label: 'Plain text' },
]

/**
 * The rendered email in a sandboxed frame (no scripts, no same-origin
 * access), with desktop, mobile and plain-text views and the renderer's
 * warnings. Controlled or uncontrolled on ``device``.
 */
export function EmailPreview({
  html,
  text = '',
  subject,
  preheader,
  warnings = [],
  device,
  onDeviceChange,
  height = 640,
  className,
}: EmailPreviewProps) {
  const [ownDevice, setOwnDevice] = useState<PreviewDevice>('desktop')
  const current = device ?? ownDevice
  const choose = (next: PreviewDevice) => {
    if (device === undefined) setOwnDevice(next)
    onDeviceChange?.(next)
  }

  return (
    <section className={['seb-preview', className].filter(Boolean).join(' ')} aria-label="Email preview">
      <header className="seb-preview-head">
        {(subject || preheader) && (
          <div className="seb-preview-inbox">
            {subject && <strong>{subject}</strong>}
            {preheader && <span>{preheader}</span>}
          </div>
        )}
        <div className="seb-segmented" role="tablist" aria-label="Preview as">
          {DEVICES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={current === option.value}
              className="seb-segment"
              onClick={() => choose(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>
      {warnings.length > 0 && (
        <ul className="seb-warnings" aria-label="Warnings">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {current === 'text' ? (
        <pre className="seb-preview-text" style={{ height }}>
          {text}
        </pre>
      ) : (
        <div className="seb-preview-stage" data-device={current}>
          <iframe
            title={subject ? `Preview: ${subject}` : 'Email preview'}
            className="seb-preview-frame"
            sandbox=""
            srcDoc={html}
            style={{ height }}
          />
        </div>
      )}
    </section>
  )
}
