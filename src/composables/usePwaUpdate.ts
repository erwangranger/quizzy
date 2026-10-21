import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/**
 * Tracks a service worker that has downloaded a new version and is WAITING
 * for activation (vite-plugin-pwa, registerType: 'prompt'). Exposes a
 * reactive flag for the UpdatePrompt banner, a dismiss function, and the
 * plugin's updateSW callback — calling updateSW(true) sends the
 * SKIP_WAITING message so the waiting worker activates. The generated
 * worker has no clientsClaim, so it never claims the open page and the
 * plugin's controlling-reload does not fire; the caller (App.vue
 * onRefresh) owns the reload via controllerchange or once the
 * SKIP_WAITING promise settles.
 */
export function usePwaUpdate(): {
  promptShow: Ref<boolean>
  promptDismiss: () => void
  // Stable wrapper: reads the plugin callback registered in onMounted, so
  // destructuring App.vue sees it even though registration is async.
  updateSW: (reloadPage?: boolean) => Promise<void>
} {
  let pluginUpdateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
  const promptShow = ref(false)

  function promptDismiss() {
    promptShow.value = false
  }

  // The composable's public updateSW: forwards to the plugin callback once
  // onMounted has registered it. A no-op promise before registration (a
  // user cannot click Refresh before the app mounts anyway).
  async function updateSW(reloadPage?: boolean): Promise<void> {
    await pluginUpdateSW?.(reloadPage)
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
      pluginUpdateSW = registerSW({
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
