// Client-side Google Analytics 4 via the canonical gtag snippet. The
// measurement ID is baked in at build time from VITE_GA_MEASUREMENT_ID (same
// pattern as __APP_VERSION__); when it is absent every function below is a
// no-op, no script tag is injected and no network request is made — the
// offline acceptance criteria keep passing. Loaded async, never blocks the
// game; failures (offline, blocked, ad-blocker) are swallowed.
//
// SPEC section 3 was amended (2026-10-19) to allow client-side analytics:
// owner approval for usage counts, question IDs and per-question
// correct/incorrect counts. No backend, no accounts, no cookies beyond what
// GA4 sets for its own measurement.

interface GtagParams {
  [key: string]: string | number | boolean | undefined
}

interface WindowWithGtag extends Window {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  google_tag_manager?: unknown
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

let initialized = false

// Inject the gtag bootstrap exactly once, async and non-blocking. Safe to
// call repeatedly; only the first call does anything. Without a measurement
// ID nothing is injected.
function load(): void {
  if (initialized) return
  initialized = true
  if (!MEASUREMENT_ID) return
  const w = window as WindowWithGtag
  w.dataLayer = w.dataLayer || []
  // gtag() queues arguments onto dataLayer; works before the script arrives
  w.gtag = function gtag(...args: unknown[]) {
    w.dataLayer!.push(args)
  }
  w.gtag('js', new Date())
  w.gtag('config', MEASUREMENT_ID, {
    // No cookie deprecation flags needed for a plain GA4 property; keep
    // transport beats non-blocking so the game never waits on analytics.
    transport_type: 'beacon',
  })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

// Generic event push. No-op when analytics is disabled or the gtag queue is
// missing (script blocked) — analytics failures must never break the game.
function event(name: string, params: GtagParams = {}): void {
  if (!MEASUREMENT_ID) return
  const w = window as WindowWithGtag
  if (typeof w.gtag !== 'function') return
  try {
    w.gtag('event', name, params)
  } catch {
    // never let analytics break the game
  }
}

// A game started (Starter "Start" or game-over rematch): the basic usage
// count the owner asked for. Params tell which mode and how many players.
function gameStart(mode: string, players: number, count: number): void {
  load()
  event('game_start', { mode, players, question_count: count })
}

// Virtual page_view on a screen transition (intro → game board → game over,
// back to the menu). No URL change, no history entry, no router — GA4 page
// reports read these so the owner can see how far visitors get. The real
// page_view fires once per full load; these mark in-app screens.
function pageView(screen: string): void {
  event('page_view', { page_title: screen, page_location: `${window.location.pathname}#${screen}` })
}

// A question was shown to players (question IDs, per the backlog telemetry
// list). Skipped questions never get this event — they are not played.
function questionShown(questionId: string, category: string): void {
  event('question_shown', { question_id: questionId, category })
}

// A player's answer was scored (per-question correct/incorrect counts).
// Quizmaster: one event per marked player at Next. Pass-and-play: one event
// per recorded choice. Solo: one event.
function questionAnswered(
  questionId: string,
  correct: boolean,
  mode: string,
  playerName?: string,
): void {
  event('question_answered', {
    question_id: questionId,
    correct,
    mode,
    player: playerName,
  })
}

export const analytics = {
  gameStart,
  pageView,
  questionShown,
  questionAnswered,
}
