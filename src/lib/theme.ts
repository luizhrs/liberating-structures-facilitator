export type ThemeId =
  | 'system'
  | 'light'
  | 'dark'
  | 'warm'
  | 'forest'
  | 'ocean'
  | 'contrast'

export type FontScale = 0.875 | 1 | 1.125 | 1.25 | 1.4

export interface DisplayPrefs {
  theme: ThemeId
  fontSize: FontScale
}

export const THEMES: { id: ThemeId; label: string; bg: string; accent: string; dark: boolean }[] = [
  { id: 'system',   label: 'System',        bg: '',        accent: '',        dark: false },
  { id: 'light',    label: 'Light',         bg: '#fafaf8', accent: '#2d6a4f', dark: false },
  { id: 'dark',     label: 'Dark',          bg: '#141412', accent: '#4ade80', dark: true  },
  { id: 'warm',     label: 'Warm',          bg: '#f7f0e4', accent: '#b06020', dark: false },
  { id: 'forest',   label: 'Forest',        bg: '#0d1a10', accent: '#56b86a', dark: true  },
  { id: 'ocean',    label: 'Ocean',         bg: '#091520', accent: '#4aacdc', dark: true  },
  { id: 'contrast', label: 'High contrast', bg: '#000000', accent: '#ffff00', dark: true  },
]

export const FONT_SIZES: { value: FontScale; label: string }[] = [
  { value: 0.875, label: 'S' },
  { value: 1,     label: 'M' },
  { value: 1.125, label: 'L' },
  { value: 1.25,  label: 'XL' },
  { value: 1.4,   label: 'XXL' },
]

const STORAGE_KEY = 'ls-display'

export const DEFAULT_PREFS: DisplayPrefs = {
  theme: 'system',
  fontSize: 1,
}

export function loadPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>
    return {
      theme: parsed.theme ?? DEFAULT_PREFS.theme,
      fontSize: parsed.fontSize ?? DEFAULT_PREFS.fontSize,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: DisplayPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Fail silently — storage may be unavailable in private browsing
  }
}

export function resolveTheme(themeId: ThemeId): 'light' | 'dark' | ThemeId {
  if (themeId === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return themeId
}

export function applyTheme(themeId: ThemeId): void {
  const resolved = resolveTheme(themeId)
  document.documentElement.setAttribute('data-theme', resolved)
}

export function applyFontSize(scale: FontScale): void {
  document.documentElement.style.setProperty('--font-scale', String(scale))
}

export function applyPrefs(prefs: DisplayPrefs): void {
  applyTheme(prefs.theme)
  applyFontSize(prefs.fontSize)
}

/** Watch for OS dark/light changes and reapply if user is on System theme */
export function watchSystemTheme(getCurrentTheme: () => ThemeId): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (getCurrentTheme() === 'system') {
      applyTheme('system')
    }
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
