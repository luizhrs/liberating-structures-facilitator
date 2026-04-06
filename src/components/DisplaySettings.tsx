import { useEffect, useRef } from 'react'
import type { DisplayPrefs, ThemeId, FontScale } from '../lib/theme'
import { THEMES, FONT_SIZES } from '../lib/theme'
import styles from './DisplaySettings.module.css'

interface Props {
  prefs: DisplayPrefs
  onChange: (prefs: DisplayPrefs) => void
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

// System theme swatch shows a split light/dark preview
function SystemSwatch() {
  return (
    <div className={styles.systemSwatch} aria-hidden="true">
      <div className={styles.systemLeft} />
      <div className={styles.systemRight} />
    </div>
  )
}

export default function DisplaySettings({ prefs, onChange, onClose, triggerRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape and on click outside
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); triggerRef.current?.focus() }
    }
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose, triggerRef])

  // Focus first element on open
  useEffect(() => {
    const firstBtn = panelRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]')
    firstBtn?.focus()
  }, [])

  const setTheme = (theme: ThemeId) => onChange({ ...prefs, theme })
  const setFontSize = (fontSize: FontScale) => onChange({ ...prefs, fontSize })

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Display settings"
      className={styles.panel}
    >
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Theme</h3>
        <div className={styles.themeGrid} role="radiogroup" aria-label="Choose theme">
          {THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={prefs.theme === t.id}
              aria-label={t.label + (prefs.theme === t.id ? ' (selected)' : '')}
              className={`${styles.themeBtn} ${prefs.theme === t.id ? styles.themeBtnActive : ''}`}
              onClick={() => setTheme(t.id)}
            >
              <span className={styles.swatchWrap}>
                {t.id === 'system'
                  ? <SystemSwatch />
                  : (
                    <span
                      className={styles.swatch}
                      style={{ background: t.bg }}
                    >
                      <span
                        className={styles.swatchAccent}
                        style={{ background: t.accent }}
                      />
                    </span>
                  )
                }
                {prefs.theme === t.id && (
                  <span className={styles.swatchCheck} aria-hidden="true">✓</span>
                )}
              </span>
              <span className={styles.themeLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Text size</h3>
        <div className={styles.fontRow} role="radiogroup" aria-label="Text size">
          {FONT_SIZES.map(f => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={prefs.fontSize === f.value}
              aria-label={`Text size ${f.label}${prefs.fontSize === f.value ? ' (selected)' : ''}`}
              className={`${styles.fontBtn} ${prefs.fontSize === f.value ? styles.fontBtnActive : ''}`}
              onClick={() => setFontSize(f.value)}
              style={{ fontSize: `${f.value * 0.85}rem` }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <p className={styles.storageNote}>
        <span aria-hidden="true">🔒</span>{' '}
        Saved to this browser only. Nothing leaves your device.
      </p>
    </div>
  )
}
