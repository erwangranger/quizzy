---
description: Generate this week's pending recent-news questions (en + fr) and open a review PR
---

# Weekly news questions

You are running unattended (usually from a scheduled task). Do every step without asking questions. If a step says to abort, stop there and print the reason as your final message.

Arguments (optional, `key=value`): `count` per language (default 10), `days` of news to cover (default 14), `langs` (default `en,fr`). $ARGUMENTS

Let `DATE` be today's date (`YYYY-MM-DD`) and `STAMP` the same without dashes (`YYYYMMDD`).

## 1. Preflight
- `gh auth status`. If it fails, abort: "gh is not authenticated — run `gh auth login`."
- `git status --porcelain`. If there is any output, abort: "working tree is dirty — not touching it."
- `git fetch origin main`, then `git switch -c news/DATE origin/main`. This works both in the main checkout and in a scheduled-task worktree, where `main` can't be checked out. Check `git branch --list news/DATE` and `git ls-remote --heads origin news/DATE`. If either prints anything, abort: "news/DATE already exists — this week's run already happened."

## 2. Context
- Load the `quizzy-question-crafting` skill and follow it for every question.
- Read the Phase 5 content rules in `docs/SPEC.md` §6.
- Run `node scripts/news-context.mjs --days 90`. Every line is an existing news question. Do not write a question about the same event or fact as any of them. IDs `news-STAMP-<nn>` must not collide with any listed id (start `nn` after the highest used for `STAMP`, else at `01`). en and fr share one numbering sequence.

## 3. Research and write
- Use web search to find events from the last `days` days. Prefer science, space, culture, sports, business, geography and notable firsts. Avoid tragedies, violence and partisan framing. Use only verifiable facts, never opinions or predictions.
- Every question has to be checked against an article you actually opened. `source_url` is that article, from a reputable outlet or primary source. `as_of` is the date the fact was true.
- Write `count` questions per language. French questions are written natively in French (they may cover the same or different events as the English ones, but are never word-for-word translations). Sources for fr questions may be French-language outlets.
- Question text is date-anchored ("In October 2026, ..." / "En octobre 2026, ..."). Use `category: "recent-news"`, `origin: "claude"`, `reviewed: false`. Explanations go in your own words, never copied from the source.

## 4. Write files
- English: `questions/pending/news-DATE.json`. French: `questions/pending/fr-news-DATE.json`. Each is a JSON array, 2-space indent, trailing newline.

## 5. Validate
- Run `npm run validate:questions`. For each error in a pending file, **drop that question** (do not rewrite it to pass) and note the id and the error. Re-run until it passes. Warnings about shipped banks only are not your concern.
- If a language ends up with fewer than half of `count`, still continue, but say so in the PR body.
- If nothing survives, abort: switch back and delete the branch (`git switch - && git branch -D news/DATE`) and report why.

## 6. Commit and open the PR
- `git add questions/pending && git commit -m "feat(questions): pending news questions DATE"` and end the message with a blank line followed by `Co-Authored-By: Claude <noreply@anthropic.com>`.
- `git push -u origin news/DATE`.
- `gh pr create --base main --title "New current-events questions (DATE)" --body-file .git/news-pr-body.md` (write the body there first; `.git/` is never committed). The body has:
  - One table per language: `id | question | answer | source`, with the source as a markdown link.
  - A "Dropped" list: each dropped question's id, text and the validator error.
  - The review steps: edit questions in the PR, set `reviewed: true` on the ones to keep, run `npm run promote:pending`, commit, merge.

## 7. Clean up
- `git switch -` to return to the branch you started on. Final message: the PR URL, the counts per language and the dropped count.
