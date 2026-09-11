/**
 * Theming: the provider that paints a project onto the tree, and the controls
 * an application needs to let people switch, create and edit projects.
 */
export { UIKitProvider } from './provider'
export type { UIKitProviderProps } from './provider'
export { UIKitContext, useColorMode, usePortalContainer, useProject, useUIKit } from './context'
export type { ColorModePreference, UIKitContextValue } from './context'
export {
  ColorModeToggle,
  PalettePreview,
  ProjectSwitcher,
  TokenSwatchGrid,
} from './project-switcher'
export type {
  ColorModeToggleProps,
  PalettePreviewProps,
  ProjectSwitcherProps,
  TokenSwatchGridProps,
} from './project-switcher'
export { ProjectEditor } from './project-editor'
export type { ProjectEditorProps } from './project-editor'
