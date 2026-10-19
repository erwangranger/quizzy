import { onBeforeUnmount, onMounted, ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/**
 * Tracks a service worker that has installed a new version and is waiting
 * for the current page to close before activating (vite-plugin-pwa,
 * registerType: 'autoUpdate'). Exposes a reactive flag for the
 * UpdatePrompt banner and a dismiss function.
 */
export function usePwaUpdate() {
  const promptShow = ref(false)

  function promptDismiss() {
    promptShow.value = false
  }

  // Page visibility change: the user navigated away; the waiting service
  // worker takes control on the next load, so stop prompting on return.
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      promptDismiss()
    }
  }

  onMounted(() => {
    // Guard for SSR / non-browser environments and missing service worker
    // support; the composable becomes a no-op.
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      registerSW({
        onNeedRefresh() {
          promptShow.value = true
        },
        onRegisterError() {
          // Registration failures must never break the app.
          promptShow.value = false
        },
      })
    } catch {
      // Registration failures must never break the app.
      promptShow.value = false
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  return { promptShow, promptDismiss }
}
