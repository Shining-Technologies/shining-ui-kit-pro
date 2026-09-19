import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * The keyboard shortcut at the end of a menu item: `⌘S`, `Ctrl+Shift+P`.
 *
 * Text only. It does not bind the key; the application does that. It works in
 * any menu in the package: `DropdownMenu`, `ContextMenu`, `Menubar` and the
 * command menu all use the same item row.
 */
export const MenuShortcut = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function MenuShortcut({ className, ...props }, ref) {
    return <span ref={ref} className={cn('sui-menu__shortcut', className)} {...props} />
  },
)
