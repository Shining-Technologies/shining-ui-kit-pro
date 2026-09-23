import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/*
 * Layout primitives: flexbox and grid with the kit's spacing scale, and
 * nothing else. Markup only — they render as Server Components — and every
 * value is a class, so an application's own `className` still wins.
 */

/** The spacing scale, in steps of `--spacing`: xs 1, sm 2, md 4, lg 6, xl 8. */
export type LayoutGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const gap = {
  none: 'sui-gap--none',
  xs: 'sui-gap--xs',
  sm: 'sui-gap--sm',
  md: 'sui-gap--md',
  lg: 'sui-gap--lg',
  xl: 'sui-gap--xl',
} satisfies Record<LayoutGap, string>

type LayoutElement = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav' | 'ul' | 'ol' | 'form'

/* ------------------------------------------------------------------- stack */

export const stackVariants = cva('sui-layout-stack', {
  variants: {
    direction: { vertical: '', horizontal: 'sui-layout-stack--horizontal' },
    gap,
    align: {
      start: 'sui-align--start',
      center: 'sui-align--center',
      end: 'sui-align--end',
      stretch: 'sui-align--stretch',
      baseline: 'sui-align--baseline',
    },
    justify: {
      start: 'sui-justify--start',
      center: 'sui-justify--center',
      end: 'sui-justify--end',
      between: 'sui-justify--between',
    },
    wrap: { true: 'sui-layout-stack--wrap', false: '' },
  },
  defaultVariants: { direction: 'vertical', gap: 'md', wrap: false },
})

export interface StackProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof stackVariants> {
  /** The element to render. A `div` by default. */
  as?: LayoutElement
}

/**
 * Children in a column (or, with `direction="horizontal"`, a row), a step of
 * the spacing scale apart. A horizontal stack with `wrap` is the inline
 * cluster of buttons, badges or chips that flows onto the next line.
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  { className, as = 'div', direction, gap: space, align, justify, wrap, ...props },
  ref,
) {
  const Comp = as as ElementType
  return (
    <Comp
      ref={ref}
      data-slot="stack"
      className={cn(stackVariants({ direction, gap: space, align, justify, wrap }), className)}
      {...props}
    />
  )
})

/* -------------------------------------------------------------------- grid */

export const gridVariants = cva('sui-layout-grid', {
  variants: { gap },
  defaultVariants: { gap: 'md' },
})

export interface GridProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof gridVariants> {
  /**
   * A fixed number of equal columns, e.g. `3`. They fold to one column on a
   * narrow screen (under 40rem), so a three-up row of cards still reads on a
   * phone. Ignored when `minItemWidth` is set.
   */
  columns?: number
  /**
   * As many columns as fit with each at least this wide (`'16rem'`): the
   * grid reflows by itself at every width, with no breakpoints to choose.
   */
  minItemWidth?: string
  as?: LayoutElement
}

/** Equal columns: a row of KPI cards, a gallery of records, a settings form in two columns. */
export const Grid = forwardRef<HTMLElement, GridProps>(function Grid(
  { className, as = 'div', gap: space, columns, minItemWidth, style, ...props },
  ref,
) {
  const Comp = as as ElementType
  const vars: Record<string, string | number> = {}
  if (minItemWidth) vars['--sui-grid-min'] = minItemWidth
  else if (columns) vars['--sui-grid-columns'] = Math.max(1, Math.floor(columns))

  return (
    <Comp
      ref={ref}
      data-slot="grid"
      data-layout={minItemWidth ? 'fill' : 'columns'}
      className={cn(gridVariants({ gap: space }), className)}
      style={{ ...vars, ...style } as CSSProperties}
      {...props}
    />
  )
})

/* --------------------------------------------------------------- container */

export const containerVariants = cva('sui-layout-container', {
  variants: {
    size: {
      sm: 'sui-layout-container--sm',
      md: 'sui-layout-container--md',
      lg: 'sui-layout-container--lg',
      xl: 'sui-layout-container--xl',
      full: 'sui-layout-container--full',
    },
  },
  defaultVariants: { size: 'lg' },
})

/** Named for the layout family: `ContainerProps` is the DataTable container part's. */
export interface LayoutContainerProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof containerVariants> {
  as?: LayoutElement
}

/**
 * Centres content at a readable width with gutters on either side: `sm` 40rem
 * (a form), `md` 48rem (an article), `lg` 64rem (the default), `xl` 80rem (a
 * dashboard), `full` edge to edge with gutters only.
 */
export const Container = forwardRef<HTMLElement, LayoutContainerProps>(function Container(
  { className, as = 'div', size, ...props },
  ref,
) {
  const Comp = as as ElementType
  return (
    <Comp
      ref={ref}
      data-slot="container"
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  )
})
