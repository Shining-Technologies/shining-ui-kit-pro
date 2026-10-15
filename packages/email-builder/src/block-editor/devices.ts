export type Device = 'desktop' | 'mobile'

export const MOBILE_WIDTH = 360
export const DESKTOP_WIDTH = 600

/**
 * The canvas draws the email at the device's real width, never squeezed into
 * whatever room the panes leave and never scaled with a transform: drag and
 * drop and clicks stay accurate. Desktop is the design's own width (600 by
 * default); mobile is 360. The pane scrolls sideways when it is narrower.
 */
export function deviceWidth(device: Device, designWidth: number = DESKTOP_WIDTH): number {
  if (device === 'mobile') return MOBILE_WIDTH
  return Math.min(700, Math.max(480, Math.round(designWidth) || DESKTOP_WIDTH))
}

/** A row or column hidden on ``device`` (its ``hide_on``). */
export function isHiddenOn(hideOn: 'mobile' | 'desktop' | null | undefined, device: Device) {
  return hideOn === device
}

export const DEVICES: { value: Device; label: string }[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
]
