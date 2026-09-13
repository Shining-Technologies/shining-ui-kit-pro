import { cva } from 'class-variance-authority'

/*
 * The class recipe for `Progress`, apart from the component: `progress.tsx` is a
 * client module (Radix), and a Server Component that imported this from there
 * would get a client reference it cannot call.
 */
export const progressVariants = cva('sui-progress', {
  variants: {
    size: { sm: 'sui-progress--sm', default: '', lg: 'sui-progress--lg' },
    tone: {
      primary: '',
      success: 'sui-progress--success',
      warning: 'sui-progress--warning',
      destructive: 'sui-progress--destructive',
    },
  },
  defaultVariants: { size: 'default', tone: 'primary' },
})
