import { useState, useEffect, useRef } from 'react'
import type { Structure, SessionConfig } from './types'
import structuresData from './data/structures.json'
import StructureCard from './components/StructureCard'
import RecommenderScreen from './components/RecommenderScreen'
import SessionSetup from './components/SessionSetup'
import SessionRunner from './components/SessionRunner'
import styles from './App.module.css'
import DisplaySettings from './components/DisplaySettings'
import { loadPrefs, savePrefs, applyPrefs, watchSystemTheme } from './lib/theme'
import type { DisplayPrefs } from './lib/theme'

const structures = structuresData as Structure[]

type Screen = 'home' | 'browse' | 'recommend' | 'detail' | 'setup' | 'session'

const PURPOSE_OPTIONS = [
  { value: '', label: 'All purposes' },
  { value: 'ideation', label: 'Ideation' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'decision', label: 'Decision-making' },
  { value: 'planning', label: 'Planning' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'connection', label: 'Connection' },
]

const COMPLEXITY_OPTIONS = [
  { value: '', label: 'Any complexity' },
  { value: 'basic', label: 'Accessible' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

// A handful of structure names shown on the home screen as ambient decoration
const SAMPLE_NAMES = [
  '1-2-4-All', 'Troika Consulting', 'TRIZ', 'Conversation Café',
  'What So What Now What', '15% Solutions', 'Nine Whys', 'Min Specs',
  'Wise Crowds', 'Wicked Questions', 'Appreciative Interviews', 'Open Space',
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [screenKey, setScreenKey] = useState(0)
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null)
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)

  // Display preferences — theme + font size
  const [prefs, setPrefs] = useState<DisplayPrefs>(loadPrefs)
  const [showDisplay, setShowDisplay] = useState(false)
  const displayBtnRef = useRef<HTMLButtonElement>(null)

  const [query, setQuery] = useState('')
  const [filterPurpose, setFilterPurpose] = useState('')
  const [filterComplexity, setFilterComplexity] = useState('')
  const [filterMaxTime, setFilterMaxTime] = useState(999)
  const [filterOnline, setFilterOnline] = useState<string>('')

  // Increment key on every screen change to trigger re-mount and animation
  const goTo = (s: Screen) => {
    setScreen(s)
    setScreenKey(k => k + 1)
  }


  // Apply theme + font size on prefs change
  useEffect(() => {
    applyPrefs(prefs)
    savePrefs(prefs)
  }, [prefs])

  // Re-apply system theme if OS preference changes
  useEffect(() => {
    return watchSystemTheme(() => prefs.theme)
  }, [prefs.theme])

  // WCAG 2.4.2 — Update page title on every screen change
  const SCREEN_TITLES: Record<Screen, string> = {
    home: 'LS Facilitator — Liberating Structures Companion',
    browse: 'Browse structures — LS Facilitator',
    recommend: 'Find the right structure — LS Facilitator',
    detail: selectedStructure ? `${selectedStructure.name} — LS Facilitator` : 'LS Facilitator',
    setup: selectedStructure ? `Set up session: ${selectedStructure.name} — LS Facilitator` : 'LS Facilitator',
    session: selectedStructure ? `Running: ${selectedStructure.name} — LS Facilitator` : 'LS Facilitator',
  }

  useEffect(() => {
    document.title = SCREEN_TITLES[screen]
  }, [screen, selectedStructure])

  const filteredStructures = structures.filter(s => {
    if (query) {
      const q = query.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q) && !s.when.toLowerCase().includes(q)) return false
    }
    if (filterPurpose && !s.purposes.includes(filterPurpose as never)) return false
    if (filterComplexity && s.complexity !== filterComplexity) return false
    if (s.time > filterMaxTime) return false
    if (filterOnline === 'true' && !s.online) return false
    if (filterOnline === 'false' && s.online) return false
    return true
  })

  const goToDetail = (s: Structure) => { setSelectedStructure(s); goTo('detail') }
  const goToSetup  = (s: Structure) => { setSelectedStructure(s); goTo('setup') }
  const handleSetupStart = (config: SessionConfig) => { setSessionConfig(config); goTo('session') }
  const endSession = () => goTo('detail')

  const isSession = screen === 'session'

  return (
    <div className={styles.app}>
      {/* WCAG 2.4.1 — Skip navigation link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Header — hidden on session screen for focus */}
      {!isSession && (
        <header className={styles.header}>
          <button className={styles.logo} onClick={() => goTo('home')}>
            <span className={styles.logoMark}>LS</span>
            <span className={styles.logoText}>Facilitator</span>
          </button>

          {screen !== 'home' && (
            <nav className={styles.nav}>
              <button
                className={`${styles.navBtn} ${screen === 'browse' || screen === 'detail' ? styles.navActive : ''}`}
                onClick={() => goTo('browse')}
              >
                Browse
              </button>
              <button
                className={`${styles.navBtn} ${screen === 'recommend' ? styles.navActive : ''}`}
                onClick={() => goTo('recommend')}
              >
                Recommend
              </button>
            </nav>
          )}

          <div className={styles.displayWrap}>
            <button
              ref={displayBtnRef}
              type="button"
              className={styles.displayBtn}
              onClick={() => setShowDisplay(v => !v)}
              aria-label="Display settings"
              aria-expanded={showDisplay}
              aria-haspopup="dialog"
            >
              <span aria-hidden="true" className={styles.displayBtnLabel}>Aa</span>
            </button>
            {showDisplay && (
              <DisplaySettings
                prefs={prefs}
                onChange={setPrefs}
                onClose={() => setShowDisplay(false)}
                triggerRef={displayBtnRef}
              />
            )}
          </div>

          <a
            className={styles.githubLink}
            href="https://github.com/luizhrs/liberating-structures-facilitator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub (opens in new tab)"
          >
            <GitHubIcon aria-hidden="true" focusable="false" />
          </a>
        </header>
      )}

      <main id="main-content" className={`${styles.main} ${isSession ? styles.mainSession : ''}`}>
        <div key={screenKey} className={styles.screenWrapper}>

          {/* HOME */}
          {screen === 'home' && (
            <div className={styles.homeScreen}>
              <div className={styles.homeHero}>
                <div className={styles.homeTag}>Liberating Structures</div>
                <h1 className={styles.homeTitle}>Better meetings,<br/>every time.</h1>
                <p className={styles.homeSub}>
                  A free facilitation companion for the 33 Liberating Structures.
                  No accounts, no data saved — just you and your group.
                </p>
              </div>

              <div className={styles.homeChoices}>
                <button className={`${styles.choiceCard} ${styles.choicePrimary}`} onClick={() => goTo('recommend')} aria-label="Help me choose a structure">
                  <span className={styles.choiceIcon}>🎯</span>
                  <span className={styles.choiceTitle}>Help me choose</span>
                  <span className={styles.choiceDesc}>Describe your situation and get matched with the right structure for your group</span>
                  <span className={styles.choiceArrow}>→</span>
                </button>

                <button className={styles.choiceCard} onClick={() => goTo('browse')} aria-label="Browse all structures">
                  <span className={styles.choiceIcon}>📚</span>
                  <span className={styles.choiceTitle}>Browse structures</span>
                  <span className={styles.choiceDesc}>Explore all 33 Liberating Structures and run any of them with a guided timer</span>
                  <span className={styles.choiceArrow}>→</span>
                </button>
              </div>

              <div className={styles.homeCloud}>
                {SAMPLE_NAMES.map(name => (
                  <span key={name} className={styles.cloudTag}>{name}</span>
                ))}
              </div>

              <p className={styles.homeFootnote}>
                Based on the work of Henri Lipmanowicz & Keith McCandless ·{' '}
                <a href="https://www.liberatingstructures.com" target="_blank" rel="noopener noreferrer">
                  liberatingstructures.com
                </a>
              </p>
            </div>
          )}

          {/* BROWSE */}
          {screen === 'browse' && (
            <div className={styles.browseScreen}>
              <div className={styles.browseHero}>
                <h1 className={styles.heroTitle}>33 Liberating Structures</h1>
                <p className={styles.heroSub}>
                  Choose a structure to explore it, or use{' '}
                  <button className={styles.inlineLink} onClick={() => goTo('recommend')}>Recommend</button>{' '}
                  to find the right one for your situation.
                </p>
              </div>

              <div className={styles.filters}>
                <input
                  className={styles.searchInput}
                  type="search"
                  placeholder="Search structures…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <select className={styles.filterSelect} value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}>
                  {PURPOSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className={styles.filterSelect} value={filterComplexity} onChange={e => setFilterComplexity(e.target.value)}>
                  {COMPLEXITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className={styles.filterSelect} value={String(filterMaxTime)} onChange={e => setFilterMaxTime(Number(e.target.value))}>
                  <option value="999">Any duration</option>
                  <option value="20">Up to 20 min</option>
                  <option value="30">Up to 30 min</option>
                  <option value="60">Up to 60 min</option>
                  <option value="90">Up to 90 min</option>
                </select>
                <select className={styles.filterSelect} value={filterOnline} onChange={e => setFilterOnline(e.target.value)}>
                  <option value="">Any mode</option>
                  <option value="true">Online-friendly</option>
                  <option value="false">In-person only</option>
                </select>
              </div>

              <div className={styles.resultsCount}>{filteredStructures.length} of {structures.length} structures</div>

              <div className={styles.grid}>
                {filteredStructures.map(s => (
                  <StructureCard key={s.id} structure={s} onSelect={goToDetail} onRunNow={goToSetup} />
                ))}
                {filteredStructures.length === 0 && (
                  <div className={styles.empty}>
                    <p>No structures match your filters.</p>
                    <button className={styles.clearBtn} onClick={() => { setQuery(''); setFilterPurpose(''); setFilterComplexity(''); setFilterMaxTime(999); setFilterOnline('') }}>
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RECOMMEND */}
          {screen === 'recommend' && (
            <div className={styles.contentWrap}>
              <h1 className={styles.pageTitle}>Find the right structure</h1>
              <p className={styles.pageSub}>
                Describe your situation and we'll match you with the best Liberating Structures.
                Works without an API key — add a free Gemini key for AI-powered suggestions.
              </p>
              <RecommenderScreen structures={structures} onRunNow={goToSetup} onViewDetail={goToDetail} />
            </div>
          )}

          {/* DETAIL */}
          {screen === 'detail' && selectedStructure && (
            <div className={styles.contentWrap}>
              <button className={styles.backBtn} onClick={() => goTo('browse')}>← Back to browse</button>

              <div className={styles.detailHeader}>
                <div>
                  <div className={styles.lsNumberBadge}>LS #{selectedStructure.lsNumber}</div>
                  <h1 className={styles.detailTitle}>{selectedStructure.name}</h1>
                  <p className={styles.detailDesc}>{selectedStructure.desc}</p>
                </div>
                <button className={styles.runBigBtn} onClick={() => goToSetup(selectedStructure)}>
                  Run this structure →
                </button>
              </div>

              <div className={styles.detailMeta}>
                <div className={styles.metaChip}><span className={styles.metaChipLabel}>Duration</span><span className={styles.metaChipValue}>{selectedStructure.time} min</span></div>
                <div className={styles.metaChip}><span className={styles.metaChipLabel}>Participants</span><span className={styles.metaChipValue}>{selectedStructure.minParticipants}{selectedStructure.maxParticipants < 999 ? `–${selectedStructure.maxParticipants}` : '+'}</span></div>
                <div className={styles.metaChip}><span className={styles.metaChipLabel}>Complexity</span><span className={styles.metaChipValue} style={{ textTransform: 'capitalize' }}>{selectedStructure.complexity}</span></div>
                <div className={styles.metaChip}><span className={styles.metaChipLabel}>Online</span><span className={styles.metaChipValue}>{selectedStructure.online ? 'Yes' : 'In-person only'}</span></div>
              </div>

              <div className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>When to use it</h2>
                <p className={styles.sectionText}>{selectedStructure.when}</p>
              </div>

              {selectedStructure.structuralInvitation && (
                <div className={styles.detailSection}>
                  <h2 className={styles.sectionTitle}>Opening invitation</h2>
                  <blockquote className={styles.invitation}>
                    {selectedStructure.structuralInvitation}
                  </blockquote>
                  <p className={styles.invitationHint}>The prompt you use to introduce the structure to the group.</p>
                </div>
              )}

              <div className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>Phases</h2>
                <div className={styles.phaseList}>
                  {selectedStructure.phases.map((phase, i) => (
                    <div key={i} className={styles.phaseItem}>
                      <div className={styles.phaseNum}>{i + 1}</div>
                      <div className={styles.phaseBody}>
                        <div className={styles.phaseTop}>
                          <span className={styles.phaseLabel}>{phase.label}</span>
                          <span className={styles.phaseMeta}>{phase.minutes} min · {phase.groups}</span>
                        </div>
                        <p className={styles.phaseInstruction}>{phase.friendlyInstruction || phase.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>Facilitator tips & traps</h2>
                <ul className={styles.tipsList}>
                  {selectedStructure.tips.map((tip, i) => <li key={i} className={styles.tipItem}>{tip}</li>)}
                </ul>
              </div>

              <div className={styles.detailFooter}>
                <button className={styles.runBigBtn} onClick={() => goToSetup(selectedStructure)}>
                  Run this structure →
                </button>
                <a
                  className={styles.externalLink}
                  href={`https://www.liberatingstructures.com/${selectedStructure.lsUrl}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more at liberatingstructures.com
                  <span className="sr-only"> (opens in new tab)</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </div>

              {selectedStructure.attribution && (
                <p className={styles.attribution}>{selectedStructure.attribution}</p>
              )}
            </div>
          )}

          {/* SETUP */}
          {screen === 'setup' && selectedStructure && (
            <SessionSetup
              structure={selectedStructure}
              onStart={handleSetupStart}
              onBack={() => goTo('detail')}
            />
          )}

          {/* SESSION */}
          {screen === 'session' && selectedStructure && sessionConfig && (
            <div className={styles.sessionWrap}>
              <div className={styles.sessionHeader}>
                <button className={styles.backBtn} onClick={() => goTo('setup')}>
                  ← {selectedStructure.name}
                </button>
                <span className={styles.sessionLabel}>Live session</span>
              </div>
              <SessionRunner
                structure={selectedStructure}
                config={sessionConfig}
                onEnd={endSession}
              />
            </div>
          )}

        </div>
      </main>

      {!isSession && (
        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <span className={styles.footerBuilt}>
              Built by{' '}
              <a
                href="https://github.com/luizhrs"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerName}
              >
                Luiz Santana
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </span>
            <div className={styles.footerIcons}>
              <a
                href="https://github.com/luizhrs"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Luiz Santana on GitHub (opens in new tab)"
              >
                <GitHubIcon />
              </a>
              <a
                href="https://www.linkedin.com/in/luiz-hrsantana/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Luiz Santana on LinkedIn (opens in new tab)"
              >
                <LinkedInIcon />
              </a>
              <a
                href="https://luizhrsantana.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Luiz Santana on Substack (opens in new tab)"
              >
                <SubstackIcon />
              </a>
            </div>
            <span className={styles.footerDivider} aria-hidden="true" />
            <span className={styles.footerMeta}>Open source · No data collected</span>
          </div>
          <p className={styles.footerAttribution}>
            Based on the work of Henri Lipmanowicz &amp; Keith McCandless ·{' '}
            <a
              href="https://www.liberatingstructures.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              liberatingstructures.com
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </footer>
      )}
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function SubstackIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
    </svg>
  )
}
