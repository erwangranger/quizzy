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
