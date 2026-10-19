# Backlog

## Tagline (done — 2026-10-18)
- [x] `instructions.body` en → "Symptoms may include knowledge vertigo." (`src/locales/index.ts:11`); fr → "Symptômes possibles : vertige de la connaissance." (`:66`, French-specific line — the pun doesn't translate). Renders in `Instructions.vue` under the `app.title` "Quizzy 🥴" header.
- [x] Occurrence check: no other files reference the old sentence (only `Instructions.vue:3` consumes the key).

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
- [x] Reveal and Next buttons styled with .start (green primary-action) matching Starter.vue pattern, gated by their original v-if conditions.

## Special categories from course materials (idea)
- Feed in a number of `.pdf` files or raw text; an AI reads it and generates quiz questions from it.
- Purpose: students confirm they understood course materials well enough.
- Fits existing data model: generated questions as `questions/*.json` entries (`id`, `lang`, …) loaded through the `questionBank` module.
- Constraints that still apply: no AI API calls from the client app (generation happens offline in a pipeline, results are reviewed before merging — same shape as Phase 5).

## Play analytics (done — 2026-10-19)

> Owner request (2026-10-19): "add to backlog, I want to add Google Analytics so I can tell how many people are using the app."

- [x] Awareness goal met: usage counts via GA4 `game_start` (mode, players, question count) — fires on every launch, Starter or game-over rematch, so every play session counts, including strangers finding the public GitHub Pages site.
- [x] SPEC section 3 non-goal amended to "No ads or trackers. Client-side Google Analytics is permitted (amended 2026-10-19, owner approval): usage counts, question IDs shown, and per-question correct/incorrect counts only" — the only non-goal change.
- [x] Integration: Google Analytics (owner decision) via a client-side gtag snippet in `src/analytics.ts` — the async `googletagmanager.com/gtag/js` script + `dataLayer` bootstrap, injected on the first `game_start` (never before), no npm dependency per SPEC section 4. `src/main.ts` imports the module; `vite.config.ts` untouched.
- [x] Gameplay telemetry: `question_shown` (question ID + category, every round presented) and `question_answered` per player (question ID, correct/incorrect, mode, player name) from `src/store/store.ts` (`trackQuestionShown()` on start + every `incrementRound()`, event in `score()`); session duration is GA4-automatic. Skipped rounds never fire `question_answered`.
- [x] GitHub Pages deploy verified live (https://erwangranger.github.io/quizzy/ returns 200); `.github/workflows/deploy.yml` exists and builds on push to `main` — the backlog line "no .github/ workflows exist today" was stale.
- [x] Async/non-blocking and offline-safe: no-ID build injects nothing and makes no network requests (offline acceptance criteria keep passing); blocked scripts/offline failures are swallowed — analytics can never break the game.
- [x] Measurement ID provided (2026-10-19): `G-RNWDDHKDL5` in committed `.env.production` (`VITE_GA_MEASUREMENT_ID`, read natively via `import.meta.env` — a Vite `define` reading `process.env` would NOT pick up .env files and was removed). ID is a public identifier, safe to commit; the Measurement Protocol API secret (if ever needed) must never be committed.
- [x] Virtual `page_view` per in-app screen (2026-10-19, owner request "for better GA tracking… better bookmarking"): screen-transition pageviews in GA4 page reports — how far visitors get — without the router/URL-change/History-pollution the owner floated (rejected: state is memory-only so deep links dead-end, and a router is a new runtime dependency). Watchers in `App.vue` fire `page_view` for `app-intro` ↔ `app-game-board` and `game-over`; SPEC §3 telemetry clause widened to "gameplay and screen-transition events".
- [x] Verified: `vue-tsc -b` + vitest 48/48 + build green; no-ID build has zero gtag references in the bundle; headless Chromium — script injected on Start with the ID, `game_start`/`question_shown`/`question_answered` observed in `dataLayer`, skip adds no answer event, second launch fires a second `game_start`, zero console errors.

## Skip questions and leave mid-game (done — 2026-10-18)

> Owner request (2026-10-18): "during gameplay, allow to skip, for example if that's a question we've seen before. also allow to navigate back to the main menu."

- [x] `skipRound()` in `src/store/store.ts`: records nothing (no history row, no points) and advances the round; skipping the last question ends the game (same game-over handling as `next()`).
- [x] Skipped questions excluded from totals (`answeredTotal` getter, owner request 2026-10-18: "questions that are skipped should not be counted in the total"): game-over "Score: {score}/{total}" and per-player "{correct}/{total} correct" use rounds actually played — answer 7 of 10 with 3 skipped reads 7/7; the solo award-message ratio follows played rounds. ScoreDots size to `answeredTotal` (skipped questions show no dot); zero-point answered rounds still count (quizmaster unmarked players).
- [x] Category attribution survives skips: `ScoreHistory.category` is stamped at score time from the drawn question, and `categoryBreakdown` counts the stamped category (was: history index → `questions[i]`, which misattributed post-skip answers to the skipped question's category). Test: answer ✓, skip, answer ✓ → credited to the answered questions' categories; skipped category absent.
- [x] Skip button in `src/components/Questions.vue` (`questions.skip`, en + fr "Passer"): shown while the round is unanswered (hidden at the reveal; absent between pass-and-play turns since the interstitial covers the board). Closes the About menu if open, like Next and Start.
- [x] Main Menu button (`questions.menu`, en + fr "Menu principal") below Skip: `resetGame()` + `newGame()` returns to the Starter screen at any point — the same reset path as game-over New Game (clears a stale paused/revealed state and releases the quizmaster Wake Lock); in-game scores are not persisted.
- [x] Both styled as quiet secondary actions (transparent, white border, `$color-alt-dark` hover) distinct from the primary choice buttons.
- [x] Verified: vitest 46/46 (skip tests: no history row + advance, last-question game over, pass-and-play + quizmaster skip, `answeredTotal` excludes skips (answer-skip-answer = 2 of 2), all-skip game, dots follow played rounds, post-skip category attribution), `vue-tsc -b` + `vite build` green, headless Chromium smoke on the built app — 10-question games: 1 answered + 9 skipped reads "Score: 1/1" with 1 dot; 2 answered-wrong + 8 skipped reads "Score: 0/2" with 2 dots and an empty breakdown (wrong answers never appear); zero console errors.

## Action-button look & feel (done — 2026-10-19)

> Owner request (2026-10-19): "the 'skip' and 'reveal' buttons still look too much like the potential answers to the questions. They should have a different scheme. Create a new file where you show me 5 examples of look and feel and I'll pick the one I like best." Owner pick: **scheme 5 (footer strip inside the card)** with an extension — the reveal panel also sits below the hairline, so *everything that is not an answer* lives in the footer.

- [x] Mockup: `docs/design/action-buttons-mockup.html` — 5 static schemes for the Questions-screen action cluster (Reveal, Skip, Next, Main Menu), each shown inside a mini question card against the answer pills they had to stop resembling. Reference card corrected to match the real `.menu` geometry (12px radius, 1em) before the owner judged. Now archived with a chosen-scheme header comment.
- [x] Port into `src/components/Questions.vue` (scoped styles only): template restructured into a `.foot` strip below a `1px rgba(255,255,255,.25)` hairline — the reveal panel (correct answer, explanation, source link, as-of badge, quizmaster marks / pass-and-play choices) and a `.foot-actions` row (Skip, Main Menu as quiet `.text-btn` text actions, opacity .75 / 0.85em; Reveal, Next as compact green `.primary`, 10px radius, 0.95em bold, right-aligned). Dead styles deleted: `.menu`, `.skip`, `.start` (the Starter's separate `.start` in Starter.vue is untouched). Locale copy unchanged.
- [x] Nothing above the hairline but answers: the category heading, question text, and answer pills stay in the card's center column; `.foot` has `border-radius: 0` so the hairline runs straight, and no `width` declaration (a plain block div is full-width — `width: 100%` + 32px horizontal padding overflowed the card by 16px on desktop).
- [x] Bare-`div` leak reset: the scoped `div { padding: 1em 1em 2.5em; margin-bottom: 2em; min-width: 320px; border-radius: 25px }` rule also matches `.foot`/`.foot-actions`, so both reset it explicitly (`margin: 1.2em 0 0` / `margin: 0`, `padding` set in full, `min-width: 0`, `border-radius: 0`); `.text-btn` gets `min-height: 44px` for touch parity with the quizmaster mark buttons. Caught via the browser read of leaked computed styles (`.foot` had inherited `margin-bottom: 2em` / card padding before the reset).
- [x] Card bottom padding trimmed to the mockup's scheme: the card rule is now `padding: 1em 1em .5em` (`Questions.vue:133`; 600px media `.25em 1em .5em`) — the pre-trim ~40px desktop / ~24px mobile of dead blue space between the footer actions and the card edge measures 8px / 7px; dead `.spacer` span removed (right-alignment comes from `.primary { margin: 0 0 0 auto }`).
- Evidence before (2026-10-19): Skip rendered pixel-identical to the answer pills — the template button carried no class, so it fell through to the global white 190px-radius pill (`src/main.scss:70`); Reveal/Next reused `.start` (green, bold 1.5em, full-width, same pill shape and column as the choices).
- [x] Verified: `vue-tsc -b` + `vite build` green, vitest 48/48; headless Chromium on the built app — solo: hairline below the last answer pill, Skip "42px" and Main Menu "85px" text actions (44px touch height) vs 400px white answer pills, Reveal/Next compact green 81px buttons right-aligned to the card edge, `.foot` min-width 0 / radius 0 / no bottom margin, card padding trimmed (`1em 1em .5em`; 8px card-edge-to-actions desktop, 7px at 320px); answer → reveal renders the panel inside `.foot` with Source link and Next, Skip hidden at reveal; Next → advance, Skip → advance (no history row, `answeredTotal` 1); Main Menu returns to the Starter; quizmaster: pre-reveal Reveal button in the footer, reveal → "Who was right?" marks inside `.foot`, mark + Next scores Player 1 (total 1, category-stamped history row); zero console errors; 320px viewport — no horizontal overflow (320/320), footer actions wrap.

## Per-player score tally during gameplay (done — 2026-10-19)

> Owner request (2026-10-19): "keep a tally/score for each player visible at the bottom when going to the next question."

- [x] Persistent tally on the Questions screen: each player's running score visible at the bottom while advancing between questions (solo = one tally; quizmaster + pass-and-play = one entry per player). Rendered as a `.tally` block in the `Questions.vue` `.foot` strip (below the reveal panel, above the actions row), visible at all times during gameplay — entries read "Name: N pts" via the existing `gameover.points` locale key (en + fr "pts"), no new dictionary entries.
- [x] Data unchanged — UI-only change as expected: per-player `score.total` lives in `Player` state (`src/store/store.ts:24`, seeded at `:110`); the tally reads `store.players[i].score.total` directly. `ranking` and the game-over breakdown untouched.
- [x] Footer-strip constraints respected: the tally sits inside `.foot` as a plain block above the 44px `.text-btn` actions and the compact green Reveal/Next. The scoped bare-`div` card rule (`Questions.vue:136` — blue background, 25px radius, `margin-bottom: 2em`, `padding: 1em 1em .5em`, `min-width: 320px`) matched `.tally` itself — `.foot`'s resets did not cover it — so `.tally` resets it explicitly (`margin: 1em 0 0`, `padding: 0`, `min-width: 0`, `border-radius: 0`, `background: transparent`), same treatment as `.foot`/`.foot-actions`. Caught via the browser read of leaked computed styles (`.tally` had inherited `padding: 16px 16px 8px` / `margin-bottom: 32px` / `min-width: 320px` before the reset); verified clean at desktop and 320px after.
- [x] Skipped rounds add no points (`skipRound()` records nothing) — the tally does not move on a skip; game-over totals use `answeredTotal` as before.

## Starter screen sequencing (done — 2026-10-18)

> Owner request (2026-10-18): "single and multiplayers are choices. 'start' is an action. language, category, number of questions, all these are choices. So, in the sequence, I would like to first choose the options, and have a clearly differentiated launch button."

- [x] Reordered the Starter template so every choice precedes the launch button: Single/Multiplayer → multiplayer-only choices (mode, players, names, hide choices) → shared choices (weight, language, category, question count) → Start last. Behavior unchanged: same store calls (`selectMode`, `setMultiplayerMode`, `setSetup`, `startGame`), same `v-if="!store.solo"` conditionals. (The choice ordering already matched the target; only the Start button moved from `Starter.vue:12` to the end of the template.)
- [x] Styled Start as the differentiated primary action: scoped `.start` class using `$color-green`, bold 1.5em, full-width (`max-width: none`), hover state kept green so it stays distinct from the `$color-med` choice-button hover; `starter.start` copy unchanged in en + fr.
- [x] Done (2026-10-18, owner request): Single Player / Multiplayer now render side by side in a `.mode-choice` flex row (equal halves, 0.75em gap) instead of stacked; verified at desktop (400px row, 194px buttons) and 320px viewport (147px buttons, no horizontal overflow) in the built app, solo + multiplayer layouts, zero console errors. vitest 38/38, `vue-tsc` + `vite build` green.
- Verified in the built app (vite preview + headless Chromium): solo layout — all choices above Start, Start last, green full-width (rgb(92, 219, 128), 24px bold); multiplayer layout — mode/players/names/toggles blocks above Start, Start still last; launch starts the quizmaster game with zero console errors. vitest 38/38, `vue-tsc` + `vite build` green.

## Phase 3: Explanations UI (done — 2026-10-18)

> SPEC §6 Phase 3: the reveal screen shows the correct answer, the explanation, a Source link (new tab) when present, and "As of" for date-anchored questions; readable at 375px.

- [x] Source link in the `src/components/Questions.vue` reveal block: `reveal.source` (en + fr "Source") rendered as an underlined link (`target="_blank" rel="noopener noreferrer"`) when `currentQuestion.source_url` is set; absent otherwise (the field is nullable).
- [x] "As of" date badge: `reveal.asOf` (en "As of {date}" / fr "Le {date}") under the explanation when `currentQuestion.as_of` is set.
- [x] No store/schema changes: `source_url` and `as_of` already existed; the reveal block is shared by all modes, so the explanation shows whether or not players got it right (unchanged behavior).
- [x] Styles: `.as-of-badge` (block, 0.75em, `$color-med`) and `.source-link` (inline-block, underline, 0.9em, `$color-green`).
- [x] Verified: vitest 46/46, `vue-tsc -b` + build green; headless Chromium at 375px (Recent News question; longest bank explanation is 270 chars): badge and link render without collisions, reveal fits without horizontal overflow (scrollWidth 375), zero console errors; French strings verified end-to-end ("Explication", "Source", "Le 2026-10-18").
- Product gap (not a UI bug): all 61 bank questions were `lang: "en"` — with the UI locale set to French the category list was empty and Start silently did nothing. RESOLVED (2026-10-18): all 61 questions translated to French (`questions/fr-sample.json` + `questions/fr-recent-news.json`, 122 total across the 4 banks); validators accept French date anchors; the language toggle now swaps banks. See CHANGELOG "French question banks".


## French question banks (done — 2026-10-18)

- [x] All 61 questions translated en → fr via 10 parallel sub-agents (1 sample + 9 news chunks): `questions/fr-sample.json` (12, `origin: "human"`, IDs `geo-fr-0001` style matching `HUMAN_ID`) and `questions/fr-recent-news.json` (49, `origin: "claude"`, IDs `news-<date>-<61+>` — same date as the source, fresh sequence; en bank max nn is 50 so 61+ never collides; every date had ≥49 headroom).
- [x] Validator fix required for the fr news bank: the `MONTH_YEAR` regex (src/questions/schema.ts:50, scripts/validate-questions.mjs:34) was English-months-only — extended to janvier–décembre; SPEC.md field rule updated.
- [x] Tests updated for the 122-question world: bank-size test (122 = 61 en + 61 fr), `getCategories('fr')` mirrors en (7 categories), per-language pool cap, fr draw test (`fr` + `recent-news` → 5, all `news-` ids), unknown-language test moved from `'fr'` (now a real bank) to `'zz' as Lang`. Suite 48/48.
- [x] QC: `validate:questions` 122/122 across 4 files, zero errors; no duplicate joke answers within the fr banks (Whoville/Bouillabafoufou dupes are en↔fr pairs, fine); no double quotes in any fr string; explanations ≤400 chars with no period-abbreviations (sentence-split safe).
- [x] Verified: `vue-tsc -b` + vite build green (bundle carries 49 "En octobre 2026" questions + 61 `lang:"fr"` objects); headless Chromium — fr toggle renders fr UI with 7 category chips; solo game draws 10 questions all `lang: "fr"` (verified via pinia state after the headless renderer froze mid-transition); correct answer records a category-stamped history row, answer-wrong-next leaves `answeredTotal` 2 and total 1; en bank still draws en-only.

## Items to review and consider (MVP gap analysis — 2026-10-18)

> Snapshot of a brainstorm review; will go stale. File/line evidence verified 2026-10-18 against the then-uncommitted tree — re-verify against the working tree before acting.

### Verdict and MVP frame
- MVP = SPEC phase order with Phase 4.2 pulled ahead of Phase 2: Phase 1 (local questions) → Phase 4.2 (Pages deploy) → Phase 2 quizmaster mode → Phase 4.1 (full PWA) → Phase 3 (explanations UI). Phase 5 last/never for MVP.
- Single change that matters most: land Phase 1 — root dependency of Phases 2–5, deletes the only hard connectivity failure (OpenTDB fetch at game start).
- Close second: minimal GitHub Pages deploy (`deploy.yml` + Vite `base`) so the game reaches a phone.
- Phase 4 (full PWA): done (2026-10-18). Installed `vite-plugin-pwa`, workbox-precaching; manifest.webmanifest with icons, service worker, Apple meta tags in index.html; `usePwaUpdate.ts` composable + `UpdatePrompt.vue` component integrated in App.vue with en+fr locale keys. Registration via the plugin's canonical `registerSW` from `virtual:pwa-register` with `registerType: 'prompt'` (`injectRegister: null`; the original `new Workbox('/service-worker.js')` pointed at a file the plugin doesn't emit and 404'd under the Pages subpath, and `autoUpdate` silently reloads on update instead of prompting); `workbox-window` removed. Verified: vue-tsc -b clean, vitest 46/46, build green, `dist/sw.js` generated, live SW-update smoke: the prompt appears on a second visit after the worker changes, Refresh activates the waiting worker and reloads.

### Ranked gaps (likelihood × impact; evidence as of 2026-10-18)
| # | Gap | L×I | Evidence (2026-10-18) | Fix |
|---|---|---|---|---|
| 1 | Zero local questions; game dies without internet | H×H | no `questions/` dir; `src/store/store.ts:177-179` fetches opentdb at game start | Phase 1: schema + questionBank; delete all OpenTDB calls (`store.ts:166-184`) |
| 2 | No way to get the game onto a phone | H×H | no `.github/`, no `public/`; `vite.config.ts` has no `base` | Pull Phase 4.2 + minimal 4.1 manifest forward, right after Phase 1 |
| 3 | Multiplayer still upstream's alternating turns | H×H | `store.ts:86-93` `turn = round % 2`; playerOne/playerTwo hardcoded in state + `score()` payload (`store.ts:127`) | Phase 2; quizmaster mode first (no interstitial) |
| 4 | Question supply ≈ one game, not a road trip | H×M | 12 placeholders ÷ 10-question default ≈ 1 game | Owner delivers `questions/sample.json` early (SPEC §5.98) |
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
- Explanation UI (Phase 3) — done 2026-10-18 (see section above); placeholder questions have carried `explanation` since Phase 1.
- `fr` questions — ship the `lang` field + filter in Phase 1; retrofitting hurts.
- Service-worker tap-to-refresh (Phase 4, `registerType: 'prompt'`).

### Ignore (scope creep)
Accounts, analytics, theming, sound, timers, haptics, landscape (SPEC §4 mandates portrait), favicon polish.

## Trivia phrasing elimination (done — 2026-10-19)

> Note: evidence line numbers below were captured mid-refactor on 2026-10-18; the sweep landed across the Phase 1 follow-up commits plus this session's About rework.

- [x] Sweep user-facing copy and replace "trivia" phrasing with neutral knowledge framing (quiz / question / knowledge), keeping en + fr locales consistent: `README.md`, `SPEC.md`, `CHANGELOG.md`, `package.json`, `index.html`, `src/locales/index.ts`, `src/components/About.vue` (renders `about.heading`/`about.definition`/`about.love` — replacing the dictionary-definition treatment with neutral knowledge framing is the core of this task)
  - Done 2026-10-19: the About panel rework was the last user-facing piece. `grep -in "trivia|trivial"` across README, package.json, index.html, SPEC.md, src/locales/index.ts, src/components/About.vue now matches only the upstream proper nouns "Winsome Trivia" / "open-trivia-app" (kept deliberately, attribution + URL).

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
