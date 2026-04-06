import { useState } from 'react'
import type { Structure, Purpose, Recommendation } from '../types'
import { getRuleBasedRecommendations, getAIRecommendations } from '../lib/recommender'
import StructureCard from './StructureCard'
import styles from './RecommenderScreen.module.css'

interface Props {
  structures: Structure[]
  onRunNow: (s: Structure) => void
  onViewDetail: (s: Structure) => void
}

const PURPOSES: { value: Purpose; label: string }[] = [
  { value: 'ideation', label: 'Generate ideas' },
  { value: 'decision', label: 'Make decisions' },
  { value: 'planning', label: 'Plan ahead' },
  { value: 'reflection', label: 'Reflect & learn' },
  { value: 'engagement', label: 'Engage everyone' },
  { value: 'connection', label: 'Build connection' },
]

export default function RecommenderScreen({ structures, onRunNow, onViewDetail }: Props) {
  const [challenge, setChallenge] = useState('')
  const [participants, setParticipants] = useState(12)
  const [timeAvailable, setTimeAvailable] = useState(60)
  const [selectedPurposes, setSelectedPurposes] = useState<Purpose[]>([])
  const [online, setOnline] = useState<boolean | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [showKeyField, setShowKeyField] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usedAI, setUsedAI] = useState(false)

  const togglePurpose = (p: Purpose) => {
    setSelectedPurposes(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const handleRecommend = async () => {
    setLoading(true)
    setError('')
    setRecommendations(null)

    const input = {
      challenge,
      participants,
      timeAvailable,
      purposes: selectedPurposes,
      online,
    }

    try {
      if (geminiKey.trim()) {
        const recs = await getAIRecommendations(structures, input, geminiKey.trim())
        setRecommendations(recs)
        setUsedAI(true)
      } else {
        const recs = getRuleBasedRecommendations(structures, input)
        setRecommendations(recs)
        setUsedAI(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStructure = (id: number) => structures.find(s => s.id === id)!

  return (
    <div className={styles.screen}>
      <div className={styles.form}>

        <div className={styles.field}>
          <label className={styles.label}>Describe your challenge or goal</label>
          <textarea
            className={styles.textarea}
            value={challenge}
            onChange={e => setChallenge(e.target.value)}
            placeholder="e.g. We need to surface problems our team has been avoiding and move toward action. Some people dominate discussions and others never speak up…"
            rows={3}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Participants</label>
            <input
              type="number"
              className={styles.input}
              value={participants}
              min={2}
              max={500}
              onChange={e => setParticipants(Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Time available</label>
            <select
              className={styles.select}
              value={timeAvailable}
              onChange={e => setTimeAvailable(Number(e.target.value))}
            >
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
              <option value={240}>Half day</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Mode</label>
            <select
              className={styles.select}
              value={online === null ? '' : String(online)}
              onChange={e => setOnline(e.target.value === '' ? null : e.target.value === 'true')}
            >
              <option value="">Any</option>
              <option value="true">Online</option>
              <option value="false">In person</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>What are you trying to achieve? (pick any)</label>
          <div className={styles.purposeGrid}>
            {PURPOSES.map(p => (
              <button
                key={p.value}
                className={`${styles.purposeBtn} ${selectedPurposes.includes(p.value) ? styles.purposeSelected : ''}`}
                onClick={() => togglePurpose(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Gemini key */}
        <div className={styles.aiSection}>
          <button
            className={styles.aiToggle}
            onClick={() => setShowKeyField(!showKeyField)}
          >
            <SparkleIcon />
            {showKeyField ? 'Hide AI options' : 'Enable AI recommendations (optional)'}
          </button>
          {showKeyField && (
            <div className={styles.aiBox}>
              <p className={styles.aiDesc}>
                Add a free{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google Gemini API key
                </a>{' '}
                for smarter recommendations. Your key is never stored or sent anywhere except directly to Google.
              </p>
              <input
                type="password"
                className={styles.input}
                placeholder="AIza…"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
              />
            </div>
          )}
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleRecommend}
          disabled={loading}
        >
          {loading ? 'Finding the right structures…' : 'Find structures for me →'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {recommendations && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>Recommended for your session</h2>
            <span className={styles.resultsBadge}>
              {usedAI ? '✨ AI-powered' : 'Rule-based'}
            </span>
          </div>
          {recommendations.map((rec, i) => {
            const structure = getStructure(rec.structureId)
            if (!structure) return null
            return (
              <div key={rec.structureId} className={styles.recItem}>
                <div className={styles.recRank}>#{i + 1}</div>
                <div className={styles.recContent}>
                  <div className={styles.recReason}>{rec.reason}</div>
                  <StructureCard
                    structure={structure}
                    onSelect={onViewDetail}
                    onRunNow={onRunNow}
                  />
                </div>
              </div>
            )
          })}
          {recommendations.length > 1 && (
            <p className={styles.stringTip}>
              💡 Consider running these as a <strong>string</strong> — a sequence of structures that build on each other for a complete session arc.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
    </svg>
  )
}
