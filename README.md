# Quizzy 🥴

A single or multiplayer (local) trivia game, built with Vue 3, Pinia, TypeScript and Vite.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Question data

Questions live as JSON files in `questions/` — no external API. Each file is an array of question objects (see the data model in `SPEC.md`). Only questions with `reviewed: true` are bundled into the build.

Validate them:

```bash
npm run validate:questions
```

## Credits

Quizzy started life as a fork of [Winsome Trivia](https://github.com/Splode/open-trivia-app) by [Christopher Murphy](http://christopherianmurphy.com) — the original project was the starting point and the inspiration for this one. Credit where credit is due. It has since grown into a new app, going in a new direction of its own.

## License

MIT — see [LICENSE](./LICENSE) (upstream `LICENSE` kept, © 2018 Christopher Murphy).
