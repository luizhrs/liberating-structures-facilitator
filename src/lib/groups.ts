import type { Participant } from '../types'

type GroupSize = 'individual' | 'pairs' | number | 'all'

export function parseGroupSize(config: string): GroupSize {
  const lower = config.toLowerCase()
  if (lower.includes('individual') || lower.includes('alone') || lower.includes('yourself')) return 'individual'
  if (lower.includes('whole') || lower.includes('all group') || lower.includes('whole group') || lower === 'all') return 'all'
  if (lower.includes('pair')) return 2
  if (lower.includes('trio')) return 3
  const match = lower.match(/groups? of (\d+)/)
  if (match) return parseInt(match[1])
  const justNumber = lower.match(/^(\d+)$/)
  if (justNumber) return parseInt(justNumber[1])
  return 'all'
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateGroups(
  participants: Participant[],
  groupConfig: string
): string[][] {
  const size = parseGroupSize(groupConfig)
  const names = participants.map(p => p.name)

  if (size === 'individual') return names.map(n => [n])
  if (size === 'all') return [names]

  const numSize = size as number

  // For hybrid sessions: interleave in-person and virtual so groups are mixed
  const hasVirtual = participants.some(p => p.location === 'virtual')
  const hasInPerson = participants.some(p => p.location === 'inperson')

  let ordered: string[]
  if (hasVirtual && hasInPerson) {
    const ip = shuffle(participants.filter(p => p.location === 'inperson').map(p => p.name))
    const vt = shuffle(participants.filter(p => p.location === 'virtual').map(p => p.name))
    ordered = []
    const max = Math.max(ip.length, vt.length)
    for (let i = 0; i < max; i++) {
      if (i < ip.length) ordered.push(ip[i])
      if (i < vt.length) ordered.push(vt[i])
    }
  } else {
    ordered = shuffle(names)
  }

  // Split into groups, distribute leftovers into last group
  const groups: string[][] = []
  for (let i = 0; i < ordered.length; i += numSize) {
    groups.push(ordered.slice(i, i + numSize))
  }

  // If the last group is too small, merge it into the previous one
  if (groups.length > 1 && groups[groups.length - 1].length < Math.ceil(numSize / 2)) {
    const last = groups.pop()!
    groups[groups.length - 1].push(...last)
  }

  return groups
}

export function getGroupLabel(index: number): string {
  const labels = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E',
    'Group F', 'Group G', 'Group H', 'Group I', 'Group J']
  return labels[index] ?? `Group ${index + 1}`
}
