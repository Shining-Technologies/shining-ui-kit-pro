/**
 * Deterministic sample data.
 *
 * No randomness: Storybook, the docs site and the tests must all show the same
 * rows, or "it looks different in the docs" becomes a support question.
 */

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer'
  status: 'active' | 'invited' | 'suspended'
  lastActive: string
  createdAt: string
  phone: string
  location: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: 'Audio' | 'Wearables' | 'Computers' | 'Accessories'
  price: number
  cost: number
  stock: number
  status: 'live' | 'draft' | 'archived'
  rating: number
  image: string
}

export interface Order {
  id: string
  reference: string
  customer: string
  email: string
  amount: number
  currency: string
  payment: 'paid' | 'pending' | 'refunded' | 'failed'
  status: 'fulfilled' | 'processing' | 'cancelled'
  placedAt: string
  items: number
  /** The service lines on the order. */
  services: string[]
  /** Add-ons bought alongside them, summarised as a badge. */
  extras: number
  /** Who in the business owns this order; `null` when nobody has claimed it. */
  handler: string | null
  /** The quote this order came from, when it came from one. */
  quoteId: string | null
}

export interface Account {
  id: string
  contact: string
  company: string
  email: string
  stage: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
  value: number
  owner: string
  probability: number
  nextStep: string
  updatedAt: string
}

export interface Metric {
  id: string
  metric: string
  segment: string
  current: number
  previous: number
  unit: 'count' | 'currency' | 'percent'
  target: number
}

const FIRST = [
  'Ada',
  'Grace',
  'Alan',
  'Katherine',
  'Barbara',
  'Linus',
  'Margaret',
  'Edsger',
  'Radia',
  'Donald',
  'Frances',
  'Tim',
  'Anita',
  'Guido',
  'Shafi',
  'Leslie',
]
const LAST = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Johnson',
  'Liskov',
  'Torvalds',
  'Hamilton',
  'Dijkstra',
  'Perlman',
  'Knuth',
  'Allen',
  'Berners-Lee',
  'Borg',
  'van Rossum',
  'Goldwasser',
  'Lamport',
]
const CITIES = [
  'Sydney',
  'Melbourne',
  'Auckland',
  'Singapore',
  'London',
  'Berlin',
  'Toronto',
  'Austin',
]
const COMPANIES = [
  'Northwind',
  'Contoso',
  'Fabrikam',
  'Initech',
  'Umbrella',
  'Globex',
  'Soylent',
  'Hooli',
  'Vandelay',
  'Wayne Industries',
]

const at = <T>(list: T[], index: number): T => list[index % list.length] as T

/** ISO date `days` before a fixed reference point, so output never drifts. */
const REFERENCE = Date.UTC(2024, 5, 1)
const daysAgo = (days: number) => new Date(REFERENCE - days * 86_400_000).toISOString().slice(0, 10)

export function makeUsers(count = 48): User[] {
  const roles: User['role'][] = ['Owner', 'Admin', 'Editor', 'Viewer']
  const statuses: User['status'][] = ['active', 'active', 'active', 'invited', 'suspended']

  return Array.from({ length: count }, (_, index) => {
    const first = at(FIRST, index)
    const last = at(LAST, index * 3 + 1)
    const name = `${first} ${last}`
    return {
      id: `usr_${String(index + 1).padStart(3, '0')}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      role: at(roles, index + (index % 3)),
      status: at(statuses, index * 2),
      lastActive: daysAgo(index % 40),
      createdAt: daysAgo(120 + ((index * 7) % 400)),
      phone: `+61 4${String(10_000_000 + index * 37_123).slice(0, 8)}`,
      location: at(CITIES, index * 5),
    }
  })
}

export function makeProducts(count = 36): Product[] {
  const names = [
    'Studio Headphones',
    'Field Recorder',
    'Smart Watch',
    'Fitness Band',
    'Laptop Stand',
    'Mechanical Keyboard',
    'USB-C Hub',
    'Desk Microphone',
    'Noise Cancelling Buds',
    'Portable SSD',
    'Webcam Pro',
    'Monitor Light',
  ]
  const categories: Product['category'][] = ['Audio', 'Wearables', 'Computers', 'Accessories']
  const statuses: Product['status'][] = ['live', 'live', 'live', 'draft', 'archived']

  return Array.from({ length: count }, (_, index) => {
    const price = 39 + ((index * 37) % 460)
    return {
      id: `prd_${String(index + 1).padStart(3, '0')}`,
      sku: `SKU-${String(1000 + index * 13)}`,
      name: `${at(names, index)} ${['', 'Mk II', 'Pro', 'Mini'][index % 4]}`.trim(),
      category: at(categories, index),
      price,
      cost: Math.round(price * 0.58),
      stock: (index * 17) % 140,
      status: at(statuses, index * 3),
      rating: Number((3 + ((index * 7) % 20) / 10).toFixed(1)),
      image: '',
    }
  })
}

export function makeOrders(count = 42): Order[] {
  const payments: Order['payment'][] = ['paid', 'paid', 'pending', 'refunded', 'failed']
  const statuses: Order['status'][] = ['fulfilled', 'processing', 'processing', 'cancelled']
  const catalogue = [
    'End of Lease Cleaning',
    'House Cleaning',
    'Window Cleaning',
    'Carpet Steam Cleaning',
    'Oven & Rangehood',
    'Mould Cleaning',
  ]
  const handlers = ['Nayma Orpy', 'Hrui Syang', 'Bornale Costa', null]

  return Array.from({ length: count }, (_, index) => {
    const first = at(FIRST, index * 2)
    const last = at(LAST, index)
    return {
      id: `ord_${String(index + 1).padStart(3, '0')}`,
      reference: `#${10_244 + index * 3}`,
      customer: `${first} ${last}`,
      email: `${first.toLowerCase()}@example.com`,
      amount: 24 + ((index * 137) % 2400),
      currency: 'AUD',
      payment: at(payments, index * 2 + 1),
      status: at(statuses, index),
      placedAt: daysAgo(index % 60),
      items: 1 + (index % 7),
      services:
        index % 5 === 0 ? [at(catalogue, index), at(catalogue, index + 3)] : [at(catalogue, index)],
      extras: index % 3 === 0 ? 0 : (index % 4) + 1,
      handler: at(handlers, index),
      quoteId: index % 4 === 3 ? null : `qte_${String(index + 1).padStart(3, '0')}`,
    }
  })
}

export function makeAccounts(count = 30): Account[] {
  const stages: Account['stage'][] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
  const probabilities: Record<Account['stage'], number> = {
    Lead: 10,
    Qualified: 30,
    Proposal: 55,
    Negotiation: 75,
    Won: 100,
    Lost: 0,
  }

  return Array.from({ length: count }, (_, index) => {
    const stage = at(stages, index * 2 + 1)
    const first = at(FIRST, index * 3)
    const last = at(LAST, index * 5)
    return {
      id: `acc_${String(index + 1).padStart(3, '0')}`,
      contact: `${first} ${last}`,
      company: at(COMPANIES, index),
      email: `${first.toLowerCase()}@${at(COMPANIES, index).toLowerCase().replace(/\W/g, '')}.com`,
      stage,
      value: 5_000 + ((index * 8_731) % 240_000),
      owner: at(FIRST, index + 4),
      probability: probabilities[stage],
      nextStep: at(
        ['Send proposal', 'Book demo', 'Follow up call', 'Security review', 'Contract sent'],
        index,
      ),
      updatedAt: daysAgo(index % 30),
    }
  })
}

export function makeMetrics(): Metric[] {
  const rows: Array<[string, string, number, number, Metric['unit'], number]> = [
    ['Monthly recurring revenue', 'All plans', 482_300, 441_900, 'currency', 500_000],
    ['New customers', 'Self-serve', 1_284, 1_402, 'count', 1_500],
    ['Activation rate', 'Trial signups', 42.8, 38.1, 'percent', 45],
    ['Churn rate', 'All plans', 2.4, 3.1, 'percent', 2],
    ['Average order value', 'Storefront', 168.4, 159.2, 'currency', 175],
    ['Support tickets', 'All channels', 913, 1_042, 'count', 800],
    ['First response time', 'Support', 1.8, 2.6, 'count', 2],
    ['Net promoter score', 'Quarterly survey', 51, 47, 'count', 55],
    ['Expansion revenue', 'Enterprise', 96_400, 78_200, 'currency', 90_000],
    ['Failed payments', 'Billing', 37, 52, 'count', 25],
  ]

  return rows.map(([metric, segment, current, previous, unit, target], index) => ({
    id: `mtr_${index + 1}`,
    metric,
    segment,
    current,
    previous,
    unit,
    target,
  }))
}

export const users = makeUsers()
export const products = makeProducts()
export const orders = makeOrders()
export const accounts = makeAccounts()
export const metrics = makeMetrics()
