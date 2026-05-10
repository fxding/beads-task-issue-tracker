export interface ThemeDefinition {
  id: string
  label: string
  icon: 'sun' | 'moon'
  baseMode: 'light' | 'dark'
}

const THEMES: ThemeDefinition[] = [
  { id: 'light', label: 'Light', icon: 'sun', baseMode: 'light' },
  { id: 'dark', label: 'Dark', icon: 'moon', baseMode: 'dark' },
]

const LEGACY_THEME_MIGRATIONS: Record<string, ThemeDefinition['id']> = {
  flat: 'dark',
  neon: 'dark',
}

const normalizeThemeId = (id: string) => LEGACY_THEME_MIGRATIONS[id] ?? id

export function useTheme() {
  const theme = useLocalStorage('beads:theme', 'dark')

  // Migration from old localStorage key
  if (import.meta.client && !localStorage.getItem('beads:theme')) {
    const oldDarkMode = localStorage.getItem('beads:darkMode')
    if (oldDarkMode !== null) {
      theme.value = oldDarkMode === 'true' ? 'dark' : 'light'
      localStorage.removeItem('beads:darkMode')
    }
  }

  theme.value = normalizeThemeId(theme.value)

  const themes = THEMES

  const currentTheme = computed((): ThemeDefinition => {
    const found = THEMES.find(t => t.id === normalizeThemeId(theme.value))
    return found ?? THEMES[1]! // fallback to dark theme
  })

  const isDark = computed(() => currentTheme.value.baseMode === 'dark')

  const setTheme = (id: string) => {
    theme.value = normalizeThemeId(id)
    updateHtmlClass()
  }

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === normalizeThemeId(theme.value))
    const nextIndex = (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex]!.id)
  }

  const updateHtmlClass = () => {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', isDark.value)
    }
  }

  // Initialize on mount
  onMounted(() => {
    updateHtmlClass()
  })

  return {
    theme,
    themes,
    currentTheme,
    isDark,
    setTheme,
    cycleTheme,
  }
}
