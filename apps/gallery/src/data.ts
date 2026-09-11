/**
 * Gallery sample data.
 *
 * Fixed rather than random: a gallery that reshuffles its numbers on every
 * reload makes it impossible to tell a rendering change from a data change.
 */

export interface MonthPoint {
  month: string
  bookings: number
  completed: number
  cancelled: number
  [key: string]: string | number
}

export const CHART_MONTHS: MonthPoint[] = [
  { month: 'Jan', bookings: 420, completed: 388, cancelled: 32 },
  { month: 'Feb', bookings: 468, completed: 431, cancelled: 37 },
  { month: 'Mar', bookings: 512, completed: 480, cancelled: 32 },
  { month: 'Apr', bookings: 498, completed: 452, cancelled: 46 },
  { month: 'May', bookings: 586, completed: 548, cancelled: 38 },
  { month: 'Jun', bookings: 631, completed: 602, cancelled: 29 },
  { month: 'Jul', bookings: 688, completed: 640, cancelled: 48 },
  { month: 'Aug', bookings: 712, completed: 679, cancelled: 33 },
  { month: 'Sep', bookings: 664, completed: 618, cancelled: 46 },
  { month: 'Oct', bookings: 745, completed: 704, cancelled: 41 },
  { month: 'Nov', bookings: 802, completed: 762, cancelled: 40 },
  { month: 'Dec', bookings: 868, completed: 819, cancelled: 49 },
]

export const CHANNEL_SPLIT = [
  { key: 'organic', label: 'Organic search', value: 1840 },
  { key: 'referral', label: 'Referral', value: 1210 },
  { key: 'paid', label: 'Paid', value: 902 },
  { key: 'direct', label: 'Direct', value: 604 },
  { key: 'social', label: 'Social', value: 256 },
]

export const PEOPLE = [
  { name: 'Priya Raman', role: 'Operations lead', load: 92 },
  { name: 'Tom Whitfield', role: 'Dispatcher', load: 74 },
  { name: 'Ana Ortiz', role: 'Field supervisor', load: 61 },
  { name: 'Kofi Mensah', role: 'Scheduler', load: 48 },
  { name: 'Lena Brandt', role: 'Support', load: 35 },
]

export const SPARK_SERIES = [12, 18, 15, 24, 22, 31, 28, 36, 33, 44, 41, 52]

/**
 * A status vocabulary, of the kind an application supplies to `StatusBadge`.
 *
 * Living here rather than in the library is the point: "awaiting parts" is a
 * word this business uses, and a component library that shipped it would be
 * guessing at somebody else's domain.
 */
export const STATUS_REGISTRY = {
  job: {
    draft: { label: 'Draft', tone: 'neutral' as const },
    scheduled: { label: 'Scheduled', tone: 'info' as const },
    in_progress: { label: 'In progress', tone: 'primary' as const },
    awaiting_parts: { label: 'Awaiting parts', tone: 'warning' as const },
    complete: { label: 'Complete', tone: 'success' as const },
    cancelled: { label: 'Cancelled', tone: 'destructive' as const },
  },
  invoice: {
    draft: { label: 'Draft', tone: 'neutral' as const },
    sent: { label: 'Sent', tone: 'info' as const },
    paid: { label: 'Paid', tone: 'success' as const },
    overdue: { label: 'Overdue', tone: 'destructive' as const },
  },
}

export const REGIONS = [
  { value: 'syd', label: 'Sydney', description: 'NSW · 14 crews', group: 'East' },
  { value: 'bne', label: 'Brisbane', description: 'QLD · 9 crews', group: 'East' },
  { value: 'mel', label: 'Melbourne', description: 'VIC · 11 crews', group: 'South' },
  { value: 'adl', label: 'Adelaide', description: 'SA · 4 crews', group: 'South' },
  { value: 'per', label: 'Perth', description: 'WA · 6 crews', group: 'West' },
  { value: 'drw', label: 'Darwin', description: 'NT · no crews', group: 'North', disabled: true },
]

export const INVOICES = [
  { id: 'INV-2041', client: 'Harbourside Property', status: 'paid', amount: 4820, due: '12 Aug' },
  { id: 'INV-2042', client: 'Rosewood Estates', status: 'sent', amount: 1290, due: '19 Aug' },
  { id: 'INV-2043', client: 'Kingsley Group', status: 'overdue', amount: 7355, due: '02 Aug' },
  { id: 'INV-2044', client: 'Northline Facilities', status: 'draft', amount: 640, due: '—' },
]
