# Changelog

## Unreleased

- App emoji: woozy face 🥴 in the browser title, README, package.json description, and the in-app header (`app.title` in both en and fr locales).

## 0.1.0 — Phase 0: Make it build

Migrated Winsome Trivia (Vue 2 + Vuex + webpack 2 + node-sass) to the Phase 0 target stack with no gameplay changes:

- Vite + Vue 3 (`<script setup>`) + Pinia + TypeScript + Dart Sass on Node LTS.
- vue-resource replaced with `fetch`; Open Trivia DB calls kept (removed in Phase 1).
- All upstream components migrated: App, Intro, Instructions, Starter, GameBoard, Questions, ScoreDots, StarPower, GameOverModal, Loader, About. Dead `Score.vue` (never imported upstream) not migrated.
- All UI strings centralized in `src/locales` with `en` and `fr` dictionaries.
- Upstream `LICENSE` kept; Christopher Murphy credited in `README.md`.
- Fisher-Yates shuffle and game logic preserved; choice payload key `true`→`correct` fix (upstream bug: `{false: false}` scored as a push with undefined check but never incremented totals — now both branches record history correctly).
- Removed webpack, Babel, node-sass configuration.
