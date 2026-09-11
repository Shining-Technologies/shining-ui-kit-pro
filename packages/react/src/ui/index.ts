/**
 * The component kit.
 *
 * Everything here is composed from the shared primitives and painted entirely
 * from project tokens, so a component added to this folder follows every
 * project automatically — there is no per-theme work to do.
 */
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Stat,
  cardVariants,
} from './card'
export type { CardFooterProps, CardHeaderProps, CardProps, StatProps } from './card'

export { Alert, AlertDescription, AlertTitle, alertVariants } from './alert'
export type { AlertProps } from './alert'

export {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  avatarVariants,
  initialsFrom,
} from './avatar'
export type { AvatarGroupProps, AvatarProps } from './avatar'

export { Empty, Kbd, Progress, Spinner, progressVariants, spinnerVariants } from './feedback'
export type { EmptyStateProps, ProgressProps, SpinnerProps } from './feedback'

export { Field, Fieldset, Label, useFieldControl } from './field'
export type { FieldProps, FieldsetProps } from './field'

export {
  InputGroup,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Switch,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  toggleVariants,
} from './form-controls'
export type {
  InputGroupProps,
  RadioGroupProps,
  TextareaProps,
  ToggleGroupItemProps,
  ToggleGroupProps,
  ToggleProps,
} from './form-controls'

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Pagination,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './navigation'
export type { AccordionProps, PaginationProps, TabsProps } from './navigation'

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  dialogVariants,
} from './overlays'
export type { AlertDialogProps, DialogContentProps, SheetContentProps } from './overlays'

/* --------------------------------------------------------------- composites */
/*
 * A tier above the primitives: the shapes an application is assembled from,
 * each of which every dashboard would otherwise rebuild slightly differently.
 */

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  tableVariants,
} from './table'
export type { TableCellProps, TableHeadProps, TableProps, TableRowProps } from './table'

export {
  StatusBadge,
  StatusRegistryProvider,
  statusBadgeVariants,
  useStatusRegistry,
} from './status-badge'
export type {
  StatusBadgeProps,
  StatusDefinition,
  StatusRegistry,
  StatusRegistryProviderProps,
  StatusTone,
  StatusVocabulary,
} from './status-badge'

export { StatsCard, statsCardVariants } from './stats-card'
export type { StatsCardProps, StatsTrend } from './stats-card'

export { PageHeader } from './page-header'
export type { PageHeaderProps } from './page-header'

export { ConfirmDialog } from './confirm-dialog'
export type { ConfirmAction, ConfirmDialogProps } from './confirm-dialog'

export { CopyButton, HoldButton } from './actions'
export type { CopyButtonProps, HoldButtonProps } from './actions'

export { UserAvatar, tintIndexFor, userAvatarVariants } from './user-avatar'
export type { PresenceStatus, UserAvatarProps } from './user-avatar'

export { SectionTabs } from './section-tabs'
export type { SectionTab, SectionTabsProps } from './section-tabs'

export { FileUpload, formatBytes } from './file-upload'
export type { FileUploadProps, UploadItem } from './file-upload'

export {
  DEFAULT_PASSWORD_RULES,
  PasswordStrengthIndicator,
  scorePassword,
} from './password-strength'
export type {
  PasswordRule,
  PasswordScore,
  PasswordStrengthIndicatorProps,
  PasswordStrengthResult,
} from './password-strength'

export { Combobox, MultiCombobox } from './combobox'
export type { ComboboxOption, ComboboxProps, MultiComboboxProps } from './combobox'

/* ------------------------------------------------------------- form inputs */
/*
 * The typed fields. Each one is a control an application would otherwise
 * assemble from four smaller pieces and get subtly wrong — the caret in a tags
 * field, the paste in a one-time code, the object URLs behind an image preview.
 */

export { PasswordInput } from './password-input'
export type { PasswordInputProps } from './password-input'

export { PhoneInput } from './phone-input'
export type { PhoneInputProps } from './phone-input'

export { NumberInput } from './number-input'
export type { NumberInputProps } from './number-input'

export { OtpInput } from './otp-input'
export type { OtpInputProps } from './otp-input'

export { TagsInput } from './tags-input'
export type { TagsInputProps } from './tags-input'

export { ColorInput, DEFAULT_SWATCHES, normalizeHex } from './color-input'
export type { ColorInputProps } from './color-input'

export { RatingInput } from './rating-input'
export type { RatingInputProps } from './rating-input'

export { ImageUpload } from './image-upload'
export type { ImageItem, ImageUploadProps } from './image-upload'

export { FloatingFormActions } from './floating-actions'
export type { FloatingFormActionsProps } from './floating-actions'

export { ToastProvider, Toaster, useToast } from './toast'
export type {
  Toast,
  ToastAction,
  ToastContextValue,
  ToastOptions,
  ToastProviderProps,
  ToasterProps,
  ToastTone,
} from './toast'

/* -------------------------------------------------------------- application */

export {
  AppShell,
  AppShellBottomNav,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  BottomNavItem,
  ScrollToTop,
  SidebarGroup,
  SidebarItem,
  SkipToContent,
} from './app-shell'
export type {
  AppShellHeaderProps,
  AppShellProps,
  AppShellSidebarProps,
  BottomNavItemProps,
  ScrollToTopProps,
  SidebarGroupProps,
  SidebarItemProps,
  SkipToContentProps,
} from './app-shell'
