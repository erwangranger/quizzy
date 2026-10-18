# Quizzy 🥴

A single or multiplayer (local) quiz game, built with Vue 3, Pinia, TypeScript and Vite.
Play solo or with a group on one device — pass it around (pass-and-play) or run it quizmaster-style, where one player reads the questions and the others write their answers down. Optional difficulty weighting scores harder questions for more points.

## Development

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

The site deploys to GitHub Pages via a GitHub Actions workflow on every push to `main`.

## Question data

Questions live as JSON files in `questions/` — no external API. Each file is an array of question objects (see the data model in `SPEC.md`). Only questions with `reviewed: true` are bundled into the build; unreviewed banks awaiting human review live in `questions/pending/`.

Validate them:

```bash
npm run validate:questions
```

## Credits

Quizzy started life as a fork of [Winsome Trivia](https://github.com/Splode/open-trivia-app) by [Christopher Murphy](http://christopherianmurphy.com) — the original project was the starting point and the inspiration for this one. Credit where credit is due. It has since grown into a new app, going in a new direction of its own.

## License

MIT — see [LICENSE](./LICENSE) (upstream `LICENSE` kept, © 2018 Christopher Murphy).
