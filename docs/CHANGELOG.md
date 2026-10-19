# Changelog

## Unreleased — General knowledge banks

- 200 new questions across the six classic categories (geography 40, history 40, science 32, arts & literature 32, entertainment 28, sports & leisure 28): 100 evergreen topics, each with an English question in `questions/sample.json` and a natural French translation in `questions/fr-sample.json` (IDs `geo-0003`+ / `geo-fr-0003`+ style, same number per pair). Generated, not human-verified — the owner asked for them in the app even unreviewed, so they ship with `origin: "claude"`, `reviewed: true`. Difficulty mix roughly half 1 / third 2 / rest 3; 5-choice sets with a chuckle-worthy 5th answer; joke answers deduplicated within each language across all four banks, and one French-leaked joke in the en bank (`ente-0015`) plus its answer-alias fr pair fixed in review.
- Validators now accept claude-origin general knowledge: the id rule in `src/questions/schema.ts` and `scripts/validate-questions.mjs` allows `<category-prefix>-<4 digits>` for `origin: "claude"` (previously only the `news-YYYYMMDD-<nn>` pipeline format); `news-` ids stay reserved for the news pipeline. `SPEC.md` id row updated; `schema.test.ts` pins the new acceptance.
- Bank-growth-proofed pool tests: the load test pins the new totals (322 reviewed, 161 per language); the draw / pool-reset tests derive pool sizes from `loadAllQuestions()` instead of the hard-coded 61, so future bank growth no longer breaks them.
- Every generated question fact-checked and sourced (8 parallel review agents, one verification per en/fr pair): all 200 now carry a confirmed Wikipedia `source_url` — fact-specific articles, not topic pages. Review caught 4 factual defects, fixed in both languages: `spor-0016`'s answer corrected to Miguel Induráin (Merckx won five Tours total, never five straight), `spor-0007`'s "biennial" reworded to "quadrennial" plus South Africa's 4th Rugby World Cup title (2023), `spor-0014`'s stale Norway medal counts updated (166 golds / 447 total after Milan Cortina 2026), and `ente-0016`'s outdated box-office claim (Demon Slayer overtook Spirited Away in 2020). Two judgment fixes: `scie-0008`'s joke was an answer alias ("The rusty one next door" describes Mars — replaced both languages), and `spor-0005`'s blackjack name-origin softened to the debated claim. Store category-breakdown test de-flaked: a 12-of-112 draw can contain zero science questions, so the breakdown assertion treats an absent key as 0.
- Review coverage completed to the full bank: the 98 recent-news questions (49 en/fr pairs) fact-checked against their linked articles — every `correct_answer` confirmed by its source, zero defects, and the `news-20261014-29` Wildlife Photographer flag verified resolved (CBC: Federico Veronesi's "The Aftermath", a mother elephant) — and the 12 human originals verified (12/12 ok, fr pairs state the same facts). `geo-0004`'s Nile length claim softened to note recent measurements (~7,000 km) beside the traditional 6,650 km figure. Every one of the 322 questions now carries a reviewed `source_url`.

## Unreleased — Category cleanup

- `current-events` collapsed out of the data model — the enum slug was dead (zero questions in any bank, no label key; the shipped category is and has been `recent-news`). `Category` and `CATEGORIES` in `src/questions/schema.ts` now carry 7 members; the source/`as_of`/date-anchor rules in `schema.ts` and `scripts/validate-questions.mjs` key on `recent-news` alone. Behavior-preserving: every bank file, UI label, test and GA `question_shown` event already used `recent-news`, so GA category history stays continuous. `schema.test.ts` fixtures flipped; `vue-tsc` + vitest + `validate:questions` green.

## Unreleased — Google Analytics

- Client-side GA4 via the canonical gtag snippet (`src/analytics.ts`, no npm dependency): the async `googletagmanager.com/gtag/js` script plus the `dataLayer` bootstrap, injected on the first game start — never before, so nothing loads until someone actually plays. Measurement ID read at build time from `.env.production` (`VITE_GA_MEASUREMENT_ID=G-RNWDDHKDL5`, committed per owner decision — the ID is a public identifier, not a credential); a build without the ID injects nothing and makes no network requests, so the offline acceptance criteria keep passing.
- Virtual `page_view` events on screen transitions: one per in-app screen (`app-intro` ↔ `app-game-board` via a `currentView` watcher in `App.vue`, plus `game-over` when the modal opens). No URL change, no history entries, no router — the event's `page_location` carries a fictional absolute path (`…/app-game-board`), which is what GA4's Pages dimension (`page_path`) reads: a `#fragment` would be stripped and every screen would collapse to one path. Verified: `vue-tsc -b` + vitest 48/48 + build green; headless Chromium — page_view fires for intro→board, game-over, and back-to-menu with absolute path page_location and the browser URL untouched; no duplicate page_view for the initial load (gtag bootstraps on the first game_start).

## Unreleased — Per-player score tally

- Each player's running score is now visible at the bottom of the Questions screen while advancing between questions: a `.tally` block in the footer strip (below the reveal panel, above the Skip / Main Menu / Reveal / Next actions) showing one "Name: N pts" entry per player — one entry in solo, one per player in quizmaster and pass-and-play. Entries update when a round is scored (Next) and never move on a skip (`skipRound()` records nothing). Owner request: "keep a tally/score for each player visible at the bottom when going to the next question."
- UI-only change in `src/components/Questions.vue` (template + scoped styles); reads `store.players[i].score.total` directly, no store changes, reuses the existing `gameover.points` locale key so no dictionary edits. `.tally` resets the component's scoped bare-`div` card rule explicitly (margin/padding/min-width/border-radius/background — the rule matched the new block like it matches `.foot`/`.foot-actions`). Verified: `vue-tsc -b` + build green, vitest 48/48, headless Chromium — tally renders for solo (1 entry) and quizmaster (per-player), updates after Next, static on Skip, no overflow at 320px.

## Unreleased — About panel rework

- The corner menu now opens a useful panel instead of a dictionary treatment: it shows the app version (injected at build time as `__APP_VERSION__` from `package.json` via a Vite `define`), a "Source on GitHub" link (github.com/erwangranger/quizzy), a "Report an issue" link (issues/new), and a one-line credit to the upstream Winsome Trivia fork. Version, copy and layout, no explanation, no "I love learning".
- All links open in a new tab (`target="_blank" rel="noopener noreferrer"`) and reuse the existing `.link-light` hover-underline style. `about.heading/partOfSpeech/definition/love` keys removed from both locale dictionaries; `about.source/issues/creditLead/creditName` added (en + fr).
- Component: `src/components/About.vue` rebuilt. Vite config: `vite.config.ts` gains the version `define` (only config change). Verified: `vue-tsc -b` + build green, vitest 48/48, headless Chromium — panel opens/toggles cleanly with version `v0.1.0` and all three hrefs correct, fr locale renders « Source sur GitHub / Signaler un problème », 320px viewport has no horizontal overflow, zero console errors.

## Unreleased — Question actions in a footer strip

- The Questions screen separates answers from actions: everything that is not an answer (the reveal panel — correct answer, explanation, Source link, "As of" badge, quizmaster marks or pass-and-play choices — plus the Skip / Main Menu / Reveal / Next actions) now lives in a footer strip below a hairline at the bottom of the question card, so no action resembles the answer buttons above it.
- Skip and Main Menu are quiet text actions (small, transparent, 75% opacity); Reveal and Next are the compact green primary button, right-aligned in the strip. Previously Skip was pixel-identical to the answer pills (it inherited the global white button style) and Reveal/Next reused the big green launch pill.
- Component-level change in `src/components/Questions.vue` (template restructure + scoped styles; the `.menu`/`.skip`/`.start` classes in this file were removed). Locale strings and store behavior unchanged; all flows verified in the browser (solo, quizmaster, 320px viewport, zero console errors).

## Unreleased — French question banks

- All 61 questions translated to French so French speakers can play: new `questions/fr-sample.json` (12, `origin: "human"`, IDs `geo-fr-0001` style) and `questions/fr-recent-news.json` (49, `origin: "claude"`, IDs `news-<date>-<61+>` — same date, fresh sequence, no collision with the en bank's max nn 50). Questions, choices, explanations and joke answers fully translated (jokes keep landing: « Un parking très humide », « Le 32 novembre, forcément un mardi », « Un orignal avec une raquette »); `source_url`, `as_of`, `category`, `difficulty` unchanged; French month name in the news anchor ("En octobre 2026, ...").
- Validators now accept French date anchors: the `MONTH_YEAR` regex in `src/questions/schema.ts` and `scripts/validate-questions.mjs` matches English and French month names (janvier–décembre); `SPEC.md` field rule updated.
- The language toggle on the Starter screen (en/fr) now actually swaps banks: `drawQuestions` filters by `lang`, `getCategories('fr')` returns the same 7 categories, and the store's locale switches with it. Unknown-language test switched from `'fr'` (now a real bank) to a `'zz'` cast.
- QC: `validate:questions` 122/122 across 4 files; no duplicate joke answers within the fr banks; vitest 48/48 (bank-size 122, fr categories, per-language pool cap, fr draw test); `vue-tsc -b` + build green; headless Chromium — fr toggle renders the fr UI (« Commencer », « Choisir une catégorie ») with 7 category chips; solo game draws 10 questions all `lang: "fr"`, correct answer recorded (category-stamped history row, `answeredTotal` 2 after an answer-wrong-next), game-over totals unchanged.
- Category chips now show localized names instead of raw slugs: `category.geography/history/science/arts-literature/entertainment/sports-leisure` keys added to both locale dictionaries (`src/locales/index.ts`; en "Arts & Literature" / fr "Arts et littérature" etc.) — previously only `recent-news` was localized, so 6 English slugs rendered in fr mode (and raw slugs in en mode). Chips still select by slug; verified en + fr chips in the browser.

- `instructions.body` (en + fr) replaced "Test your knowledge with a quiz. Play against a friend, or challenge yourself." with "Symptoms may include knowledge vertigo." (fr "Symptômes possibles : vertige de la connaissance.") — plays off the 🥴 branding; renders on the intro screen above the Starter.

## Unreleased — Phase 3: Explanations

- The reveal screen now shows a "Source" link when the drawn question has a `source_url` (`reveal.source`, en + fr "Source"): opens in a new tab (`target="_blank" rel="noopener noreferrer"`), styled as a small underlined link below the explanation. Hidden cleanly when the field is null.
- Date-anchored questions show their anchor: an "As of {date}" badge (`reveal.asOf`, en "As of {date}" / fr "Le {date}") renders under the explanation whenever `as_of` is set.
- Both render in every mode (solo, pass-and-play, quizmaster) since the reveal block is shared; the explanation continues to show whether or not players got it right. No store or schema changes — `source_url` and `as_of` already existed on the question model.
- Verified: vitest 46/46, `vue-tsc -b` + build green; headless Chromium at 375px on a Recent News question — badge and link render without overlap, no horizontal overflow (scrollWidth 375), zero console errors; French strings verified ("Explication", "Source", "Le 2026-10-18").

## Unreleased — Five-way choices with a joke answer

- Every question now shows 5 choices: the 3 plausible wrong answers plus a new 4th obviously-wrong joke answer meant to earn a chuckle (all 61 questions across `questions/sample.json` and `questions/recent-news.json`).
- Data model: `incorrect_answers` widened from `string[3]` to `string[4]` — exactly 4 items (3 plausible + 1 joke) — in `src/questions/schema.ts`; the Phase 1 validator and `scripts/validate-questions.mjs` enforce the new count, and `SPEC.md` field rules now document it.
- Unit tests updated to the new shape: schema fixtures carry 4 items, the store test asserts shuffled 5-way choices.

## Unreleased — Phase 4: PWA + GitHub Pages deployment

- Full PWA support via `vite-plugin-pwa`: `manifest.webmanifest` with app name, icon entries (192px + 512px PNG), `display: standalone`, `orientation: portrait`, `start_url: ./`; precaching for HTML/JS/CSS/SVG/JSON/woff2; Google Fonts runtime caching.
- Installable PWA icons: `public/icons/icon-192.png` and `icon-512.png` (192px and 512px PNG, 🥴 emoji on dark background, maskable).
- Apple-specific meta tags in `index.html`: `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `apple-touch-icon`, `manifest.webmanifest` link.
- Service Worker: `dist/sw.js` generated by workbox-precaching; registered by the app via `registerSW` from `virtual:pwa-register` with `registerType: 'prompt'` (`injectRegister: null` keeps the plugin from double-registering). A new worker waits; the prompt's Refresh activates it via `updateSW(true)` (skipWaiting message — a plain reload would leave it waiting forever). Fixed: the original manual `new Workbox('/service-worker.js')` pointed at a file the plugin doesn't emit, root-absolute so it 404'd under the GitHub Pages subpath, and under `autoUpdate` an update silently reloaded the page mid-game — `onNeedRefresh` never fires in that mode. `workbox-window` removed from devDependencies.
- "New version available" prompt: `src/composables/usePwaUpdate.ts` composable (fires via `registerSW`'s `onNeedRefresh` when a worker is waiting; Refresh calls `updateSW(true)`), `src/components/UpdatePrompt.vue` (dismissible notification banner with fade animation), integrated in `App.vue`, which owns the reload (controllerchange or ~3s fallback — the generated worker has no clientsClaim, so the plugin's own controlling-reload never fires on the open page). Locale keys `update.prompt` and `update.refresh` in en + fr dictionaries.

## Unreleased — Skip questions and leave mid-game

- Skip button during gameplay (all modes): "Skip" (`questions.skip`, en + fr "Passer") advances to the next question with no answers, no points, and no history row — for questions players have seen before. Skipped questions are excluded from the game-over total (`answeredTotal` getter counts rounds actually played): answer 7 of 10 with 3 skipped reads "Score: 7/7", not "7/10", and the award-message ratio follows the played rounds. Score dots shrink to the played rounds (one dot per answered question; skipped questions show no dot). Skipping the last question ends the game. Hidden at the reveal (Next owns that state); not shown between pass-and-play turns.
- Category attribution survives skips: every history row is stamped with the drawn question's category at score time (`ScoreHistory.category`), and the category breakdown counts the stamped category instead of assuming history index = question index — a correct answer after a skipped round is credited to its own category, not the skipped one (game-over breakdown lines).
- Main Menu button below Skip ("Main Menu", en + fr "Menu principal"): leaves the game and returns to the Starter screen at any point (`resetGame()` + `newGame()`, the same reset path as game-over New Game — releases the quizmaster Wake Lock and clears stale paused/revealed state; scores are not persisted). Both are styled as quiet secondary actions (transparent with white border) next to the primary choice buttons.
- Unit tests 38 → 46: skip advances with no history row and no score, skip on the last question ends the game, skip in pass-and-play and quizmaster modes, `answeredTotal` excludes skipped rounds (answer-skip-answer = 2 of 2), all-skip game scores 0 with an empty history, skipped questions shrink the dots, post-skip correct answers credit their own category (skipped category absent from the breakdown).

## Unreleased — Phase 2: Every player answers every question

- Every player answers every question: `scores.playerOne`/`playerTwo` replaced with a `players` array (1–6), each with an editable name persisted in `localStorage` (`quizzy.player-names`, try/catch-wrapped like the seen-question pool; defaults localize via `player.default`).
- Quizmaster mode (default for multiplayer): the phone shows the question; a "Reveal" button shows the correct answer and explanation, a row of player-name toggles marks who was right, and "Next" scores the marked players and advances. Setup toggle "Hide Choices" hides the multiple-choice options until reveal for open-answer play.
- Pass-and-play: each player taps their answer privately; between players a full-screen interstitial shows "Pass to {name}" with a "Ready" button so the next player cannot see the previous answer. Solo keeps the pass-and-play behavior with one player and no interstitial.
- Scoring: 1 point per correct answer, with a "Weight by Difficulty" setup toggle (1/2/3 points from the drawn question's difficulty) applied in every mode.
- Game over: ranking sorted by total with ties sharing a rank, per-player correct count ("7/10 correct") and per-category breakdown; solo keeps its score-ratio award message plus the breakdown. New Game / Rematch preserved (Rematch replays with the same players and setup).
- Score dots: one droplet row per player (1–6), still sized to the actual question count.
- Wake Lock: the screen stays awake during quizmaster-mode games via the Screen Wake Lock API (no dependency, try/catch no-op where unsupported); released on game over/reset.
- Star-power animation triggers on quizmaster "Next" when at least one player was marked correct (immediately on a correct tap in solo/pass-and-play, as before).
- Dead two-player UI keys removed (`gameboard.playerOne/playerTwo`, `gameover.playerOneWins/playerTwoWins/playerOne/playerTwo/draw`); 13 new keys added to both en and fr dictionaries.
- Unit tests 27 → 37: quizmaster scoring via marked players, pass-and-play flow with last-player reveal, solo without interstitial handoff, ranking ties, difficulty weighting (on 1/2/3 and off = 1), 1–6 roster with localized names, name persistence.

## Unreleased — Starter screen sequencing

- Starter screen reordered around choices first, launch last: Single Player / Multiplayer choice buttons, then the multiplayer-only choices (quizmaster vs pass-and-play, player count, names, Hide Choices), then the shared choices (Weight by Difficulty, language, category, question count), and the Start button at the bottom of the sequence instead of between the mode buttons and the choices.
- Start is styled as the clearly differentiated primary action: green (`$color-green`), bold, larger (1.5em), full-width, with a green hover state that keeps it distinct from the choice buttons' hover color.
- No setup-logic changes: same store calls (`selectMode`, `setMultiplayerMode`, `setSetup`, `startGame`), same locale keys in en + fr.
- The Single Player / Multiplayer choice buttons now sit side by side in a flex row (equal halves, 0.75em gap) instead of stacked one below the other; still the first choice in the sequence, both keep the same `selectMode` behavior and selected-state styling.

## Unreleased — Phase 1: Local questions

- Local question data: `questions/sample.json` (12 placeholder questions, 2 per core category, `lang: "en"`, `origin: "human"`, `reviewed: true`), bundled at build time via Vite `import.meta.glob` — no Open Trivia DB.
- Data model: `src/questions/schema.ts` validator (field rules from the spec: enums, ID formats, 3 plausible incorrect answers, explanation length/sentences, current-events date anchoring and source requirement).
- `npm run validate:questions` (zero-dependency Node script) validates every file, ID uniqueness and duplicate question text; runs in CI.
- `src/questions/questionBank.ts`: `getCategories(lang)` derived from data, `drawQuestions({ lang, categories, count, difficulty? })` with no repeats per game, seen-ID recency in `localStorage` (try/catch-wrapped; pool reset reported to the UI when exhausted).
- Removed all Open Trivia DB code: store fetch, category fetch, `htmlEntityMixin`, and the now-unneeded loader screen.
- Game setup (Starter): language (en/fr) — the selected language now drives all UI strings, not just question data; category multi-select (default all), question count (5/10/15/20, default 10).
- Pool-reset notice shown in the question header when the seen pool is exhausted.
- Game-over score now uses the dynamic question total (`Score: 5/5`), not hardcoded `/10`; award messages and score dots follow the actual question count. Unreachable award-message variants removed (`message.3/5/7/9`); the "4/10 is average" phrasing no longer hardcodes a score.
- 27 unit tests: schema validation, `drawQuestions` (categories, difficulty, no-repeat, recency, pool reset, pool cap), store game logic.
- Fully playable with the network disabled (verified in the browser with offline emulation).
- "Trivia" phrasing replaced with neutral quiz/knowledge framing in user-facing copy (en + fr locales, `README.md`, `SPEC.md`, `package.json`, `index.html`); upstream project and Open Trivia DB names kept where they are proper nouns.
- Added 🥴 SVG favicon (`public/favicon.svg`); removed the unreferenced upstream `src/assets/winsome-trivia.png`.

## 0.1.0 — Phase 0: Make it build

Migrated Winsome Trivia (Vue 2 + Vuex + webpack 2 + node-sass) to the Phase 0 target stack with no gameplay changes:

- Vite + Vue 3 (`<script setup>`) + Pinia + TypeScript + Dart Sass on Node LTS.
- vue-resource replaced with `fetch`; Open Trivia DB calls kept (removed in Phase 1).
- All upstream components migrated: App, Intro, Instructions, Starter, GameBoard, Questions, ScoreDots, StarPower, GameOverModal, Loader, About. Dead `Score.vue` (never imported upstream) not migrated.
- All UI strings centralized in `src/locales` with `en` and `fr` dictionaries.
- Upstream `LICENSE` kept; Christopher Murphy credited in `README.md`.
- Fisher-Yates shuffle and game logic preserved; choice payload key `true`→`correct` fix (upstream bug: `{false: false}` scored as a push with undefined check but never incremented totals — now both branches record history correctly).
- Removed webpack, Babel, node-sass configuration.
