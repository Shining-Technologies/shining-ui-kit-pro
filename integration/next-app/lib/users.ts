export type Role = 'admin' | 'editor' | 'viewer'
export type Status = 'active' | 'invited' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: Status
  score: number | null
  /** ISO timestamp in UTC. */
  lastLogin: string | null
  /** Calendar date, yyyy-mm-dd. */
  createdAt: string
}

// Deterministic PRNG (mulberry32) so server, client and tests agree.
function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = [
  'Ann', 'Anna', 'Joanne', 'Ánnika', 'Jóhann', 'Zoë', 'José', 'Renée', 'Björn', 'Luis',
  'Mei', 'Priya', 'Ólafur', 'Dannielle', 'Kofi', 'Sven', 'Chloé', 'Íñigo', 'Maya', 'Tomás',
]
const LAST = [
  'Brannigan', 'Müller', 'García', 'Nguyen', 'Smith', 'Øster', 'Johansson', 'Lefèvre',
  'Okafor', 'Tanaka', 'Kowalski', 'Dubois', 'Ramírez', 'Schmidt', 'Patel', 'Hernández',
]
const ROLES: Role[] = ['admin', 'editor', 'viewer']
const STATUSES: Status[] = ['active', 'invited', 'suspended']

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

function build(): User[] {
  const rand = prng(20260913)
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!
  const out: User[] = []
  for (let i = 1; i <= 500; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`
    const ascii = name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z]+/g, '.')
    const day = Math.floor(rand() * 30)
    let hour = Math.floor(rand() * 24)
    const minute = Math.floor(rand() * 60)
    // Every fifth user logs in within an hour of midnight UTC.
    if (i % 5 === 0) hour = i % 10 === 0 ? 23 : 0
    const lastLogin =
      i % 13 === 0
        ? null
        : new Date(Date.UTC(2026, 2, 1 + day, hour, minute, Math.floor(rand() * 60))).toISOString()
    const created = new Date(Date.UTC(2024, 0, 1) + Math.floor(rand() * 730) * 86_400_000)
    out.push({
      id: `u-${pad(i, 3)}`,
      name,
      email: `${ascii}.${i}@example.com`,
      role: pick(ROLES),
      status: pick(STATUSES),
      score: i % 9 === 0 ? null : Math.round(rand() * 10_000) / 100,
      lastLogin,
      createdAt: `${created.getUTCFullYear()}-${pad(created.getUTCMonth() + 1)}-${pad(created.getUTCDate())}`,
    })
  }
  return out
}

export const users: User[] = build()
