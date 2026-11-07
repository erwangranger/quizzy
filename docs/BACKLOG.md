# Backlog

Open work only. Finished work lives in `CHANGELOG.md` and git history; the roadmap is SPEC §6.

## Roadmap status (2026-11-06)
- Phases 0–3: done.
- Phase 4: done except a real-device check of 4.4 — after "Add to Home Screen" on iOS Safari, the installed app starts and plays a full game in airplane mode. Not yet recorded as done.
- Phase 5: built (laptop scheduled task, see README "Weekly news questions"). Acceptance is pending: the first "Run now" producing a valid PR (below).

## Phase 5 follow-ups
- One-time setup on the laptop: `brew install gh && gh auth login`, create the `quizzy-news` scheduled task, then "Run now". Not yet done. That first run is the acceptance check. Web search inside a scheduled run is not documented, so confirm it works there.
- GA `question_shown` by category can show whether Recent News earns a weekly batch, or whether a fortnightly cadence is enough.

## Resume follow-ups
- Wake Lock is not re-acquired when the tab is hidden and shown again (affects normal quizmaster games too, not just resumed ones).
- Not yet verified on a device: resume after a real phone call / iOS tab kill, French resume UI.

## Special categories from course materials (idea)
- Feed in `.pdf` files or raw text; an AI generates quiz questions from them so students can check they understood course materials.
- Fits the existing data model: generated questions are `questions/*.json` entries loaded through `questionBank`.
- Same constraint as Phase 5: no AI calls from the client; generation runs offline and is reviewed before merging. Can reuse the Phase 5 recipe pattern (a `.claude/commands/` file + pending/ + promote).

## Custom deck paste/upload (idea — URL half shipped)
- Shipped: `?bank=` URLs (remote, relative, inline base64) + the About quick-launch list — see CHANGELOG "Custom question banks". A deck that can't live at a URL still has no path in.
- Remaining idea: paste or file-upload a `questions/*.json` on the Starter for teacher-handout JSON files.
- Open questions: surface the `ValidationIssue` list for rejected items (custom-bank loading currently drops and logs them silently), and confirm whether custom-category questions fire `question_shown` analytics. (Seen-pool sharing is decided: custom banks share the pool and recency.)

## Flag-this-question button (idea)
- Button on the reveal screen (`Questions.vue`) opens a prefilled GitHub issue: question ID, category, lang, and a reason (wrong answer / stale `as_of` / dead `source_url` / bad explanation).
- Crowdsources the question QA that currently depends on owner playthroughs (the `fix(questions): repair N defects` commit pattern).
- Repo choice to make: issue templates vs. a `?title=&body=` URL builder; users without GitHub copy the prefilled report instead.


## Test coverage gaps (2026-11-07, from the game-over modal regression)
The modal bug (render line dropped from `App.vue` in 0762018, no test caught it) exposed a structural gap: the suite has exactly one component-mount test (`app-game-over.test.ts`, solo happy path). Nothing mounts App at intro, in multiplayer, or mid-reveal, so every conditional render branch is dark. Audit from 2026-11-07 (three read-only passes: render wiring, store actions/getters, persistence/locales/analytics flows):

### P1 — same failure class as the modal bug (render/store-to-DOM wiring, silent breakage)
- `<Intro>` render (`App.vue:22`) — dropped line = blank main at boot; store tests only assert the `currentView` string.
- `<StarPower />` + the `starPower` flag (`GameBoard.vue:8`, `store.starPowerOn` 1.6s timer) — no test touches `starPower` at any level.
- Pass-and-play interstitial (`GameBoard.vue:13-17,36-44`) — the `showInterstitial` computed and Ready→`readyNext()` un-pause are never asserted; a stuck-forever interstitial passes the suite.
- Next button `v-if="showNext"` (`Questions.vue:73`) — dropped = every game dead-ends at question 1 with green tests.
- About panel + menu toggle (`App.vue:5-8,17`, `aboutToggle`) — zero tests at any level.
- GameOverModal multiplayer branch (`GameOverModal.vue:16-34`) — ranking `<ol>`, rank labels, rematch/new-game buttons; the new regression test mounts solo only.
- `<UpdatePrompt>` render (`App.vue:29`) — `promptShow` never true in tests; needs a mocked `onNeedRefresh`.
- Reveal choice classes (`store.styleButtons` → `Questions.vue:14` `:class="choice.classes"`) — zero `.classes` assertions; reveal coloring could silently revert.

### P2 — user-visible, zero coverage
- Saved-game restore completeness: `hiddenChoices`, `poolReset`, and `setup.{lang, categories, difficulty, hideChoices, weightByDifficulty, players}` can be dropped from `writeSavedGame`/`resumeGame` with zero failures — resumed quizmaster games would leak answers on screen; resumed fr games render English. Pin each field in the saved-game describe of `store.test.ts`.
- `src/locales/` has no test file: `t()` param substitution, `categoryLabel` custom-bank branch ("Custom: {bank}"), fr dictionary values. Only compile-time key parity exists.
- Analytics event names + param keys (`game_start`, `game_resume`, `page_view`, `question_shown`, `question_answered`): bare string literals, `event()` swallows all errors — a typo = silent GA4 data loss.
- Resume button (`Starter.vue:4-7`, `v-if="saved"`), pool-reset banner (`Questions.vue:3`), quizmaster hide-choices DOM hinge (`Questions.vue:27-31`), ScoreDots `.correct/.incorrect` classes, wake-lock lifecycle (`requestWakeLock`/`releaseWakeLock`), `categories` getter, reset-seen button → `clearSeenQuestions`, `chooseLang` wiping category selection (`Starter.vue:156-158`), main.ts `?bank=` bootstrap order (second `createPinia()` drops the custom preselect — documented trap).

### P3 — nice-to-have
- Static PWA shell invariants: icon paths in `index.html`/manifest, workbox `globPatterns` must keep `json` (banks are precached offline).
- `index.html:2` hardcodes `lang="en"`; never updates on `setLocale` (accessibility nit).
- `scoreMessage` ratio thresholds; customQuizzes filenames in `About.vue` vs files in `public/`; `peekSavedGame` shape hardening.

**Highest-leverage fix**: one parametrized App-level test — fresh pinia → Intro renders; `startGame` → GameBoard/Questions; 2 players pass-and-play → interstitial; `revealAnswer` → Next; last round → modal (both solo and multiplayer branches); mocked `onNeedRefresh` → UpdatePrompt. Catches most P1s in one file.

## Logic-bank polish (low priority, from the 2026-11-06 50-agent review)
- The review fixed all 27 defects (CHANGELOG, "Logic and reasoning banks"). Left unfixed, in priority order:
- 8 jokes run 9–11 words (guide is ≤8): logic-0011, 0041, 0044 en; logic-fr-0025, 0034, 0035, 0041, 0043.
- Option-prefix inconsistency in ~6 pairs (mixed "The "/bare/"Both"/"His" starts within one choice set): logic-0016, 0027, 0029, 0031, 0035, 0039, 0040.
- Spelled-out numbers vs the digit style in 5 questions (logic-0004, 0020, 0026, 0030, 0045); also "ten to one" spelled out in logic-0016's explanation.
- logic-0003 wastes a distractor slot: first two wrong answers are the same logical claim (the converse), so both fall to one elimination — replace one with a distinct false claim.
- Difficulty calibration: logic-0028 and logic-0045 are labeled 3 but the question text hands over the decisive premise, so 2 fits; logic-0002 opens on a dangling "In her village" with no named character.
- fr phrasing nits across ~15 questions (stiff calques that are still grammatical): "Que suit-il à coup sûr ?" (fr-0006), "dix pour un" for dix contre un (fr-0016), "Une moitié" for Un demi (fr-0019/0026), "Que révèle ce motif ?" (fr-0035), passé simple "furent" (fr-0048), and more in the review transcript.

## Decisions to keep (so they aren't re-proposed)
- No router / URL-per-screen: game state is not URL-addressable (only one saved game, in localStorage) so deep links would dead-end, and a router is a new runtime dependency. Screen analytics use virtual `page_view` events instead (see CHANGELOG "Google Analytics").
- The GA Measurement ID is public and committed in `.env.production`; a Measurement Protocol API secret, if ever needed, must never be committed.
- `Questions.vue` has a scoped bare-`div` card rule that leaks onto any new block `div` inside the card. Reset margin/padding/min-width/border-radius/background explicitly, as `.foot`, `.foot-actions` and `.tally` do.
- Out of scope unless the owner asks: accounts, theming, sound, timers, haptics, landscape (SPEC §4 mandates portrait).
- The pre-loaded demo banks (`public/*.json`: sample, demo, logic en/fr) are intentionally outside `questions/` and uncovered by `validate:questions` — they follow the lenient custom-bank rules (normalization on load), not the shipped-bank schema. Don't move them under the validator without a reason.
- `public/demo-bank.json` content is deliberately trivial (capital of France, 2+2) — it demos the `?bank=` mechanics, not question quality.
