let windowModule: typeof import('@tauri-apps/api/window') | null = null

declare global {
  interface Window {
    __TAURI__?: unknown
    __TAURI_INTERNALS__?: unknown
  }
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)
}

// Pre-load the Tauri window module
if (import.meta.client && isTauri()) {
  import('@tauri-apps/api/window').then(mod => {
    windowModule = mod
  }).catch(() => {
    // Not in Tauri environment
  })
}

export function useTauriWindow() {
  const getWindow = () => {
    if (!windowModule || !isTauri()) return null

    try {
      return windowModule.getCurrentWindow()
    } catch {
      return null
    }
  }

  const startDragging = () => {
    getWindow()?.startDragging()
  }

  const setWindowTitle = (title: string) => {
    getWindow()?.setTitle(title)
  }

  return {
    startDragging,
    setWindowTitle,
  }
}
