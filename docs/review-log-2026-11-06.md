# Review log — new question JSON files (2026-11-06)

Reviewed against `skill://quizzy-question-crafting` + `docs/SPEC.md` gates. All 16 new/changed
JSON files read in full; every factual defect below was verified against a primary source
before the fix. This log records what was found, what was criticized, and what was changed.

## Files reviewed

| File | Count | Status before | Actions taken |
|---|---|---|---|
| `public/logic-bank_en.json` (new) | 50 | Clean | None needed |
| `public/logic-bank_fr.json` (new) | 50 | Clean content | 273 ASCII `'` → typographic `’` to match the fr-bank convention |
| `scratch/*-en.json` × 6 (new) | 65 | 4 factual defects + joke leaks | Fixed; ids still `PENDING` |
| `scratch/*-fr.json` × 6 (new) | 65 | Same defects in twins | Fixed in parallel |
| `public/demo-bank.json` | 5 | Pre-existing demo | Untouched (not new) |
| `public/sample-bank.json` | 10 | Pre-existing sample | Untouched (not new) |

## Factual defects found and fixed (EN + FR twins)

### 1. Kazaam wrong year — `entertainment-en/fr`
**Was:** "Which **1984** film about a wish-granting genie ... stars Shaquille O'Neal?"
**Defect:** Kazaam is a **1996** film (verified: en.wikipedia.org/wiki/Kazaam, AFI catalog,
Box Office Mojo). The question text stated a false premise and graded the player on it;
the explanation contradicted the question inside the same object.
**Fix:** Question now reads "Which 1996 film stars basketball player Shaquille O'Neal as a
rapping genie who grants three wishes?" Both languages.

### 2. Into the Woods confabulated premise — `entertainment-en/fr`
**Was:** "Which long-running Broadway musical features a man made of household junk brought
to life by a witch?"
**Defect:** No such character exists in Into the Woods (verified against the full synopsis:
baker + wife cursed by a witch, four items to collect). No source supports a junk man; the
question has no defensible answer and the explanation invented a "Household Helpful"
transformation of Jack's mother. Distractors were arbitrary because every answer was
equally correct (i.e. all wrong).
**Fix:** Replaced with a verifiable fact: "Which Stephen Sondheim musical intertwines the
fairy tales of Jack, Cinderella, Little Red Riding Hood and Rapunzel?" Explanation now
states Sondheim/Lapine, 1987 Broadway, Grimm tales around the baker's curse. Same source
URL retained. Both languages.

### 3. Waldner two-golds claim false — `sports-leisure-en/fr`
**Was:** "Which table tennis player won the gold medal at both the 1988 and 1992 Olympics
in the men's singles?" → Jan-Ove Waldner
**Defect:** Seoul 1988 men's singles gold went to **Yoo Nam-kyu** (South Korea); Waldner won
only Barcelona 1992 (verified: olympedia.org, olympics.com results, The Independent
7 Aug 1992). Defensible-distractor rule broken: anyone who knows 1988 cannot pick Waldner.
**Fix:** Rewrote to the true claim: "Which Swedish table tennis player won the Olympic
men's singles gold at Barcelona 1992, earning the nickname the Evergreen Tree in China?"
Explanation now names Yoo Nam-kyu as the 1988 winner. **Bonus:** Yoo Nam-kyu replaces
Deng Yaping as distractor — she is a women's-singles champion and was a gender giveaway.

### 4. Eswatini single-neighbour contradiction — `geography-en/fr`
**Was:** "Which landlocked country in Southern Africa is surrounded by a single neighbour?"
→ Eswatini
**Defect:** Eswatini has **two** neighbours (South Africa + Mozambique) — the question's own
explanation said so ("Lesotho is the only country in the world entirely surrounded by ONE
neighbour"). The correct answer was refuted by its own explanation.
**Fix:** Question now asks "Which country is entirely surrounded by the territory of a
single other country?" → **Lesotho**, with Eswatini, Andorra, Bhutan as plausible
distractors (Eswatini is the deliberate near-miss). Source moved to the Lesotho article.
Both languages.

### 5. EN/FR twins diverged on saltiest water — `geography-en/fr`
**Was:** EN "Which is the saltiest body of water on Earth (outside of ponds and lakes)?"
vs FR "Quelle étendue d'eau est la plus salée du monde, lacs compris ?"
**Defect:** Twin questions must ask the same question. The EN parenthetical also
self-sabotaged: it excluded ponds from the ranking while the correct answer IS a pond
(Gaet'ale Pond), making the question self-contradictory. FR said "lacs compris" while one
distractor (Great Salt Lake) is a lake — inconsistent.
**Fix:** Both now ask the plain superlative: EN "Which body of water is the saltiest on
Earth?" / FR "Quel plan d'eau est le plus salé du monde ?" Fact itself verified
(en.wikipedia.org/wiki/Gaet'ale_Pond: 43% salinity, saltiest water body on Earth; Dead Sea
~34%).

### 6. Oxygen share wrong in EN — `science-en`
**Was:** "Which chemical element makes up about **28 percent** of Earth's crust by mass,
the largest share?" → Oxygen
**Defect:** Oxygen is ~**46%** by mass; ~28% is silicon's share (second place). The FR twin
had the right number — EN/FR divergence caught it. The EN explanation even stated the
correct split, contradicting its own question.
**Fix:** EN question now reads "about 46 percent", matching the FR twin and the explanation.

### 7. Cricket scoring unit — `sports-leisure-fr`
**Was:** FR explanation called 100 runs "100 points".
**Fix:** FR question + explanation now say "courses" (runs). FR distractors also replaced:
"Une tonne"/"Une centaine" were near-synonyms of the correct "Un siècle" (a century is
literally called a ton); replaced with "Un canard" (a duck — real cricket term, wrong
thing) and kept "Un doublé".

### 8. Tennis question asked the wrong thing — `sports-leisure-en/fr`
**Was:** "How many points must a player win a game ... by two, and what is the sequence of
points called after deuce?" → Advantage
**Defect:** Two questions in one (skill rule: one question, one ask), and the correct
answer ("Advantage") answered neither part cleanly.
**Fix:** Single clean ask: "In tennis, what is the score called when a game is tied at
40-40 ... ?" → Deuce (FR: Égalité). "Advantage" moved to the distractors where it belongs.

### 9. Typos and grammar
- `arts-literature-fr` Hobbit explanation: "au trilogy du" → "à la trilogie du".
- `history-en` Adams joke "The runner-up with a hobby of vice" (garbled, reads as an
  accusation) → "The runner-up promoted to number one".
- `history-fr` twin "Le finaliste avec une vice de choc" (wrong gender; "une vice" is
  incorrect French) → "Le finaliste promu numéro un".
- `arts-literature-en` line-188 indentation glitch (`  "as_of"`) normalized.

## Joke-quality fixes (5th-choice rule: chuckle, never leak)

Cut for leaking or rewording the answer (informed players could defend them / they gave
the game away):

| Question | Old joke | New joke |
|---|---|---|
| Three Musketeers (en) | "The other Alexandre" (alias of the answer) | "Dumas and Son" |
| Three Musketeers (fr) | "L'autre Alexandre" | "Père et Fils Dumas" |
| Spinal Tap (en) | "The amp that goes to eleven" (restates the quiz fact) | "A very loud guitarist" |
| Spinal Tap (fr) | "L'ampli qui monte à onze" | "Un guitariste très puissant" |
| Haiku (en) | "A very small poem with a chi" (dead frame) | "Seventeen haikus in a trench coat" |
| Haïku (fr) | "Un tout petit poème avec un chi" | "Dix-sept haïkus sous un long manteau" |
| Nighthawks (en) | "The waiter who never came" (plausible-diner detail) | "The coffee refill that never came" |
| Nighthawks (fr) | "Le serveur qui n'est jamais venu" | "Le café qui n'est jamais arrivé" |
| Heart (en) | "One for every ex" (punches at nothing, off-topic) | "Two upstairs, two downstairs" |
| Cœur (fr) | "Une par ex" | "Deux à l'étage, deux en bas" |
| DNA (en) | "Twist and Shout" (defensible — the helix twists) | "Helix and Sons, DNA plumbers" |
| ADN (fr) | "Twist et Shout" | "Helix et Fils, plombiers de l'ADN" |
| Morocco (en) | "The city that starts with M and loses" (could be a riddle for Marrakesh) | "The city with the most famous M" |
| Maroc (fr) | "La ville qui commence par M et qui perd" | "La ville au M le plus célèbre" |
| Mercury (fr) | "Celle qui a le meilleur bronzage" (arguably true) | "Celle qui a la meilleure crème solaire" |
| Octopus blood (fr) | "Bordeaux, évidemment" (a real red — too close) | "Bordeaux grand cru, évidemment" |
| Octopus blood (en) | "Burgundy, obviously" | "Burgundy, and it pairs with fish" |
| Water (en) | "Wet and wetter" (dead frame, no image) | kept — reviewed, judged fine as playful non-answer |
| Eau (fr) | "Mouillé et très mouillé" | kept |

## What passed review (no changes)

- **Logic banks (100/100):** every question passes the 5-way test; explanations teach
  (Wason cards, affirming the consequent, Bayes base-rate, Simpson's paradox, Wald,
  Ellsberg, Schelling focal points); joke slot is unmistakably wrong and good-natured
  in all 100; difficulty spread 1×17/2×17/3×16 per language; no duplicated jokes within
  or across the pair; FR twins are faithful translations with per-language jokes.
- **All 120 scratch questions:** `explanation ≤ 400 chars`, 1–3 sentences, adds context
  (validated); `source_url` present on all 120, all Wikipedia, no nulls; `as_of` null
  (correct — not news); `origin: claude`, `reviewed: true`; difficulty mix roughly
  half 1 / third 2 / rest 3 as per the batch rule.
- **Cross-bank uniqueness:** no duplicate joke answers within either language across the
  12 scratch files + both logic banks (114 unique per language); no duplicate question
  text per language; twin pairing 1:1 with matching category + difficulty in every slot.

## Validation gates run after fixes

- `npm run validate:questions` → 822 questions across 6 files, all checks passed
  (1 pre-existing warning: geo-0042 near-duplicate of geo-0015, similarity 0.82 —
  not touched here, predates this review).
- `npm test` → 4 files, 81 tests, all green.
- Structural pass on all 14 touched/inspected files: 4 incorrect answers each, none
  equal to the correct answer, no duplicate options within a set — all clean.
- JSON syntax validated on all modified files.

## Outstanding (not blocking, needs owner decision)

1. **IDs.** All 120 scratch questions still carry `id: "PENDING"`. Per the skill's
   ID-allocation rule they must become `<prefix>-<NNNN>` / `<prefix>-fr-<NNNN>` at
   promotion time. Current maxima from 2026-10-25: geo 0022, hist 0022, scie 0018,
   arts 0018, ente 0016, spor 0016 → start at +1 each. Do this when promoting into
   `questions/general-knowledge_{en,fr}.json`, not before.
2. **Duplicated-answer overlap with the existing banks** was not machine-checked against
   the two general-knowledge files (the validator's duplicate-text check runs at
   promotion time); recommend re-running `npm run validate:questions` immediately after
   the merge, when the questions are in the bundled banks.
3. `scratch/` files duplicate content that may also exist in the current banks (e.g.
   heart chambers, Mars moons are classic GK staples) — expect the validator's
   near-duplicate detector to flag some at promotion; trim or rewrite then.
4. The near-duplicate warning `geo-0042` vs `geo-0015` in `general-knowledge_en.json`
   predates this review (both shipped) — separate cleanup candidate.
