---
name: quizzy-question-crafting
description: How to craft, review, and batch-generate quiz questions for the Quizzy question banks (questions/*.json) — data model, 5-way choices with a joke answer, sensitive-topic handling, the validation gates every question must pass, and the "create X new questions" batch workflow.
---

# Crafting Quizzy questions

Applies to every question in the four banks — `questions/general-knowledge_en.json` + `questions/general-knowledge_fr.json` (general knowledge) and `questions/recent-news.json` + `questions/fr-recent-news.json` (news) — and to questions staged in `questions/pending/` (news review queue). The validators are the arbiter —
`npm run validate:questions` must pass before anything ships — but most rules below
are quality rules the validators cannot check.

## Data model

Every question is one JSON object in a questions/*.json array. Full rules in `docs/SPEC.md`
(data-model section) and enforced by `src/questions/schema.ts` + `scripts/validate-questions.mjs`.

| Field | Rule |
|---|---|
| `id` | Unique across all files. Human and claude general-knowledge questions: `<category-prefix>-<4 digits>` (e.g. `geo-0003`). News questions: `news-YYYYMMDD-<nn>` (e.g. `news-20261014-29`). `news-` prefix is reserved for `origin: "claude"`. |
| `lang` | `"en"` or `"fr"` (banks are bilingual; fr banks mirror the en banks). |
| `category` | One of `geography`, `history`, `science`, `arts-literature`, `entertainment`, `sports-leisure`, `recent-news`. |
| `difficulty` | `1` easy, `2` medium, `3` hard. Calibrate: 1 = common knowledge, 2 = needs some knowledge, 3 = needs real knowledge of the topic. |
| `question` | Plain text. No HTML entities, no emoji, no double quotes inside strings (escape only if unavoidable). One question mark, one ask. |
| `correct_answer` | Short, unambiguous, exactly the canonical form (see style rules). |
| `incorrect_answers` | Exactly 4 items: 3 plausible distractors + 1 joke answer (see below). None may equal the correct answer or duplicate each other across the whole bank. |
| `explanation` | 1–3 sentences, ≤400 chars. Must ADD context, never restate the answer (the validator rejects pure restatements: shorter than answer length + 20 chars). This is where the player learns something. |
| `source_url` | http(s) URL or null. REQUIRED for `recent-news` — link the actual article the fact came from. |
| `as_of` | ISO date `YYYY-MM-DD` or null. REQUIRED for recent-news — the date the fact was true. |
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

- As short as the laugh allows: deadpan 1-4 words; 5 words only when the extra words ARE the joke (e.g. "The waterfall with a fear of heights"); never more than 8.
- Plain text, JSON-safe (no double quotes, backslashes, HTML entities, emoji).
- Failure modes to cut when reviewing (each with its fix):
  - Dead frame ("The one with...", "Long enough that...", "Whatever number..."): cut the frame, keep the image. "The one with the dragons and no plot" becomes "Dragons, but no plot".
  - Explanatory tail (a clause explaining why it is funny): delete the tail, go deadpan. "A sushi chef with a very steady hand" becomes "A sushi chef, obviously".
  - Subtitle clause (setup:punchline in one string): keep one image only. "Moonwalk Meditation: 45 Minutes of Light Breathing" becomes "45 minutes of light breathing".
- Unmistakably wrong to anyone who knows the topic — absurd, exaggerated, or playfully literal.
- Family-friendly and good-natured. Universal humor only: no politics, no religion,
  no cruelty toward real named people, no dark or violent humor.
- Must differ from the 3 distractors and not reword the correct answer.
- Earn the chuckle from the *question's* world, not random nonsense:
  - Playful literalism: "November 32nd, definitely a Tuesday" (year question), "A full hour, because centuries" (leap-second question).
  - Absurd scale/entity: "A really big ice cube tray" (South Pole neutrino observatory), "Eleventy billion".
  - In-world nods: "The other Shakespeare", "A very talented turtle" (Mona Lisa/Ninja Turtles), "The Order of the DeLorean" (Michael J. Fox).
  - Playful non-answers: "Until the snacks run out", "Because it sounds cooler", "Yes, but only on Tuesdays".
- Vary the pattern across the bank — after generating jokes, run a uniqueness pass per language:
  `jq -sr '[.[0][], .[1][]] | .[] | .incorrect_answers[3]' questions/general-knowledge_en.json questions/recent-news.json | sort | uniq -d`
  `jq -sr '[.[0][], .[1][]] | .[] | .incorrect_answers[3]' questions/general-knowledge_fr.json questions/fr-recent-news.json | sort | uniq -d`
  Both must print nothing. Twins in the en and fr banks MAY share a joke (translation pairs do); only duplication within one language is a defect. (Parallel generation produced two hamster gags once; dedupe after.)
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

## News questions (recent-news)

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
4. `npm test` green — never bare `npx vitest run` (needs `--config config/vite.config.ts`).
   Schema + store tests pin the 5-choice shape: `incorrect_answers` length 4,
   `choices` length 5 after shuffle.

## Batch generation ("create X new questions")

Ordered workflow — an implementer makes zero design decisions:

1. **Parse the ask.** X = questions per language. "Create 50 new questions" → 50 en + 50 fr topic-paired (100 objects). en-only only if the user says so.
2. **Category spread.** Default: spread X roughly evenly across the six classic categories (1780ed5 mix of 200: geography 40, history 40, science 32, arts-literature 32, entertainment 28, sports-leisure 28). If the user names a category, all X in it. recent-news NEVER comes from this flow — date-anchored news goes through the news section + `questions/pending/` + `npm run promote:pending`.
3. **Target files.** Append en questions to `questions/general-knowledge_en.json`, fr twins to `questions/general-knowledge_fr.json`. Never touch the recent-news banks or `pending/` from this flow; never create a new questions file.
4. **ID allocation.** Per category prefix, find the max 4-digit suffix already in the target file (2026-10-25 maxima: geo 0022, hist 0022, scie 0018, arts 0018, ente 0016, spor 0016) and allocate sequentially from max+1. fr twin = same number with the -fr infix: `geo-0023` / `geo-fr-0023` (mirrors geo-0002/geo-fr-0002). Never reuse an ID, never touch `news-` IDs, never invent a category — the 7 in `scripts/validate-questions.mjs:11` are the only valid ones (a new category is schema/validator/locales plumbing, a separate task).
5. **Topic pairing.** The en question and its fr twin cover the same topic (geo-0002/geo-fr-0002 both "capital of Australia"). Translate question, correct answer, distractors, and explanation; the joke MAY differ per language but must pass the joke rules in both.
6. **Quality.** Every question follows the data-model table, the 5-way choice set (3 plausible distractors + 1 joke), and the sensitive-topic rules above. Difficulty mix target: ~half 1, ~third 2, rest 3 (1780ed5). `as_of` stays null for general knowledge (news-only field).
7. **Sources.** Every question carries `source_url` — a fact-specific Wikipedia (or equivalent primary-source) URL you have actually confirmed states the claim. A question whose claim cannot be verified from a source is DROPPED, not shipped (1780ed5 shipped 0 nulls). `explanation` adds 1–2 interesting facts beyond the answer (≤400 chars, never a restatement — the validator rejects restatements).
8. **Fact-check pass.** Before `reviewed: true`, verify each question against its source and fix defects in BOTH languages (1780ed5's review pass fixed 4 factual and 2 joke defects across both banks — Indurain five straight Tours, Rugby WC quadrennial, Mars joke aliasing the answer, a leaked fr joke in the en bank).
9. **Gates, in order.** (a) `npm run validate:questions` → zero errors. (b) Both per-language joke-dedupe commands above → print nothing. (c) Read the batch once as a player: would anyone chuckle at the 5th choice, can an informed player defend any plausible wrong, does each explanation teach something. (d) Update the pinned counts in `src/questions/questionBank.test.ts` — the load test pins the total and per-language counts (currently 322 / 161 / 161 at lines 23–26); set them to the new totals, then `npm test` green. Use `npm test`, never bare `npx vitest run` (needs `--config config/vite.config.ts`).
10. **Commit convention** (1780ed5): `feat: add N bilingual general knowledge questions, fact-checked and sourced`.

