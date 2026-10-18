# Backlog

## Woozy face 🥴 branding (done)
- [x] `index.html` title, `README.md` heading, `package.json` description, `CHANGELOG.md` Unreleased entry
- [x] `app.title` in `src/locales/index.ts` en + fr → `'Quizzy 🥴'`
- [x] Favicon: `public/favicon.svg` (🥴 emoji SVG), linked from `index.html`; verified in the built `dist/`
- [x] Run vitest suite after the `app.title` change (6/6 passed)

## Trivia phrasing elimination (done — 2026-10-18)
- [x] Sweep executed per the checklist below: en + fr locales (`about.*`, `instructions.body`, `message.1/6/8`), `README.md:3`, `SPEC.md` (title, framing, Trivial Pursuit refs), `package.json:3`, `index.html` meta. Open Trivia DB and Winsome Trivia proper nouns kept; "Quizzy 🥴" untouched.
- [x] vitest 27/27 passed after the sweep; `validate:questions` passes; `npm run build` succeeds.

## Locale reactivity fix (done — 2026-10-18)
- [x] `t()` now uses a reactive active locale (`setLocale` from `src/locales/index.ts`); `store.setSetup` sets it when the Starter language selector changes. Verified in the browser: UI switches fully to French and back; zero console errors.
- [x] Dead award-message keys `message.3/5/7/9` removed from both dictionaries (unreachable via the ratio-based GameOverModal); `message.4` no longer hardcodes "4/10".

## Cross-session note
- Resolved: the concurrent branding/Phase 1 streams are merged into one uncommitted tree (single `CHANGELOG.md` Unreleased section). Nothing committed yet; Phase 2 quizmaster mode is next.
- 2026-10-18 (Phase 2 session): RESOLVED — the 4 unreviewed pending files noted above were consolidated into a single bank `questions/pending/news-2026-10-18.json` (49 questions) and committed separately as `chore(questions)` (457226e), keeping them out of the feature commit.
- 2026-10-18 (Phase 2 session): Phase 2 quizmaster mode implemented in the same uncommitted tree (store players[] 1–6, quizmaster + pass-and-play modes, difficulty weighting, ranking/breakdown, Wake Lock; tests 27→37, build + validate:questions green, CHANGELOG Phase 2 entry added). Nothing committed yet; owner review and commit are next.

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

## Starter screen sequencing (done — 2026-10-18)

> Owner request (2026-10-18): "single and multiplayers are choices. 'start' is an action. language, category, number of questions, all these are choices. So, in the sequence, I would like to first choose the options, and have a clearly differentiated launch button."

- [x] Reordered the Starter template so every choice precedes the launch button: Single/Multiplayer → multiplayer-only choices (mode, players, names, hide choices) → shared choices (weight, language, category, question count) → Start last. Behavior unchanged: same store calls (`selectMode`, `setMultiplayerMode`, `setSetup`, `startGame`), same `v-if="!store.solo"` conditionals. (The choice ordering already matched the target; only the Start button moved from `Starter.vue:12` to the end of the template.)
- [x] Styled Start as the differentiated primary action: scoped `.start` class using `$color-green`, bold 1.5em, full-width (`max-width: none`), hover state kept green so it stays distinct from the `$color-med` choice-button hover; `starter.start` copy unchanged in en + fr.
- [x] Done (2026-10-18, owner request): Single Player / Multiplayer now render side by side in a `.mode-choice` flex row (equal halves, 0.75em gap) instead of stacked; verified at desktop (400px row, 194px buttons) and 320px viewport (147px buttons, no horizontal overflow) in the built app, solo + multiplayer layouts, zero console errors. vitest 38/38, `vue-tsc` + `vite build` green.
- Verified in the built app (vite preview + headless Chromium): solo layout — all choices above Start, Start last, green full-width (rgb(92, 219, 128), 24px bold); multiplayer layout — mode/players/names/toggles blocks above Start, Start still last; launch starts the quizmaster game with zero console errors. vitest 38/38, `vue-tsc` + `vite build` green.

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

## Trivia phrasing elimination (planned — 2026-10-18)

> Owner rationale: "trivia" has a negative connotation — knowledge is rarely trivial. Evidence below verified 2026-10-18 against the working tree — re-verify before pickup.
> Note: evidence line numbers captured mid-refactor on 2026-10-18 — a concurrent session is actively rewriting src/; locale keys are the stable reference, re-verify line numbers on pickup.

- [ ] Sweep user-facing copy and replace "trivia" phrasing with neutral knowledge framing (quiz / question / knowledge), keeping en + fr locales consistent: `README.md`, `SPEC.md`, `CHANGELOG.md`, `package.json`, `index.html`, `src/locales/index.ts`, `src/components/About.vue` (renders `about.heading`/`about.definition`/`about.love` — replacing the dictionary-definition treatment with neutral knowledge framing is the core of this task)

Evidence — every case-insensitive "trivia" occurrence in the repo (2026-10-18), as `file:line — phrase (user-facing | identifier)`:

- `README.md:3` — "A single or multiplayer (local) trivia game" (user-facing)
- `README.md` Credits section (bottom) — original project as starting point/inspiration, new app new direction (user-facing; attribution moved to the bottom 2026-10-18)
- `CHANGELOG.md:9` — "Migrated Winsome Trivia (Vue 2 + Vuex + webpack 2 + node-sass)" (user-facing doc; upstream project name must stay)
- `CHANGELOG.md:12` — "Open Trivia DB calls kept (removed in Phase 1)" (identifier — external API name)
- `package.json:3` — "A single or multiplayer (local) trivia game. Quizzy 🥴 — sounds like queasy." (user-facing; "Quizzy 🥴" brand must stay)
- `index.html:6` — meta description "A single or multiplayer trivia game." (user-facing)
- `SPEC.md:1` — "# Trivia Road Trip: Agent Spec" (user-facing doc title)
- `SPEC.md:3` — "You are building a trivia game … Winsome Trivia" (user-facing doc; upstream project name must stay)
- `SPEC.md:15` — "fetched at game start from the Open Trivia DB API (`opentdb.com/api.php?amount=10`)" (identifier — external API name/URL)
- `SPEC.md:27` — "Local question data: no Open Trivia DB" (identifier — external API name)
- `SPEC.md:38` — "No Open Trivia DB data or API calls." (identifier — external API name)
- `SPEC.md:46` — "credit Christopher Murphy / Winsome Trivia in `README.md`" (identifier — upstream attribution required by SPEC)
- `SPEC.md:83` — "(Trivial Pursuit style six, plus current events.)" (user-facing doc)
- `SPEC.md:118` — "Remove all Open Trivia DB code" (identifier — external API name)
- `SPEC.md:126` — "closer to Trivial Pursuit" (user-facing doc)
- `src/locales/index.ts:5` — "triv·i·a" (`about.heading`, en + fr `:46`) (user-facing; About modal title)
- `src/locales/index.ts:7` — "details, considerations, or pieces of information of little importance or value." (`about.definition`, en; fr `:48` "…de peu d'importance ou de valeur.") (user-facing; About modal dictionary definition)
- `src/locales/index.ts:8` — "I love trivia and I thought that you might too." (`about.love`, en) (user-facing, en)
- `src/locales/index.ts:9` — "Test your trivial knowledge with a trivia quiz. Play against a friend, or challenge yourself." (`instructions.body`, en; fr counterpart already neutral — 'Testez vos connaissances avec un quiz…') (user-facing, en)
- `src/locales/index.ts:32` — "Time to brush up on your trivia game." (`message.1`, en) (user-facing, en)
- `src/locales/index.ts:37` — "…a wealth of trivial knowledge. Just not today." (`message.6`, en) (user-facing, en)
- `src/locales/index.ts:39` — "…on your way to becoming a trivia master." (`message.8`, en) (user-facing, en)
- `src/locales/index.ts:40` — "A regular trivia wiz. Nice work." (`message.9`, en) (user-facing, en)
- `src/locales/index.ts:46` — "triv·i·a" (`about.heading`, fr) (user-facing; About modal title, fr)
- `src/locales/index.ts:49` — "J'adore le trivia et j'ai pensé que vous pourriez l'aimer aussi." (`about.love`, fr) (user-facing, fr)
- `src/locales/index.ts:78` — "…une mine de connaissances triviales. Mais pas aujourd'hui." (`message.6`, fr) (user-facing, fr)
- `src/locales/index.ts:80` — "…en bonne voie de devenir un maître du trivia." (`message.8`, fr) (user-facing, fr)
- `src/locales/index.ts:81` — "Un véritable virtuose du trivia. Beau travail." (`message.9`, fr) (user-facing, fr)
- `src/components/About.vue:3-7` — renders `about.heading` / `about.definition` / `about.love` directly (user-facing render site; no literal "trivia" in the file)
- `src/store/store.ts:174` — "Replaces the Open Trivia DB fetch." (identifier — code comment naming the external API)
- `src/assets/winsome-trivia.png` — filename match; asset unreferenced by any code (identifier — upstream project name)
- No literal occurrences: `questions/sample.json`, `scripts/validate-questions.mjs`, `.github/workflows/deploy.yml`, `src/components/` (except the About.vue render site above — no literal "trivia" text in any component), `src/styles/`, `src/main.ts`, `src/store/store.test.ts`, `src/questions/` (`src/utils/` does not exist)

- [ ] Re-run the vitest suite after copy changes (tests may assert on locale strings)

Constraints that still apply: phrasing/copy only — do NOT rename API identifiers or opentdb URLs, do NOT touch the "Quizzy 🥴" brand title; "trivia" may remain where it names the external API (Open Trivia DB / opentdb.com) or the upstream project (Winsome Trivia) but not in visible copy.

## October 2026 current-events bank (pending review)
- `questions/pending/news-2026-10-18.json` — 49 `origin: "claude"` current-events questions from October 2026 news (sources: CNN, BBC, CBC, lapresse.ca), all `reviewed: false`. Invisible to the build and to `validate:questions` (both read `questions/` non-recursively).
- Owner directive (2026-10-18): use these questions as soon as possible, even though they are not reviewed yet. To make them playable: flip `reviewed: true` after a quick review pass, or relax the reviewed filter in `loadAllQuestions` (`src/questions/questionBank.ts`).
- Known review flag: `news-20261014-29` (Wildlife Photographer of the Year) — photographer/photo attribution needs verification. The rest were verified against source articles during research.
