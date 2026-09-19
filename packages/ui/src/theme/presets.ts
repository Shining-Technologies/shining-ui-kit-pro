import type { NeutralTint, ThemeSeed } from './generate'

/**
 * The shipped named themes. `presets.css` is generated from this list at build
 * time; apply one with `data-theme` on any element:
 *
 * ```html
 * <html data-theme="ember" class="dark">
 * ```
 */
export interface ThemePreset {
  id: string
  name: string
  description: string
  seed: ThemeSeed
  neutralTint: NeutralTint
  /** Base corner radius written as `--radius`. */
  radius: string
}

export const THEME_PRESETS = [
  {
    id: 'shining',
    name: 'Shining',
    description: 'Deep pine green and warm orange on an off-white page. The Shining Services house style.',
    neutralTint: 'subtle',
    seed: {
      primary: '#01493b',
      accent: '#ff7f00',
      neutral: '#71717a',
      surface: '#fafaf7',
      success: '#15803d',
      warning: '#c2740a',
      info: '#0369a1',
    },
    radius: '0.65rem',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool greys and a classic blue. Reads as neutral, works anywhere.',
    neutralTint: 'subtle',
    seed: { primary: '#2563eb', accent: '#06b6d4', neutral: '#64748b' },
    radius: '0.5rem',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Navy-tinted greys and an electric cyan. Built to be read on a dark page.',
    neutralTint: 'tinted',
    seed: { primary: '#38bdf8', accent: '#818cf8', neutral: '#475569', surface: '#f1f5f9' },
    radius: '0.75rem',
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Saturated violet with a magenta second series. Modern SaaS.',
    neutralTint: 'subtle',
    seed: { primary: '#7c3aed', accent: '#ec4899', neutral: '#6b7280' },
    radius: '0.75rem',
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Terracotta and amber on warm paper. Softer than a standard admin palette.',
    neutralTint: 'tinted',
    seed: { primary: '#c2410c', accent: '#eab308', neutral: '#78716c', surface: '#fdfbf7' },
    radius: '0.875rem',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep green and flat chrome. Maximum rows per screen.',
    neutralTint: 'subtle',
    seed: { primary: '#047857', accent: '#84cc16', neutral: '#57534e' },
    radius: '0.375rem',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Rose and coral on a blush page, with room to breathe.',
    neutralTint: 'tinted',
    seed: { primary: '#e11d48', accent: '#fb923c', neutral: '#79716f', surface: '#fdf8f8' },
    radius: '1rem',
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Greyscale and nearly square corners. Lets the content carry the page.',
    neutralTint: 'pure',
    seed: { primary: '#18181b', accent: '#71717a', neutral: '#71717a' },
    radius: '0.125rem',
  },
  {
    id: 'darwind',
    name: 'Darwind',
    description: 'Indigo and amber, sharp corners. Crisp and technical.',
    neutralTint: 'subtle',
    seed: {
      primary: '#3730a3',
      accent: '#f59e0b',
      neutral: '#64748b',
      surface: '#f8fafc',
      info: '#0284c7',
    },
    radius: '0.25rem',
  },
  {
    id: 'unn',
    name: 'Unn',
    description: 'Teal and coral, rounded corners. Soft and approachable.',
    neutralTint: 'tinted',
    seed: { primary: '#0f766e', accent: '#f97362', neutral: '#78716c', surface: '#fbfaf7' },
    radius: '1.25rem',
  },
  {
    id: 'mint',
    name: 'Mint',
    description: 'Electric mint on pure white and true black, pill-round corners. Bright and friendly.',
    neutralTint: 'pure',
    seed: {
      primary: '#51f0a8',
      accent: '#2ebdf6',
      neutral: '#737373',
      surface: '#fdfdfd',
      destructive: '#f54a88',
    },
    radius: '1.4rem',
  },
] as const satisfies readonly ThemePreset[]

export type ThemePresetId = (typeof THEME_PRESETS)[number]['id']

export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id)
}
