import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react'
import { cn } from '../lib/cn'

export const avatarVariants = cva('sui-avatar', {
  variants: {
    size: {
      sm: 'sui-avatar--sm',
      default: '',
      lg: 'sui-avatar--lg',
      xl: 'sui-avatar--xl',
    },
  },
  defaultVariants: { size: 'default' },
})

export interface AvatarProps
  extends
    ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

export const Avatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  function Avatar({ className, size, ...props }, ref) {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        data-slot="avatar"
        className={cn(avatarVariants({ size }), className)}
        {...props}
      />
    )
  },
)

export const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      data-slot="avatar-image"
      className={cn('sui-avatar__image', className)}
      {...props}
    />
  )
})

export const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn('sui-avatar__fallback', className)}
      {...props}
    />
  )
})

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Show at most this many avatars, then a `+n` chip.
   * Applied by the caller — this component only lays out what it is given.
   */
  max?: number
}

/**
 * Overlapping avatars.
 *
 * Purely presentational: the group carries no role, because a row of faces is
 * decoration around a list that should already be readable some other way.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { className, max: _max, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="avatar-group"
      className={cn('sui-avatar-group', className)}
      {...props}
    />
  )
})

/** First letters of up to two words — the usual fallback when there is no image. */
export function initialsFrom(name: string, count = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}
