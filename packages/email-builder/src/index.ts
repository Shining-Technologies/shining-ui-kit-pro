export { EmailEditor, type EmailEditorProps } from './email-editor'
export { EmailPreview, type EmailPreviewProps, type PreviewDevice } from './email-preview'
export { MergeFieldPicker, type MergeFieldPickerProps } from './merge-field-picker'
export type { UploadedImage } from './toolbar'
export { chipMergeTags } from './chips'
export {
  EmailButton,
  MergeField,
  emailExtensions,
  type ButtonAlign,
  type EmailButtonAttrs,
  type EmailExtensionOptions,
  type MergeFieldOptions,
} from './extensions'
export {
  DESIGN_VERSION,
  emptyDesign,
  formatMergeTag,
  insertAtCursor,
  isMergePath,
  isRichTextDesign,
  mergeFieldsIn,
  parseMergeTag,
  toRichTextDesign,
  unknownMergeFields,
  type BlockDesign,
  type EmailDesign,
  type MergeFieldDefinition,
  type ParsedMergeTag,
  type RichTextDesign,
} from './design'
