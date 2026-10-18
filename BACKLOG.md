# Backlog

## Woozy face 🥴 branding (in progress)
- [x] `index.html` title, `README.md` heading, `package.json` description, `CHANGELOG.md` Unreleased entry
- [x] `app.title` in `src/locales/index.ts` en + fr → `'Quizzy 🥴'`
- [ ] Favicon: none exists today (`index.html` has no `<link rel="icon">`); add an emoji SVG favicon for 🥴
- [x] Run vitest suite after the `app.title` change (6/6 passed)

## Cross-session note
- Another omp session is active in this repo. This branding work is uncommitted; reconcile `CHANGELOG.md` (it gained a top-level Unreleased section) before either side commits.

## Special categories from course materials (idea)
- Feed in a number of `.pdf` files or raw text; an AI reads it and generates quiz questions from it.
- Purpose: students confirm they understood course materials well enough.
- Fits existing data model: generated questions as `questions/*.json` entries (`id`, `lang`, …) loaded through the `questionBank` module.
- Constraints that still apply: no AI API calls from the client app (generation happens offline in a pipeline, results are reviewed before merging — same shape as Phase 5).

## Play analytics (idea)
- [ ] Awareness goal: the game is friends-first but public (served via GitHub Pages); owner wants to know when strangers find and play it.
- [ ] Amend SPEC section 3 non-goal "No ads, analytics or trackers" to permit client-side analytics — the owner's request for analytics is the approval; no other non-goal changes.
- [ ] Analytics integration: owner suggests "some sort of Google Analytics"; a client-side snippet fits the static Vite build (likely `index.html` / `src/main.ts`), treat it as a suggestion, not a decided implementation. SPEC section 4 requires asking before any runtime dependency — prefer a plain script tag over an npm package.
- [ ] Gameplay telemetry: whether people play, session duration, which questions are shown (question IDs), per-question correct/incorrect counts; natural integration point is the quiz store `src/store/store.ts`.
- [ ] GitHub Pages deploy is already specced (goal 4 "Rendered website", Phase 4 item 2 `deploy.yml`); when picking this up, verify it is live rather than adding new publishing work (no `.github/` workflows exist today).
- [ ] Any analytics script must load async/non-blocking and degrade gracefully offline, so the offline acceptance criteria (Phase 1 item 5, Phase 4 item 4) still pass.
- [ ] Open question: full Google Analytics may be overkill for a friends-first audience; owner to choose vs a lightweight privacy-friendly alternative (GoatCounter / Umami / Plausible).
- Constraints that still apply: no backend, accounts or database (section 3) — analytics must be client-side beacons only; the amendment above is the only non-goal change.

## Items to review and consider (MVP gap analysis — 2026-10-18)

> Snapshot of a brainstorm review; will go stale. File/line evidence verified 2026-10-18 against the then-uncommitted tree — re-verify against the working tree before acting.

### Verdict and MVP frame
- MVP = SPEC phase order with Phase 4.2 pulled ahead of Phase 2: Phase 1 (local questions) → Phase 4.2 (Pages deploy) → Phase 2 quizmaster mode → Phase 4.1 (full PWA) → Phase 3 (explanations UI). Phase 5 last/never for MVP.
- Single change that matters most: land Phase 1 — root dependency of Phases 2–5, deletes the only hard connectivity failure (OpenTDB fetch at game start).
- Close second: minimal GitHub Pages deploy (`deploy.yml` + Vite `base`) so the game reaches a phone.

### Ranked gaps (likelihood × impact; evidence as of 2026-10-18)
| # | Gap | L×I | Evidence (2026-10-18) | Fix |
|---|---|---|---|---|
| 1 | Zero local questions; game dies without internet | H×H | no `questions/` dir; `src/store/store.ts:177-179` fetches opentdb at game start | Phase 1: schema + questionBank; delete all OpenTDB calls (`store.ts:166-184`) |
| 2 | No way to get the game onto a phone | H×H | no `.github/`, no `public/`; `vite.config.ts` has no `base` | Pull Phase 4.2 + minimal 4.1 manifest forward, right after Phase 1 |
| 3 | Multiplayer still upstream's alternating turns | H×H | `store.ts:86-93` `turn = round % 2`; playerOne/playerTwo hardcoded in state + `score()` payload (`store.ts:127`) | Phase 2; quizmaster mode first (no interstitial) |
| 4 | Question supply ≈ one game, not a road trip | H×M | 12 placeholders ÷ 10-question default ≈ 1 game | Owner delivers `questions/sample.json` early (SPEC §5.98) |
| 5 | Hardcoded "10" breaks the question-count option | M×M | `'Score: {score}/10'` in locales; game over at `round === 9` (`store.ts:100`); award messages keyed 0-10 (`GameOverModal.vue:36-48`; `if (score)` hides message.0) | Parameterize inside Phase 1.4 |
| 6 | No wake lock in quizmaster mode | M×M | no wakeLock in `src/` (grep 2026-10-18) | Wake Lock API in Phase 2 (platform API, no new dependency) |

### Missing from the SPEC entirely
- Minimum library size vs trip length (12 placeholders ≈ one 10-question game).
- Interruption recovery: store is memory-only; a call or swipe-away loses the game. ~20 lines to persist `{questions, round, scores}`; or accept the loss.
- Screen wake during quizmaster read-aloud (Wake Lock).
- iOS install specifics: `apple-touch-icon` never named; iOS has no install prompt — manual Share → Add to Home Screen undocumented.
- Count ≠ 10 breakage list: Phase 1.4 adds the option but never enumerates the hardcoded /10 UI it invalidates.
- Loader failure behavior: fetch fail today → stuck loader (moot once Phase 1 deletes the path).

### Deferrable past MVP
- Full PWA polish (Phase 4.1 beyond minimal manifest).
- Explanation UI (Phase 3) — but write `explanation` into placeholder questions NOW; the Phase 1 schema carries it.
- `fr` questions — ship the `lang` field + filter in Phase 1; retrofitting hurts.
- Service-worker tap-to-refresh (Phase 4, `registerType: 'prompt'`).

### Ignore (scope creep)
Accounts, analytics, theming, sound, timers, haptics, landscape (SPEC §4 mandates portrait), favicon polish.
