import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/**
 * Tracks a service worker that has downloaded a new version and is WAITING
 * for activation (vite-plugin-pwa, registerType: 'prompt'). Exposes a
 * reactive flag for the UpdatePrompt banner, a dismiss function, and the
 * plugin's updateSW callback — calling updateSW(true) sends the
 * SKIP_WAITING message so the waiting worker activates, and the plugin
 * reloads the page once it takes control.
 */
export function usePwaUpdate(): {
  promptShow: Ref<boolean>
  promptDismiss: () => void
  // Assigned inside onMounted, so it is null until the component mounts.
  updateSW: ((reloadPage?: boolean) => Promise<void>) | null
} {
  let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
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
      updateSW = registerSW({
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

  return { promptShow, promptDismiss, updateSW }
}
