# Quizzy 🥴

A free quiz you can play in your browser — alone, or with a group of friends sharing one device.

**👉 Play it here: [https://erwangranger.github.io/quizzy/](https://erwangranger.github.io/quizzy/)**

No account, nothing to install — open the link and play. It works on phones, tablets, and computers, and it's available in English and French.

---

## What it looks like

Pick how you want to play, then choose a language, a category, and how many questions you want:

![The Quizzy start screen: choose single player or multiplayer, a language, a category, and the number of questions](docs/screenshots/start.png)

Answer multiple-choice questions at your own pace:

![A question with five answer choices](docs/screenshots/question.png)

After each answer you instantly see whether you were right, along with a short explanation:

![A revealed question showing the correct answer in green, wrong ones in red, and an explanation](docs/screenshots/answer.png)

When the quiz is over you get your score and a breakdown by category:

![Game over screen showing the final score and a category breakdown](docs/screenshots/game-over.png)

## How to play

1. **Choose your mode** — Single Player, or Multiplayer (see below).
2. **Weight by Difficulty** *(optional)* — tick this to make harder questions worth more points. Left off, every question scores the same.
3. **Pick a language** — English (`en`) or French (`fr`).
4. **Pick a category** — Geography, History, Science, Arts & Literature, Entertainment, Sports & Leisure, or Recent News.
5. **Pick how many questions** — 5, 10, 15, or 20.
6. Hit **Start** and answer the questions. Not sure about one? **Skip** it — no penalty, it just moves on.
7. At the end, check your score and start another round, or head back to the menu.

### Playing with friends

Two ways to play together on one device:

- **Pass-and-play** — pass the device around; each player answers on their turn. The strip at the bottom keeps everyone's score.
- **Quizmaster** — one person reads the questions aloud while everyone else writes their answers down. The quizmaster reveals each answer and marks who got it right.
  - Quizmaster-only option: **Hide Choices** — keep answer choices on screen for the quizmaster only, so players answer without seeing the options.

To set up either one, choose **Multiplayer** on the start screen, add each player's name, and pick who (if anyone) is the quizmaster.

## Install it as an app

Quizzy is a progressive web app (PWA): you can add it to your home screen or desktop and it behaves like a regular app — full screen, no browser bars, and it keeps working offline.

- **Chrome/Edge (Android/Desktop):** a banner appears when you visit the site; tap "Add to Quizzy".
- **Safari (iOS):** tap the Share button → "Add to Home Screen".
- **Firefox (Android):** tap the menu (⋮) → "Add to Home Screen" or "Install".

Once installed, Quizzy launches full screen like any other app, with no browser bars. It works offline (the app shell and questions are cached).

## Tips

- The **menu button** in the top-right corner opens an About panel with the app version, install instructions, a link to the source code, and a way to report a problem.
- Quizzy avoids repeating questions until you've seen the whole deck — a message tells you when it starts over.

Quizzy is built with Vue 3, Pinia, TypeScript, Vite and SCSS. Questions live as JSON files in `questions/` — no external API (see the data model in [`docs/SPEC.md`](docs/SPEC.md)). Only questions with `reviewed: true` are bundled into the build; new banks land in `questions/pending/` until reviewed.

```bash
npm install
npm run dev                       # dev server
npm test                          # unit tests
npm run validate:questions        # validate question files (incl. questions/pending/)
npm run promote:pending           # move reviewed pending questions into the news banks
npm run build && npm run preview  # production build + local preview
```
The site deploys to GitHub Pages automatically on every push to `main`.

## Weekly news questions

A Claude Code Desktop scheduled task on the owner's laptop writes about 10 English and 10 French Recent News questions every week and opens a pull request. The recipe it follows is [`.claude/commands/news-questions.md`](.claude/commands/news-questions.md). You can also run it by hand with `/news-questions` (e.g. `/news-questions count=5`).

**One-time setup**

1. `brew install gh && gh auth login`.
2. In the Claude desktop app's Code tab, go to **Scheduled** → **New task** → **Set up manually**:
   - Name: `quizzy-news`.
   - Schedule: weekly, Monday 09:00.
   - Advanced settings: **Only on this computer**. Local folder: this repo, with **Worktree** on so runs never touch your working copy.
   - Instructions: *Read `.claude/commands/news-questions.md` and follow it exactly.*
3. Click **Run now** once. Approve ("always allow") anything the committed `.claude/settings.json` allowlist doesn't cover, so later runs don't stall waiting for you.

Runs only fire while the app is open and the Mac is awake. A run missed in the last 7 days catches up once on wake or app start. To avoid missing runs, turn on Settings → This computer → System → **Keep computer awake**.

**Reviewing a PR**

1. Check each question against its source link. Edit wording in the pending files, and set `reviewed: true` on the ones to keep.
2. `npm run promote:pending`: reviewed questions move into `questions/recent-news.json` / `questions/fr-recent-news.json`, the rest are dropped, and the pending files are deleted.
3. Commit and merge. Unreviewed questions never ship. News questions older than 18 months drop out of play automatically.

## Releases

Quizzy uses [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`, tags `vX.Y.Z`). The version and the date the question banks last changed are shown at the top of the About panel, e.g. `v0.2.0 · questions updated 2026-10-23`.

Versions are cut automatically by [release-please](https://github.com/googleapis/release-please) from [conventional commits](https://www.conventionalcommits.org) on `main`:

| Commit type | Effect (before 1.0) |
| --- | --- |
| `feat:` | minor bump (0.2.0 → 0.3.0) |
| `fix:` | patch bump (0.2.0 → 0.2.1) |
| `feat!:` / `BREAKING CHANGE:` | minor bump (major after 1.0) |
| `docs:`, `chore:`, `refactor:`, `style:`, `test:` | no release |

release-please keeps a "release PR" open that bumps `package.json` and writes `docs/CHANGELOG.md`. Merging it creates the tag and GitHub Release, and the normal deploy ships it. Squash-merged PR titles become the commit message, so write them as conventional commits. Weekly news questions are `chore(questions):`, so they never bump the version; the content date in About covers them.

## Native iOS app (future, not implemented yet)

Quizzy is a static site: `npm run build` writes everything to `dist/`, and nothing needs a server (questions are bundled, and analytics is an optional client-side gtag). A native iOS wrapper would use [Capacitor](https://capacitorjs.com) to load that folder:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init                          # set webDir to "dist"
npx cap add ios
npm run build && npx cap sync
npx cap open ios                      # opens the project in Xcode
```

The Vite `base` is `'./'` (relative asset paths), which works both on the GitHub Pages subpath and inside the Capacitor shell. Keep it that way; a Capacitor build would also work with `'/'`.

## Credits

Quizzy started life as a fork of [Christopher Murphy's open-source quiz app](https://github.com/Splode/open-trivia-app) — the original project was the starting point and the inspiration for this one. Credit where credit is due. It has since grown into a new app, going in a new direction of its own.

## License

MIT — see [LICENSE](./LICENSE) (upstream `LICENSE` kept, © 2018 Christopher Murphy).
