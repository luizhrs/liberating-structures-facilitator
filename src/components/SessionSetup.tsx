import { useState } from 'react'
import type { SessionConfig, SessionMode, Participant, ParticipantLocation } from '../types'
import type { Structure } from '../types'
import styles from './SessionSetup.module.css'

interface Props {
  structure: Structure
  onStart: (config: SessionConfig) => void
  onBack: () => void
}

type Step = 'mode' | 'language' | 'participants'

const MODE_OPTIONS: { value: SessionMode; icon: string; label: string; desc: string }[] = [
  { value: 'inperson', icon: '🏢', label: 'In person', desc: 'Everyone is in the same room' },
  { value: 'virtual', icon: '💻', label: 'Virtual', desc: 'Everyone is joining online' },
  { value: 'hybrid', icon: '🌐', label: 'Hybrid', desc: 'Some in the room, some online' },
]

const STEP_LABELS: Record<Step, string> = {
  mode: 'How are you meeting?',
  language: 'How should instructions read?',
  participants: 'Who\'s in the session?',
}

export default function SessionSetup({ structure, onStart, onBack }: Props) {
  const [step, setStep] = useState<Step>('mode')
  const [mode, setMode] = useState<SessionMode>('inperson')
  const [language, setLanguage] = useState<'ls' | 'friendly'>('friendly')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [nameInput, setNameInput] = useState('')

  const steps: Step[] = ['mode', 'language', 'participants']
  const stepIndex = steps.indexOf(step)

  const addNames = () => {
    const raw = nameInput.trim()
    if (!raw) return
    const names = raw.split(/[,\n]+/).map(n => n.trim()).filter(Boolean)
    const newPeople: Participant[] = names.map(name => ({
      name,
      location: (mode === 'virtual' ? 'virtual' : 'inperson') as ParticipantLocation,
    }))
    setParticipants(prev => {
      const existing = new Set(prev.map(p => p.name.toLowerCase()))
      return [...prev, ...newPeople.filter(p => !existing.has(p.name.toLowerCase()))]
    })
    setNameInput('')
  }

  const removePerson = (name: string) => {
    setParticipants(prev => prev.filter(p => p.name !== name))
  }

  const toggleLocation = (name: string) => {
    setParticipants(prev =>
      prev.map(p =>
        p.name === name
          ? { ...p, location: (p.location === 'inperson' ? 'virtual' : 'inperson') as ParticipantLocation }
          : p
      )
    )
  }

  const startWith = (withParticipants: boolean) => {
    onStart({
      participants: withParticipants ? participants : [],
      mode,
      language,
    })
  }

  return (
    <div className={styles.setup}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Back to {structure.name}
      </button>

      <div className={styles.header}>
        <div className={styles.structureName}>{structure.name}</div>
        <h2 className={styles.title}>Set up your session</h2>
      </div>

      {/* Progress */}
      <div className={styles.progress}>
        {steps.map((s, i) => (
          <div key={s} className={styles.progressItem}>
            <div
              className={`${styles.progressDot} ${s === step ? styles.active : i < stepIndex ? styles.done : ''}`}
              onClick={() => i < stepIndex && setStep(s)}
              style={{ cursor: i < stepIndex ? 'pointer' : 'default' }}
            >
              {i < stepIndex ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`${styles.progressLine} ${i < stepIndex ? styles.progressLineDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      <p className={styles.stepLabel}>{STEP_LABELS[step]}</p>

      {/* ── Step 1: Mode ── */}
      {step === 'mode' && (
        <div className={styles.stepContent}>
          <div className={styles.modeGrid}>
            {MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.modeCard} ${mode === opt.value ? styles.modeSelected : ''}`}
                onClick={() => setMode(opt.value)}
              >
                <span className={styles.modeIcon}>{opt.icon}</span>
                <span className={styles.modeLabel}>{opt.label}</span>
                <span className={styles.modeDesc}>{opt.desc}</span>
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button className={styles.nextBtn} onClick={() => setStep('language')}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Language ── */}
      {step === 'language' && (
        <div className={styles.stepContent}>
          <div className={styles.languageGrid}>
            <button
              className={`${styles.languageCard} ${language === 'friendly' ? styles.languageSelected : ''}`}
              onClick={() => setLanguage('friendly')}
            >
              <span className={styles.languageIcon}>💬</span>
              <span className={styles.languageLabel}>Plain English</span>
              <span className={styles.languageDesc}>Warm and conversational — easier for groups new to this.</span>
              <div className={styles.languageExample}>
                "Take a quiet moment just for yourself. Write down whatever comes to mind — no filter needed."
              </div>
            </button>
            <button
              className={`${styles.languageCard} ${language === 'ls' ? styles.languageSelected : ''}`}
              onClick={() => setLanguage('ls')}
            >
              <span className={styles.languageIcon}>📖</span>
              <span className={styles.languageLabel}>LS Terminology</span>
              <span className={styles.languageDesc}>Original wording from the Liberating Structures canon.</span>
              <div className={styles.languageExample}>
                "Silently self-reflect on the question. Write down your ideas individually. No talking yet."
              </div>
            </button>
          </div>
          <p className={styles.hint}>You can switch this any time during the session.</p>
          <div className={styles.actions}>
            <button className={styles.backStepBtn} onClick={() => setStep('mode')}>← Back</button>
            <button className={styles.nextBtn} onClick={() => setStep('participants')}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Participants ── */}
      {step === 'participants' && (
        <div className={styles.stepContent}>
          <p className={styles.stepHint}>
            Add names and the app will randomly assign people to groups each phase.
            {mode === 'hybrid' && ' For hybrid sessions, you can mark who\'s online or in the room.'}
          </p>

          <div className={styles.inputRow}>
            <input
              className={styles.nameInput}
              type="text"
              placeholder="Type a name, or paste a comma-separated list"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNames()}
              autoFocus
            />
            <button className={styles.addBtn} onClick={addNames}>Add</button>
          </div>

          {participants.length > 0 && (
            <>
              <div className={styles.participantList}>
                {participants.map(p => (
                  <div key={p.name} className={styles.participantItem}>
                    <span className={styles.participantName}>{p.name}</span>
                    {mode === 'hybrid' && (
                      <button
                        className={`${styles.locationToggle} ${p.location === 'virtual' ? styles.virtual : styles.inperson}`}
                        onClick={() => toggleLocation(p.name)}
                        title="Click to toggle"
                      >
                        {p.location === 'virtual' ? '💻 Online' : '🏢 In room'}
                      </button>
                    )}
                    {mode === 'virtual' && <span className={styles.locationBadge}>💻</span>}
                    {mode === 'inperson' && <span className={styles.locationBadge}>🏢</span>}
                    <button className={styles.removeBtn} onClick={() => removePerson(p.name)}>×</button>
                  </div>
                ))}
              </div>
              <div className={styles.participantCount}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
                {mode === 'hybrid' && (
                  <span> · {participants.filter(p => p.location === 'inperson').length} in room · {participants.filter(p => p.location === 'virtual').length} online</span>
                )}
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button className={styles.backStepBtn} onClick={() => setStep('language')}>← Back</button>

            {participants.length >= 2 ? (
              <button className={styles.nextBtn} onClick={() => startWith(true)}>
                Start session →
              </button>
            ) : (
              <button className={styles.nextBtn} onClick={() => startWith(false)}>
                Start without names →
              </button>
            )}
          </div>

          {/* Secondary option — only shown when they HAVE added some names */}
          {participants.length >= 2 && (
            <button className={styles.skipBtn} onClick={() => startWith(false)}>
              Continue without names instead
            </button>
          )}

          {participants.length === 0 && (
            <p className={styles.hint}>
              Groups will be shown as Group A, Group B, etc. You can always add names another time.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
