# Road Trip Quiz: Agent Spec

You are building a quiz game for a small group (typically 2 players) to play on one phone, often in a car with patchy connectivity. Start from the existing open-source app by **Christopher Murphy** (https://github.com/Splode/open-trivia-app, MIT license) and extend it as described below.

Work in phases. Finish each phase completely, commit it, and stop for review before starting the next one. Do not skip ahead.

---

## 1. Context: the starting codebase

Facts about the upstream repo (verify them before relying on them):

- Last commit: March 2018. Vue 2, Vuex 2, vue-resource, webpack 2, Babel 6, node-sass 4.
- About 1,000 lines across `src/App.vue`, `src/main.js`, `src/store/store.js`, `src/htmlEntityMixin.js` and 11 components in `src/components/`.
- Questions are fetched at game start from the Open Trivia DB API (`opentdb.com/api.php?amount=10`), 10 rounds per game.
- Multiplayer is limited to **2 players taking alternate turns** (`turn` getter uses `round % 2`). Each player only answers every other question.
- Multiple choice only. No explanations. No offline support.

**Important:** this toolchain will almost certainly not install or build on a current Node LTS (node-sass 4 and webpack 2 are long dead). Getting it to build is not optional modernization; it is Phase 0.

---

## 2. Goals

1. **All players answer every question** (not alternating turns), for 2 to 4 players.
2. **Explanations:** after each question is revealed, show a short explanation (2 to 3 sentences of context) along with the correct answer.
3. **Local question data:** no Open Trivia DB. Questions live as JSON files in this repo. I will supply a small set of sample questions to start.
4. **Rendered website:** deployed to GitHub Pages, installable as a PWA, fully playable offline.
5. **iOS-ready architecture:** no native app now, but nothing may block wrapping the web build with Capacitor later.
6. **Claude-generated questions** about recent world events, produced by a scheduled pipeline and reviewed by a human before merging (Phase 5).

## 3. Non-goals (do not build)

- No backend, accounts, database server or network multiplayer across devices.
- No native iOS/Swift code.
- No calls to any AI API from the client app, ever.
- No ads or trackers. Client-side Google Analytics is permitted (amended 2026-10-19, owner approval): usage counts (including virtual page_view events on screen transitions), question IDs shown, and per-question correct/incorrect counts — client-side beacons, no backend, no accounts, no data beyond gameplay and screen-transition events.
- No Open Trivia DB data or API calls.

---

## 4. Constraints and conventions

- **Stack target:** Vue 3 (Composition API, `<script setup>`), Vite, Pinia, TypeScript, Vitest, `sass` (Dart Sass). Node current LTS. Package manager: npm.
- **Keep the upstream look and feel** (layout, colors, star-power animation, score dots) unless a requirement forces a change. Restyling is a later, separate task.
- **Attribution:** keep the upstream `LICENSE`, and credit Christopher Murphy in `README.md`.
- **Dependencies:** ask before adding any runtime dependency beyond those listed above (plus `vite-plugin-pwa` in Phase 4 and `@anthropic-ai/sdk` in Phase 5).
- **Relative asset paths and hash-free routing** (or no router at all), so the build works under a GitHub Pages subpath and inside a Capacitor WebView.
- **Data layer separated from UI:** components never read JSON files directly; they go through a `questionBank` module. This is what makes a future native or alternative front end cheap.
- **Mobile first:** design for a phone held in portrait. Tap targets of at least 44 px. Readable at arm's length (large question text).
- **Commits:** one logical change per commit, conventional commit messages. Each phase ends with a short `CHANGELOG.md` entry.
- **Tests:** unit tests for the store/game logic and for question validation. UI tests are not required.

---

## 5. Question data model

Store questions in `questions/*.json`, each file an array of question objects. Files are bundled at build time (Vite `import.meta.glob`), so play works offline.

```json
{
  "id": "geo-0001",
  "lang": "en",
  "category": "geography",
  "difficulty": 2,
  "question": "Which river flows through Montreal?",
  "correct_answer": "Saint Lawrence River",
  "incorrect_answers": ["Ottawa River", "Hudson River", "Richelieu River", "A very wide creek"],
  "explanation": "Montreal sits on an island at the confluence of the Saint Lawrence and Ottawa rivers. The Saint Lawrence connects the Great Lakes to the Atlantic, which made the city a major port.",
  "source_url": "https://en.wikipedia.org/wiki/Saint_Lawrence_River",
  "as_of": null,
  "origin": "human",
  "reviewed": true
}
```

Field rules:

| Field | Type | Rule |
|---|---|---|
| `id` | string | Unique across all files. Format `<category-prefix>-<4 digits>` for human questions and claude-generated general knowledge, `news-YYYYMMDD-<nn>` for news-pipeline questions. |
| `lang` | `"en"` or `"fr"` | Required. The game filters by selected language. |
| `category` | enum | `geography`, `history`, `science`, `arts-literature`, `entertainment`, `sports-leisure`, `recent-news`. (Six classic categories, plus recent news.) |
| `difficulty` | 1, 2 or 3 | 1 easy, 3 hard. |
| `question` | string | Plain text, no HTML entities. |
| `correct_answer` | string | Short. |
| `incorrect_answers` | string[4] | Exactly 4: 3 plausible, plus 1 obviously-wrong joke answer meant to earn a chuckle. None equal to the correct answer. |
| `explanation` | string | 1 to 3 sentences, max 400 characters. Must add context, not just restate the answer. |
| `source_url` | string or null | Required (non-null) for `recent-news`. |
| `as_of` | ISO date or null | Required for `recent-news`; the date the fact was true. The question text must also be date-anchored ("In September 2026, ..." / "En septembre 2026, ..." — English and French month names both satisfy the anchor). |
| `origin` | `"human"` or `"claude"` | Provenance. |
| `reviewed` | boolean | Only `reviewed: true` questions are included in the build. |

Deliverables for the data model:

- `src/questions/schema.ts`: a validator (hand-written or JSON Schema with `ajv`; ask before adding `ajv`).
- `npm run validate:questions`: validates every file, checks ID uniqueness and duplicate question text, exits non-zero on any error. Runs in CI.
- `questions/sample.json`: I will provide my own sample questions. Until then, create **12 placeholder questions** (2 per core category, `lang: "en"`, `origin: "human"`, `reviewed: true`), clearly factual and uncontroversial, so the app is playable.

---

## 6. Phases

### Phase 0: Make it build (no behavior changes)

1. Fork/copy upstream into this repo, preserving history if possible.
2. Migrate to Vite + Vue 3 + Pinia + TypeScript + Dart Sass. Replace vue-resource with nothing for now (OpenTDB calls are removed in Phase 1; temporarily keep them using `fetch` so the app still runs).
3. Remove webpack, Babel and node-sass configuration.
4. Acceptance: `npm install`, `npm run dev`, `npm run build` all succeed on current Node LTS; the game plays exactly as upstream (solo and 2-player alternating).

### Phase 1: Local questions

1. Implement the data model, validator and `questions/sample.json` (section 5).
2. Create `src/questions/questionBank.ts` with:
   - `getCategories(lang)`: derived from the data, not hardcoded.
   - `drawQuestions({ lang, categories, count, difficulty? })`: random selection without repeats within a game.
   - Prefer questions not seen recently: keep a list of seen IDs in `localStorage` (wrapped in try/catch; the game must work if storage is unavailable). When the pool of unseen questions runs out, reset and say so in the UI.
3. Remove all Open Trivia DB code: API calls in the store, any category fetch in the starter screen, and `htmlEntityMixin.js`. Remove the loader screen if it is no longer needed.
4. Game setup lets players choose: categories (multi-select, default all), number of questions (5, 10, 15, 20; default 10), language (default `en`).
5. Acceptance: game is fully playable with the network disabled (in dev tools). Validator passes. Unit tests cover `drawQuestions`.

### Phase 2: Every player answers every question

1. **Players:** 1 to 4, each with an editable name. Remember names in `localStorage`. Replace the `playerOne` / `playerTwo` state with an array of players.
2. **Two multiplayer modes**, chosen at setup:
   - **Quizmaster mode** (default for multiplayer): the phone shows the question and choices; one person reads it aloud; everyone answers out loud. A "Reveal" button shows the correct answer and explanation. Then a row of player-name toggle buttons lets the quizmaster mark who was right. "Next" scores and advances. Include a setup toggle **"Hide choices"** that hides the multiple-choice options until reveal (open-answer play).
   - **Pass-and-play:** each player in turn taps their answer privately. Between players, show a full-screen interstitial: "Pass to {name}" with a "Ready" button, so the next player cannot see the previous answer. After the last player answers, show the reveal screen with every player's choice, the correct answer and the explanation.
3. **Solo mode** behaves like pass-and-play with one player and no interstitial.
4. **Scoring:** 1 point per correct answer. Setup option "Weight by difficulty" (1/2/3 points). Score dots show a per-player history row.
5. **Game over:** ranking with ties handled, per-player correct count, and a per-category breakdown.
6. Acceptance: unit tests for scoring (both modes, ties, weighting). Manual check on a phone-sized viewport with 2 and 4 players.

### Phase 3: Explanations

1. The reveal screen always shows: the correct answer, the explanation, and (if present) a "Source" link opening in a new tab. Show the explanation **whether or not players got it right**.
2. For `recent-news` questions, show "As of {as_of}" under the explanation.
3. Keep the star-power animation for a correct answer in solo and pass-and-play; in quizmaster mode trigger it when at least one player is marked correct.
4. Acceptance: explanation is readable without scrolling on a 375 px wide screen for a 400-character explanation.

### Phase 4: Website, PWA and offline

1. Add `vite-plugin-pwa`: manifest (name, short name, icons, `display: standalone`, theme color from the existing palette), service worker precaching the whole app including all question data.
2. GitHub Actions workflow `deploy.yml`: on push to `main`, run `validate:questions`, tests and build, then deploy to GitHub Pages. Set Vite `base` correctly for the Pages subpath.
3. Add an "Update available, tap to refresh" prompt when a new service worker is waiting (new questions arrive via deploys).
4. Acceptance: Lighthouse PWA installability passes; after first load, the installed app starts and plays with airplane mode on (verify on iOS Safari "Add to Home Screen").
5. Document in `README.md` how a future Capacitor iOS wrap would work (do not implement it): `npm run build` output in `dist/` is the web asset folder; nothing depends on a server.

### Phase 5: Claude-generated current-events questions

This runs **in CI only**. The client app never calls an AI API.

1. Script `scripts/generate-questions.ts` (run with `tsx`):
   - Uses `@anthropic-ai/sdk`. Model is read from env var `CLAUDE_MODEL` (no hardcoded default in code paths other than a documented fallback in the workflow file). API key from `ANTHROPIC_API_KEY`.
   - Enables the Anthropic web search tool so questions are based on events from the last N days (default 14).
   - Inputs (CLI flags / workflow inputs): `--count` (default 10), `--lang` (default `en`), `--days` (default 14), `--categories` (default `recent-news`).
   - Sends the model: the question schema, the rules from section 5, the list of existing question texts and IDs from the last 90 days (for deduplication), and these content rules:
     - Questions must be about verifiable facts, not opinions or predictions.
     - Every question must be date-anchored in its text and have `as_of` and a `source_url` from a reputable outlet or primary source found via search.
     - Avoid tragedies and violent events as quiz material; avoid partisan framing; prefer science, culture, sports, business, space, geography, notable firsts.
     - The correct answer must be unambiguous; incorrect answers must be plausible but clearly wrong.
     - Explanations written in the model's own words, never copied from the source.
   - Asks for JSON only; parses defensively (strip code fences), then validates every question with the Phase 1 validator. Invalid items are dropped and logged, not "fixed" silently.
   - Runs a duplicate check (normalized text similarity against existing questions); drops near-duplicates.
   - Writes survivors to `questions/pending/news-YYYY-MM-DD.json` with `origin: "claude"` and `reviewed: false`.
2. Workflow `generate-questions.yml`: weekly cron plus `workflow_dispatch` with the inputs above. Runs the script, then opens a pull request (e.g. `peter-evans/create-pull-request`) titled "New current-events questions (YYYY-MM-DD)" whose body lists each question, its answer and its source link for quick review.
3. Review flow (document in `README.md`): I edit questions in the PR, set `reviewed: true` on the ones I keep, delete the rest, then merge. A small script `npm run promote:pending` moves reviewed questions from `questions/pending/` into `questions/recent-news.json` and deletes empty pending files.
4. Staleness: questions with `as_of` older than 18 months are excluded from the build by default (configurable), since "recent events" stop being recent.
5. Acceptance: a manual `workflow_dispatch` run with `--count 5` produces a valid PR; with `ANTHROPIC_API_KEY` missing, the job fails with a clear message; the deployed app never includes `reviewed: false` questions.

---

## 7. Definition of done (every phase)

- `npm run build`, `npm test` and `npm run validate:questions` pass.
- No console errors in the browser during a full game.
- `README.md` and `CHANGELOG.md` updated.
- A short summary for me: what changed, anything you were unsure about, and any decision you made that I should confirm.

## 8. When to stop and ask

- Before adding a dependency not named in this spec.
- If an upstream behavior conflicts with a requirement and the right choice is not obvious.
- If a phase turns out to need something listed under Non-goals.
