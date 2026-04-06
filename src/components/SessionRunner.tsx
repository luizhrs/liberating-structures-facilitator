import { useState, useEffect, useCallback, useRef } from 'react'
import type { Structure, SessionConfig } from '../types'
import { useTimer } from '../hooks/useTimer'
import { generateGroups, getGroupLabel, parseGroupSize } from '../lib/groups'
import styles from './SessionRunner.module.css'

interface Props {
  structure: Structure
  config: SessionConfig
  onEnd: () => void
}

export default function SessionRunner({ structure, config, onEnd }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [groups, setGroups] = useState<string[][]>([])
  const [language, setLanguage] = useState(config.language)
  const [showHelp, setShowHelp] = useState(false)
  const [wasRunningBeforeHelp, setWasRunningBeforeHelp] = useState(false)
  const [reshuffleAnnouncement, setReshuffleAnnouncement] = useState('')
  const [timerAnnouncement, setTimerAnnouncement] = useState('')

  /* Focus management refs (WCAG 2.4.3) */
  const helpBtnRef = useRef<HTMLButtonElement>(null)
  const helpPanelRef = useRef<HTMLDivElement>(null)

  const phase = structure.phases[phaseIndex]
  const isLastPhase = phaseIndex === structure.phases.length - 1
  const timer = useTimer(phase.minutes * 60)

  const reshuffleGroups = useCallback(() => {
    const groupSize = parseGroupSize(phase.groups)
    if (groupSize === 'individual' || groupSize === 'all' || config.participants.length === 0) {
      setGroups([]); return
    }
    setGroups(generateGroups(config.participants, phase.groups))
  }, [phase.groups, config.participants])

  useEffect(() => {
    timer.reset(structure.phases[phaseIndex].minutes * 60)
    if (phaseIndex > 0) timer.start()
    reshuffleGroups()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex])

  useEffect(() => { reshuffleGroups() }, []) // eslint-disable-line

  /* Announce timer completion to screen readers (WCAG 1.4.1, 4.1.3) */
  useEffect(() => {
    if (timer.seconds === 0) {
      setTimerAnnouncement(`Time is up for phase ${phaseIndex + 1}: ${phase.label}.`)
    } else {
      setTimerAnnouncement('')
    }
  }, [timer.seconds, phaseIndex, phase.label])

  /* Move focus into dialog when it opens (WCAG 2.4.3) */
  useEffect(() => {
    if (showHelp) {
      /* Small delay to allow render */
      requestAnimationFrame(() => { helpPanelRef.current?.focus() })
    }
  }, [showHelp])

  const openHelp = () => {
    setWasRunningBeforeHelp(timer.isRunning)
    if (timer.isRunning) timer.pause()
    setShowHelp(true)
  }

  const closeHelp = () => {
    setShowHelp(false)
    /* Return focus to trigger element (WCAG 2.4.3) */
    requestAnimationFrame(() => { helpBtnRef.current?.focus() })
  }

  /* Focus trap for help overlay (WCAG 2.1.1, 2.1.2) */
  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { closeHelp(); return }
    if (e.key !== 'Tab') return

    const focusable = helpPanelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  const handleReshuffle = () => {
    reshuffleGroups()
    setReshuffleAnnouncement('Groups have been reshuffled.')
    setTimeout(() => setReshuffleAnnouncement(''), 2000)
  }

  const handleNext = () => {
    if (isLastPhase) onEnd()
    else setPhaseIndex(i => i + 1)
  }

  const instruction = language === 'friendly' && phase.friendlyInstruction
    ? phase.friendlyInstruction
    : phase.instruction

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - timer.progress)
  const timedOut = timer.seconds === 0

  const groupSize = parseGroupSize(phase.groups)
  const showGroups = config.participants.length > 0 && groupSize !== 'individual' && groupSize !== 'all'
  const isIndividual = groupSize === 'individual'
  const isAll = groupSize === 'all'

  return (
    <div className={styles.runner}>

      {/* Screen-reader live regions (WCAG 4.1.3) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{timerAnnouncement}</div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{reshuffleAnnouncement}</div>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.dots} role="tablist" aria-label="Session phases">
          {structure.phases.map((p, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === phaseIndex}
              aria-label={`Phase ${i + 1}: ${p.label}${i < phaseIndex ? ' (completed)' : ''}`}
              className={`${styles.dotBtn}`}
              onClick={() => setPhaseIndex(i)}
            >
              <span className={`${styles.dot} ${i === phaseIndex ? styles.dotActive : ''} ${i < phaseIndex ? styles.dotDone : ''}`} />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.langToggle}
          onClick={() => setLanguage(l => l === 'ls' ? 'friendly' : 'ls')}
          aria-pressed={language === 'ls'}
          aria-label={`Language mode: ${language === 'ls' ? 'LS official lingo' : 'Simplified'}. Click to switch.`}
        >
          {language === 'ls' ? 'LS official lingo' : 'Simplified'}
        </button>
      </div>

      {/* Phase label */}
      <div className={styles.phaseHeader}>
        <span className={styles.phaseBadge}>
          Phase {phaseIndex + 1} of {structure.phases.length}
        </span>
        <h2 className={styles.phaseLabel}>{phase.label}</h2>
      </div>

      {/* Timer — aria-label provides non-colour state for screen readers (WCAG 1.4.1) */}
      <div
        className={styles.timerWrap}
        role="timer"
        aria-label={timedOut ? 'Time is up' : `${timer.formatted} remaining for ${phase.label}`}
      >
        <svg
          className={styles.timerSvg}
          viewBox="0 0 120 120"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--c-border-input)" strokeWidth="5"/>
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={timedOut ? 'var(--c-coral)' : 'var(--c-accent)'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
          />
        </svg>
        <div className={styles.timerText} aria-hidden="true">
          {/* Visual display — screen reader uses the role="timer" aria-label above */}
          <span className={`${styles.timerDisplay} ${timedOut ? styles.timerDone : ''}`}>
            {timedOut ? "Time's up" : timer.formatted}
          </span>
          {!timedOut && <span className={styles.timerMinutes}>{phase.minutes} min</span>}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={timer.toggle}>
          {timer.isRunning ? '⏸ Pause' : timer.seconds === phase.minutes * 60 ? '▶ Start' : '▶ Resume'}
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleNext}>
          {isLastPhase ? 'Finish ✓' : 'Next phase →'}
        </button>
      </div>

      {/* Instruction */}
      <div className={styles.instruction}>
        <div className={styles.instructionLabel} aria-hidden="true">What to do now</div>
        <p className={styles.instructionText}>{instruction}</p>
        <div className={styles.groupConfig}>
          <svg aria-hidden="true" focusable="false" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {phase.groups}
        </div>
      </div>

      {/* Groups */}
      {config.participants.length > 0 && (
        <div className={styles.groupsSection}>
          <div className={styles.groupsHeader}>
            <span className={styles.groupsTitle}>
              {isIndividual ? 'Everyone works individually' : isAll ? 'Whole group together' : "Today's groups"}
            </span>
            {showGroups && (
              <button type="button" className={styles.reshuffleBtn} onClick={handleReshuffle}>
                ↻ Reshuffle
              </button>
            )}
          </div>

          {(isIndividual || isAll) && (
            <div className={styles.allNames} aria-label="Participants">
              {config.participants.map(p => (
                <span key={p.name} className={`${styles.nameChip} ${config.mode === 'hybrid' ? (p.location === 'virtual' ? styles.chipVirtual : styles.chipInperson) : ''}`}>
                  {config.mode === 'hybrid' && (
                    <span aria-hidden="true" className={styles.chipIcon}>{p.location === 'virtual' ? '💻' : '🏢'}</span>
                  )}
                  {p.name}
                  {config.mode === 'hybrid' && (
                    <span className="sr-only">({p.location === 'virtual' ? 'online' : 'in the room'})</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {showGroups && (
            <div className={styles.groupCards}>
              {groups.map((group, i) => (
                <div key={i} className={styles.groupCard} aria-label={getGroupLabel(i)}>
                  <div className={styles.groupCardLabel} aria-hidden="true">{getGroupLabel(i)}</div>
                  <div className={styles.groupMembers}>
                    {group.map(name => {
                      const participant = config.participants.find(p => p.name === name)
                      return (
                        <span
                          key={name}
                          className={`${styles.nameChip} ${config.mode === 'hybrid' && participant ? (participant.location === 'virtual' ? styles.chipVirtual : styles.chipInperson) : ''}`}
                        >
                          {config.mode === 'hybrid' && participant && (
                            <span aria-hidden="true" className={styles.chipIcon}>{participant.location === 'virtual' ? '💻' : '🏢'}</span>
                          )}
                          {name}
                          {config.mode === 'hybrid' && participant && (
                            <span className="sr-only">({participant.location === 'virtual' ? 'online' : 'in the room'})</span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {structure.tips.length > 0 && (
        <details className={styles.tips}>
          <summary className={styles.tipsSummary}>Facilitator tips &amp; traps</summary>
          <ul className={styles.tipsList}>
            {structure.tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </details>
      )}

      <button type="button" className={styles.endBtn} onClick={onEnd}>
        End session early
      </button>

      {/* Floating help button (WCAG 2.5.8 — 48×48px) */}
      <button
        ref={helpBtnRef}
        type="button"
        className={styles.helpBtn}
        onClick={openHelp}
        aria-label="Open structure guide"
        aria-expanded={showHelp}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">?</span>
      </button>

      {/* Help overlay — proper dialog with focus trap (WCAG 2.1.1, 2.4.3, 4.1.2) */}
      {showHelp && (
        <div
          className={styles.helpOverlay}
          onClick={e => { if (e.target === e.currentTarget) closeHelp() }}
          aria-hidden="true" /* Hides background from screen readers while dialog is open */
        >
          <div
            ref={helpPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-panel-title"
            className={styles.helpPanel}
            tabIndex={-1}
            onKeyDown={handlePanelKeyDown}
          >
            <div className={styles.helpHeader}>
              <div>
                <div className={styles.helpTag} aria-hidden="true">Structure guide</div>
                <h3 className={styles.helpTitle} id="help-panel-title">{structure.name}</h3>
              </div>
              <button
                type="button"
                className={styles.helpClose}
                onClick={closeHelp}
                aria-label="Close structure guide"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            {wasRunningBeforeHelp && (
              <div className={styles.helpPausedNotice} role="status">
                ⏸ Timer paused — press "Close and resume" when ready to continue.
              </div>
            )}

            <p className={styles.helpDesc}>{structure.desc}</p>

            <div className={styles.helpSection}>
              <h4 className={styles.helpSectionTitle}>When to use it</h4>
              <p className={styles.helpSectionText}>{structure.when}</p>
            </div>

            {structure.structuralInvitation && (
              <div className={styles.helpSection}>
                <h4 className={styles.helpSectionTitle}>Opening invitation</h4>
                <blockquote className={styles.helpInvitation}>{structure.structuralInvitation}</blockquote>
              </div>
            )}

            <div className={styles.helpSection}>
              <h4 className={styles.helpSectionTitle}>All phases</h4>
              <div className={styles.helpPhaseList}>
                {structure.phases.map((p, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${styles.helpPhaseItem} ${i === phaseIndex ? styles.helpPhaseActive : ''}`}
                    onClick={() => { setPhaseIndex(i); closeHelp() }}
                    aria-label={`Jump to phase ${i + 1}: ${p.label}${i === phaseIndex ? ' (current)' : ''}`}
                  >
                    <div className={styles.helpPhaseNum} aria-hidden="true">{i + 1}</div>
                    <div className={styles.helpPhaseBody}>
                      <div className={styles.helpPhaseTop}>
                        <span className={styles.helpPhaseLabel}>{p.label}</span>
                        <span className={styles.helpPhaseMeta} aria-label={`${p.minutes} minutes, ${p.groups}`}>
                          {p.minutes} min · {p.groups}
                        </span>
                      </div>
                      <p className={styles.helpPhaseInstruction}>
                        {language === 'friendly' && p.friendlyInstruction
                          ? p.friendlyInstruction
                          : p.instruction}
                      </p>
                    </div>
                    {i === phaseIndex && (
                      <span className={styles.helpPhaseCurrent} aria-hidden="true">Now</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.helpSection}>
              <h4 className={styles.helpSectionTitle}>Facilitator tips &amp; traps</h4>
              <ul className={styles.helpTipsList}>
                {structure.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>

            <div className={styles.helpFooter}>
              <button type="button" className={styles.helpCloseBtn} onClick={closeHelp}>
                Close guide
              </button>
              {wasRunningBeforeHelp && (
                <button
                  type="button"
                  className={styles.helpResumeBtn}
                  onClick={() => { closeHelp(); timer.start() }}
                >
                  ▶ Close and resume timer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
