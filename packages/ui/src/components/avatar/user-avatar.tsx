'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Avatar, AvatarFallback, AvatarImage, initialsFrom } from './avatar'

/**
 * The tint pool.
 *
 * Chart tokens rather than fixed colours: they are the one part of a project
 * that is *designed* to be a set of distinguishable hues, which is exactly what
 * a per-person tint needs — and it means avatars repaint with the project.
 */
const TINTS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

/**
 * A stable index for a name.
 *
 * Deliberately not random: the same person must get the same colour on every
 * page and after every reload, or the tint stops being a recognition aid and
 * becomes noise.
 */
export function tintIndexFor(seed: string, buckets: number = TINTS.length): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % buckets
}

export const userAvatarVariants = cva('sui-user-avatar', {
  variants: {
    size: {
      xs: 'sui-user-avatar--xs',
      sm: 'sui-user-avatar--sm',
      default: '',
      lg: 'sui-user-avatar--lg',
      xl: 'sui-user-avatar--xl',
    },
  },
  defaultVariants: { size: 'default' },
})

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

export interface UserAvatarProps
  extends
    Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof userAvatarVariants> {
  name: string
  src?: string
  /** Overrides `name` for the colour, e.g. a stable user id. */
  seed?: string
  /** A presence dot on the corner. Omit for no dot. */
  status?: PresenceStatus
  /** Fall back to a flat neutral instead of a per-person tint. */
  muted?: boolean
}

/**
 * A person.
 *
 * `Avatar` is the box; this is the person in it — initials when there is no
 * photo, a colour derived from who they are, and an accessible name, which is
 * the part every hand-rolled version forgets.
 */
export const UserAvatar = forwardRef<HTMLSpanElement, UserAvatarProps>(function UserAvatar(
  { className, name, src, seed, status, muted = false, size, ...props },
  ref,
) {
  const tint = muted ? undefined : TINTS[tintIndexFor(seed ?? name)]

  return (
    <span
      ref={ref}
      data-slot="user-avatar"
      data-status={status}
      className={cn(userAvatarVariants({ size }), className)}
      {...props}
    >
      {/* The visible parts are hidden from assistive tech: the name is spoken
          once, from the text below, rather than as "image, Ana Ortiz" or as
          the initials "A O" followed by the name again. */}
      <Avatar
        className="sui-user-avatar__avatar"
        aria-hidden="true"
        style={tint ? { ['--sui-user-avatar-tint' as string]: tint } : undefined}
      >
        {src ? <AvatarImage src={src} alt="" /> : null}
        <AvatarFallback className="sui-user-avatar__fallback" delayMs={src ? 200 : 0}>
          {initialsFrom(name)}
        </AvatarFallback>
      </Avatar>
      {status ? (
        <span
          aria-hidden="true"
          className={cn('sui-user-avatar__presence', `sui-user-avatar__presence--${status}`)}
        />
      ) : null}
      <span className="sui-visually-hidden">
        {name}
        {status ? `, ${status}` : ''}
      </span>
    </span>
  )
})
