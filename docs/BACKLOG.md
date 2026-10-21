# Backlog

Open work only. Finished work lives in `CHANGELOG.md` and git history; the roadmap is SPEC §6.

## Roadmap status (2026-10-21)
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

## Decisions to keep (so they aren't re-proposed)
- No router / URL-per-screen: game state is not URL-addressable (only one saved game, in localStorage) so deep links would dead-end, and a router is a new runtime dependency. Screen analytics use virtual `page_view` events instead (see CHANGELOG "Google Analytics").
- The GA Measurement ID is public and committed in `.env.production`; a Measurement Protocol API secret, if ever needed, must never be committed.
- `Questions.vue` has a scoped bare-`div` card rule that leaks onto any new block `div` inside the card. Reset margin/padding/min-width/border-radius/background explicitly, as `.foot`, `.foot-actions` and `.tally` do.
- Out of scope unless the owner asks: accounts, theming, sound, timers, haptics, landscape (SPEC §4 mandates portrait).
