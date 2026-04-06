import type { Structure } from '../types'
import styles from './StructureCard.module.css'

const PURPOSE_COLOURS: Record<string, string> = {
  ideation: 'amber',
  reflection: 'blue',
  decision: 'coral',
  planning: 'green',
  engagement: 'purple',
  connection: 'teal',
}

const COMPLEXITY_LABEL: Record<string, string> = {
  basic: 'Accessible',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

interface Props {
  structure: Structure
  onSelect: (s: Structure) => void
  onRunNow: (s: Structure) => void
  compact?: boolean
}

export default function StructureCard({ structure, onSelect, onRunNow, compact }: Props) {
  return (
    <div
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      onClick={() => onSelect(structure)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(structure)}
    >
      <div className={styles.header}>
        <div>
          <h3 className={styles.name}>{structure.name}</h3>
          {!compact && (
            <p className={styles.desc}>{structure.desc}</p>
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <ClockIcon />
            {structure.time}m
          </span>
          <span className={styles.metaItem}>
            <PeopleIcon />
            {structure.minParticipants === 1 ? 'Any' : `${structure.minParticipants}+`}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.tags}>
          {structure.purposes.slice(0, 3).map(p => (
            <span
              key={p}
              className={styles.tag}
              data-colour={PURPOSE_COLOURS[p] ?? 'blue'}
            >
              {p}
            </span>
          ))}
          <span className={styles.complexityBadge} data-level={structure.complexity}>
            {COMPLEXITY_LABEL[structure.complexity]}
          </span>
          {structure.online && (
            <span className={styles.onlineBadge}>Online ✓</span>
          )}
        </div>
        <button
          className={styles.runBtn}
          onClick={e => { e.stopPropagation(); onRunNow(structure) }}
        >
          Run this →
        </button>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
