---
name: quizzy-question-crafting
description: How to craft and review quiz questions for the Quizzy question banks (questions/*.json) — data model, 5-way choices with a joke answer, sensitive-topic handling, and the validation gates every question must pass.
---

# Crafting Quizzy questions

Applies to every question added to `questions/sample.json` (starter bank, human origin)
or `questions/recent-news.json` (news bank). The validators are the arbiter —
`npm run validate:questions` must pass before anything ships — but most rules below
are quality rules the validators cannot check.

## Data model

Every question is one JSON object in a questions/*.json array. Full rules in `docs/SPEC.md`
(data-model section) and enforced by `src/questions/schema.ts` + `scripts/validate-questions.mjs`.

| Field | Rule |
|---|---|
| `id` | Unique across all files. Human questions: `<category-prefix>-<4 digits>` (e.g. `geo-0003`). News questions: `news-YYYYMMDD-<nn>` (e.g. `news-20261014-29`). `news-` prefix is reserved for `origin: "claude"`. |
| `lang` | `"en"` (the game filters by language; banks are en-only today). |
| `category` | One of `geography`, `history`, `science`, `arts-literature`, `entertainment`, `sports-leisure`, `current-events`, `recent-news`. |
| `difficulty` | `1` easy, `2` medium, `3` hard. Calibrate: 1 = common knowledge, 2 = needs some knowledge, 3 = needs real knowledge of the topic. |
| `question` | Plain text. No HTML entities, no emoji, no double quotes inside strings (escape only if unavoidable). One question mark, one ask. |
| `correct_answer` | Short, unambiguous, exactly the canonical form (see style rules). |
| `incorrect_answers` | Exactly 4 items: 3 plausible distractors + 1 joke answer (see below). None may equal the correct answer or duplicate each other across the whole bank. |
| `explanation` | 1–3 sentences, ≤400 chars. Must ADD context, never restate the answer (the validator rejects pure restatements: shorter than answer length + 20 chars). This is where the player learns something. |
| `source_url` | http(s) URL or null. REQUIRED for `current-events`/`recent-news` — link the actual article the fact came from. |
| `as_of` | ISO date `YYYY-MM-DD` or null. REQUIRED for current-events/recent-news — the date the fact was true. |
| `origin` | `"human"` or `"claude"`. |
| `reviewed` | Only `true` ships to players. Flip to true only after a real review pass against the source. |

Style: match the established voice in the banks. Numbers as digits ("7.7 per cent",
"41 matches", "160"), place names in canonical English form, people by familiar name
("Marie Curie", "Florence Pugh"), keep "The " prefix consistent within one question's
options ("The Isle of Wight" / "The Isle of Man" / "Anglesey").

## The 5-way choice set

Players see 5 choices: the correct answer, 3 plausible wrong answers, and 1 joke.

### The 3 plausible distractors

- Same *type* as the correct answer: numbers for numbers (nearby but wrong), cities
  for cities, names for names, years for years. A "which sea" question gets seas, not animals.
- Plausible to a guesser, clearly wrong to an informed player. Never defensible.
- No trick overlaps (no distractor that is a subset/alias of the correct answer).

### The 4th: the joke answer

The directive from the owner: players should **chuckle** at the 5th choice. It is
obviously wrong and entertaining, never a real contender.

- 2–8 words, plain text, JSON-safe (no double quotes, backslashes, HTML entities, emoji).
- Unmistakably wrong to anyone who knows the topic — absurd, exaggerated, or playfully literal.
- Family-friendly and good-natured. Universal humor only: no politics, no religion,
  no cruelty toward real named people, no dark or violent humor.
- Must differ from the 3 distractors and not reword the correct answer.
- Earn the chuckle from the *question's* world, not random nonsense:
  - Playful literalism: "November 32nd, definitely a Tuesday" (year question), "A full hour, because centuries" (leap-second question).
  - Absurd scale/entity: "A really big ice cube tray" (South Pole neutrino observatory), "Eleventy billion".
  - In-world nods: "The other Shakespeare", "A very talented turtle" (Mona Lisa/Ninja Turtles), "The Order of the DeLorean" (Michael J. Fox).
  - Playful non-answers: "Until the snacks run out", "Because it sounds cooler", "Yes, but only on Tuesdays".
- Vary the pattern across the bank — after generating jokes, run a uniqueness pass:
  `jq -sr '[.[0][], .[1][]] | .[] | .incorrect_answers[3]' questions/sample.json questions/recent-news.json | sort | uniq -d`
  must print nothing. (Parallel generation produced two hamster gags once; dedupe after.)
- Questions about an invented word/topic (e.g. "Festinathèque") get a sillier invented
  word as the joke, not a real thing.

### Sensitive topics — joke handling

The joke must never punch at people. Adjust by question type:

- **Colonial/Indigenous history** (e.g. the New France cemetery study): extra gentle;
  absurdist-historical humor only (archives, town criers, rumors). Never joke about
  the peoples or communities involved.
- **Real named people** (actors, royals, athletes): never mock the person. Use an
  obviously INVENTED silly name ("Duchess Pumpernickel of the Gift Shop"), an
  impossible entity, or celebrate the absurdity of the situation instead
  ("Fast enough to outrun her birth certificate" for a 93-year-old sprinter — gentle, admiring).
- **Dark news** (layoffs, disasters): no jokes about the people or the harm; absurd
  entity names only ("Bob's Backyard Steel Shed").
- If no gentle joke fits, a playful non-answer ("Yes, but only on Tuesdays") is safer
  than forcing topical humor.

## News questions (recent-news / current-events)

- Question text MUST be date-anchored: "In October 2026, ..." (validator-enforced
  against the `Month YYYY` pattern).
- `source_url` + `as_of` required; `reviewed: true` only after verifying the fact
  against the source article. Known flags (e.g. photo attribution in
  `news-20261014-29`) must be resolved, not assumed.
- Factual, not partisan. Prefer science, culture, sports, business, space, geography,
  notable firsts. Avoid tragedies and violent events as quiz material entirely.
- The correct answer must be verifiable from the linked article alone.

## Quality gates (all required before a question ships)

1. `npm run validate:questions` — field rules, ID format/uniqueness, duplicate
   question text, explanation constraints, joke count. Zero errors.
2. Read the new questions once as a player: would anyone chuckle at the 5th choice?
   Can an informed player defend any of the 3 plausible wrongs? Does the explanation
   teach something?
3. Duplicate checks the validator can't fully catch: no duplicated joke answers
   (command above), no near-duplicate questions across banks, consistent answer
   capitalization/prefixes within each choice set.
4. `npx vitest run` green (schema + store tests pin the 5-choice shape:
   `incorrect_answers` length 4, `choices` length 5 after shuffle).
