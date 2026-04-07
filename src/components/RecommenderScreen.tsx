import { useState, useId } from 'react'
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
  { value: 'ideation',   label: 'Generate ideas' },
  { value: 'decision',   label: 'Make decisions' },
  { value: 'planning',   label: 'Plan ahead' },
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

  const challengeId = useId()
  const participantsId = useId()
  const timeId = useId()
  const modeId = useId()
  const keyId = useId()

  const togglePurpose = (p: Purpose) => {
    setSelectedPurposes(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const handleRecommend = async () => {
    setLoading(true)
    setError('')
    setRecommendations(null)

    const input = { challenge, participants, timeAvailable, purposes: selectedPurposes, online }

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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStructure = (id: number) => structures.find(s => s.id === id)!

  return (
    <div className={styles.screen}>
      <div className={styles.form}>

        <div className={styles.field}>
          {/* Proper label association (WCAG 2.4.6, 3.3.2) */}
          <label className={styles.label} htmlFor={challengeId}>
            Describe your challenge or goal
          </label>
          <textarea
            id={challengeId}
            className={styles.textarea}
            value={challenge}
            onChange={e => setChallenge(e.target.value)}
            placeholder="e.g. We need to surface problems our team has been avoiding and move towards action. Some people dominate discussions and others never speak up…"
            rows={3}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={participantsId}>
              Participants
              <span className={styles.inputLabelHint}>(minimum 2)</span>
            </label>
            <input
              id={participantsId}
              type="number"
              className={`${styles.input} ${participants < 2 ? styles.inputError : ''}`}
              value={participants || ''}
              min={2}
              max={500}
              required
              aria-describedby="participants-hint"
              onChange={e => {
                const val = parseInt(e.target.value, 10)
                setParticipants(isNaN(val) ? 2 : Math.max(2, val))
              }}
            />
            {participants < 2 && (
              <span id="participants-hint" className={styles.fieldError} role="alert">
                Minimum 2 participants
              </span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={timeId}>Time available</label>
            <select
              id={timeId}
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
            <label className={styles.label} htmlFor={modeId}>Mode</label>
            <select
              id={modeId}
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

        <fieldset className={styles.field}>
          <legend className={styles.label}>What are you trying to achieve? (pick any)</legend>
          <div className={styles.purposeGrid}>
            {PURPOSES.map(p => (
              <button
                key={p.value}
                type="button"
                aria-pressed={selectedPurposes.includes(p.value)}
                className={`${styles.purposeBtn} ${selectedPurposes.includes(p.value) ? styles.purposeSelected : ''}`}
                onClick={() => togglePurpose(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Optional Gemini key */}
        <div className={styles.aiSection}>
          <button
            type="button"
            className={styles.aiToggle}
            onClick={() => setShowKeyField(!showKeyField)}
            aria-expanded={showKeyField}
          >
            <span aria-hidden="true">✨</span>
            {showKeyField ? 'Hide AI options' : 'Enable AI recommendations (optional)'}
          </button>
          {showKeyField && (
            <div className={styles.aiBox}>
              <p className={styles.aiDesc} id="key-desc">
                Add a free{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio API key
                  <span className="sr-only"> (opens in new tab)</span>
                </a>{' '}
                for smarter recommendations. Must be from AI Studio (not Google Cloud). Includes 1,500 free requests/day. Your key goes directly to Google — never stored anywhere.
              </p>
              <label htmlFor={keyId} className={styles.label}>Gemini API key</label>
              <input
                id={keyId}
                type="password"
                className={styles.input}
                placeholder="AIza…"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                aria-describedby="key-desc"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleRecommend}
          disabled={loading || participants < 2}
          aria-busy={loading}
        >
          {loading ? 'Finding the right structures…' : 'Find structures for me →'}
        </button>
      </div>

      {/* role="alert" announces errors immediately (WCAG 4.1.3) */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {/* aria-live="polite" announces when results appear (WCAG 4.1.3) */}
      <div aria-live="polite" aria-atomic="false">
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
                  <div className={styles.recRank} aria-hidden="true">#{i + 1}</div>
                  <div className={styles.recContent}>
                    <p className={styles.recReason}>{rec.reason}</p>
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
    </div>
  )
}
