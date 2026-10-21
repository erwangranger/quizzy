# Backlog

Open work only. Finished work lives in `CHANGELOG.md` and git history; the roadmap is SPEC §6.

## Roadmap status (2026-10-21)
- Phases 0–3: done.
- Phase 4: done except 4.5 (below) and a real-device check of 4.4 — after "Add to Home Screen" on iOS Safari, the installed app starts and plays a full game in airplane mode. Not yet recorded as done.
- Phase 5: not started (below).

## Phase 5: generated current-events questions (decision needed)
- Nothing exists yet: no `scripts/generate-questions.ts`, no `generate-questions.yml`, no `npm run promote:pending`, no 18-month `as_of` staleness filter. The October 2026 news bank (98 questions, en + fr) was produced once and promoted by hand into `questions/recent-news.json` / `questions/fr-recent-news.json`.
- Needs: `@anthropic-ai/sdk` + `tsx` (named in SPEC), an `ANTHROPIC_API_KEY` repo secret, a `CLAUDE_MODEL` workflow fallback.
- Without it, Recent News goes stale. GA `question_shown` by category can show whether the category earns the investment first.
- The staleness filter (SPEC §6 Phase 5.4) is independent and cheap. It only matters from about April 2028 for the current bank.

## Phase 4.5: Capacitor note in README
- Document how a future iOS wrap would work (do not implement): `npm run build` → `dist/` is the web asset folder; nothing depends on a server.

## SPEC drift: player cap
- SPEC §6 Phase 2.1 says 1–6 players; the Starter now caps at 4 (`MAX_PLAYERS`, 2026-10-21 player-count buttons). Amend the SPEC to match, or restore 6.

## Interruption recovery (decision needed)
- The store is memory-only: a phone call or swipe-away loses the game in progress. Options: persist `{questions, round, players/scores, mode}` to `localStorage` (try/catch-wrapped, like the seen-IDs and player-name keys) and offer "Resume" on the Starter; or explicitly accept the loss.

## Special categories from course materials (idea)
- Feed in `.pdf` files or raw text; an AI generates quiz questions from them so students can check they understood course materials.
- Fits the existing data model: generated questions are `questions/*.json` entries loaded through `questionBank`.
- Same constraint as Phase 5: no AI calls from the client; generation runs offline and is reviewed before merging. Best built on top of the Phase 5 pipeline.

## Decisions to keep (so they aren't re-proposed)
- No router / URL-per-screen: state is memory-only so deep links would dead-end, and a router is a new runtime dependency. Screen analytics use virtual `page_view` events instead (see CHANGELOG "Google Analytics").
- The GA Measurement ID is public and committed in `.env.production`; a Measurement Protocol API secret, if ever needed, must never be committed.
- `Questions.vue` has a scoped bare-`div` card rule that leaks onto any new block `div` inside the card. Reset margin/padding/min-width/border-radius/background explicitly, as `.foot`, `.foot-actions` and `.tally` do.
- Out of scope unless the owner asks: accounts, theming, sound, timers, haptics, landscape (SPEC §4 mandates portrait).
