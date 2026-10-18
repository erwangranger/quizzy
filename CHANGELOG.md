# Changelog

## Unreleased — Phase 1: Local questions

- Local question data: `questions/sample.json` (12 placeholder questions, 2 per Trivial Pursuit category, `lang: "en"`, `origin: "human"`, `reviewed: true`), bundled at build time via Vite `import.meta.glob` — no Open Trivia DB.
- Data model: `src/questions/schema.ts` validator (field rules from the spec: enums, ID formats, 3 plausible incorrect answers, explanation length/sentences, current-events date anchoring and source requirement).
- `npm run validate:questions` (zero-dependency Node script) validates every file, ID uniqueness and duplicate question text; runs in CI.
- `src/questions/questionBank.ts`: `getCategories(lang)` derived from data, `drawQuestions({ lang, categories, count, difficulty? })` with no repeats per game, seen-ID recency in `localStorage` (try/catch-wrapped; pool reset reported to the UI when exhausted).
- Removed all Open Trivia DB code: store fetch, category fetch, `htmlEntityMixin`, and the now-unneeded loader screen.
- Game setup (Starter): language (en/fr), category multi-select (default all), question count (5/10/15/20, default 10).
- Pool-reset notice shown in the question header when the seen pool is exhausted.
- Game-over score now uses the dynamic question total (`Score: 5/5`), not hardcoded `/10`.
- 27 unit tests: schema validation, `drawQuestions` (categories, difficulty, no-repeat, recency, pool reset, pool cap), store game logic.
- Fully playable with the network disabled (verified in the browser with offline emulation).

## 0.1.0 — Phase 0: Make it build

Migrated Winsome Trivia (Vue 2 + Vuex + webpack 2 + node-sass) to the Phase 0 target stack with no gameplay changes:

- Vite + Vue 3 (`<script setup>`) + Pinia + TypeScript + Dart Sass on Node LTS.
- vue-resource replaced with `fetch`; Open Trivia DB calls kept (removed in Phase 1).
- All upstream components migrated: App, Intro, Instructions, Starter, GameBoard, Questions, ScoreDots, StarPower, GameOverModal, Loader, About. Dead `Score.vue` (never imported upstream) not migrated.
- All UI strings centralized in `src/locales` with `en` and `fr` dictionaries.
- Upstream `LICENSE` kept; Christopher Murphy credited in `README.md`.
- Fisher-Yates shuffle and game logic preserved; choice payload key `true`→`correct` fix (upstream bug: `{false: false}` scored as a push with undefined check but never incremented totals — now both branches record history correctly).
- Removed webpack, Babel, node-sass configuration.
