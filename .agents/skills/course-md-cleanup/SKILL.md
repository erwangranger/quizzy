---
name: course-md-cleanup
description: Clean docling-extracted academic readings in .course-extracted/. Use when asked to process, clean, fix, or improve course article Markdown files, remove extraction artifacts (publisher banners, watermarks, escaped underscores, scan-garbled text), or make readings more AI-readable.
---

# Cleaning docling course readings

Input: `.md` files in `.course-extracted/`, each produced by docling from an academic PDF, with sidecar `<name>_artifacts/` image dirs. Output: same files, cleaned in place; artifacts kept. Goal is AI-consumable text: full paragraphs, correct characters, no publisher noise. The text is academically sensitive; `docling` errors are ground truth for format, but original wording is never rewritten. Table cells and headings get hand-checked; anything else that needs judgment (a garbled phrase with no obvious source text) is flagged inline with `<!-- CLEANUP: ... -->`.

## Pass order

Run in order; each pass assumes the previous finished. After the sweep, spot-check per the completion gate.

### 1. Sweep publisher noise

Delete whole lines (and their following blank line) matching these classes, wherever they appear:

- Download/access banners: any line containing `Téléchargé`, `Downloaded from`, `EBSCOhost`, `JSTOR`, `IP:`, `© ANDESE`, `Sage Reference`, "For the most optimal reading experience", "The current issue and full text archive of this journal is available".
- PDF-generator footers: lines with `TCPDF`, `Powered by TCPDF`.
- Copyright/permission boilerplate blocks (Cairn reproduction bans, Wiley "Copyright of ...", SAGE "All Rights Reserved" headers, Emerald archive links) — delete the block, but keep any DOI, ISSN, or citation info it contains: one `Source:` line under the title preserves what the article needs.
- Horizontal rules made of escaped underscores (`\_\_\_...`, 14 across the corpus) or 30+ dashes.
- Banner lines inside paragraphs: they sit on their own lines but split sentences across page breaks; when the surrounding text resumes mid-sentence, rejoin the halves (the Cairn footer line precedes an `\_\_\_` rule and the continuation text).

### 2. Unescape Markdown

Docling escapes Markdown punctuation; unescape by character class, in one scripted pass over all files:

- `\_` → `_` (1167 occurrences across the corpus — the dominant artifact).
- Also map `\*` `\`` `\#` `\-` `\(` `\)` `\[` `\]` `\{` `\}` `\!` — only when preceded by a backslash that docling added. Do this before the scan pass so escaped characters stop hiding matches.

### 3. Fix characters and entities

Scripted, corpus-wide:

- `&amp;` → `&`, `&lt;` → `<`, `&gt;` → `>`, `&nbsp;` → space, numeric entities (`&#...;`) → their characters.
- Scan-era mojibake: `Ô...Õ` → `'...'` (the SAGE typographic-quote corruption: opening `Ô`, closing `Õ`; 94× in Kraatz); `€` for umlaut in German names (`Schrey€ogg` → `Schreyögg`, `Universit€at` → `Universität`, `G€underson`, `K€arreman` — 11× in Dobusch); spacing-acute + backtick accents (Brès: `´e`→`é`, `´` after letter → acute accent: `Qu´ebec`→`Québec`, `Br\`es`→`Brès`, ×13); `Scence`→`Science`, `Scences`→`Sciences` (systematic misscan, Hardy).
- Unicode accents in filenames and headings must survive untouched (Barmeyer, Schreyögg, Brès): never run ASCII-only "fixes" that strip them.

### 4. Repair OCR damage

Scan-quality corruption is local and irregular; check for it but fix only unambiguous cases:

- Words split by the scanner: `[a-z] [a-z]` inside a word (e.g. `e st`, `ges tion`, `th ématique`, `indiv idus`) — rejoin only when the result is a real word in context.
- Missing/garbled fragments in scanned pages (`Hardy, 1991` lines like `eo nn ine n nne ne`, `a d        id  s  kssn`): replace with `<!-- CLEANUP: garbled OCR: <context> -->`; never guess prose.
- Heading case: docling often mangles ALL-CAPS headings (`OR�ANISATION`): restore readable Title Case from the source text when obvious; otherwise flag.
- Footnote markers: docling drops superscript digits into the body (`endroits clefs 8`). Leave inline numbers alone unless clearly a footnote marker adjacent to a visible footnote line; footnotes at page bottom: keep as `^n` lines near their paragraph, flagged if placement is uncertain.

### 5. Restructure for AI readability

- Images: docling emits `![Image](..._artifacts/image_*.png)` for every page fragment including logos, banners, and decorative rules. Delete image links for covers/banners/logos (the first images in Cairn/JSTOR/SAGE/Battilana files). Keep genuine figures/charts/tables-as-images; ensure each kept image is directly preceded by its caption line (`Figure 1. ...`, `Table 2`, `Exhibit 3`) so an AI can bind caption to image.
- Tables: docling flattens many tables into image links plus stray text lines. Where a table exists as an image with its caption, replace the loose text-fragment lines with a proper Markdown table only if the content is recoverable from the text itself; if the table lives only in the image, keep the image and its caption, delete the orphan fragments.
- Headings: normalize heading levels so the title is `#` and sections nest logically (`##`, `###`). Docling emits everything as `##`.
- Paragraph flow: where the sweep removed banners mid-paragraph, rejoin the split sentence halves.
- Do NOT renumber or reorder sections; the goal is readability, not repagination.

## Completion gate

For each file:

1. Re-run the banner-pattern scan: zero matches remaining.
2. Zero `&amp;`, `Ô`, `\_` runs, and no `€` before letters.
3. Random-check 3 paragraphs per file against the list: no mid-sentence noise, no orphaned image links, paragraph text is continuous.
4. `<!-- CLEANUP: ... -->` markers count reported per file. Marker count > 0 is acceptable; unflagged known-garble is not.

## Corpus notes

- `Areski et al, 2016.md` — French. Cairn banners ×15 (worst file), 2 copyright/ANDESE lines, TCPDF footer, banner splits mid-sentence at every page break. Title contains a mojibake `�`.
- `Kraatz et Block, 2010.md` — SAGE platform front matter (Keywords/Disciplines/Access Date block → condense to a `Source:` metadata line, drop the rest); `Ô...Õ` quote corruption ×94; no images.
- `Battilana, 2012- In_Search_of_the_Hybrid_Ideal.md` — magazine layout: 21 images, pull-quotes, sidebars; most images are decoration. Expect reordering artifacts.
- `Barmeyer & Rodrigue, 2023.md` — Emerald: large artifact dir (1.7 MB) suggests many figure images.
- `Dobusch & Schoeneborn, 2015.md` — JSTOR cover pages; `€`-for-umlaut corruption ×11 (`Schrey€ogg`, `Universit€at`).
- `Schreyögg & Sydow, 2010.md` — JSTOR: cover pages, accession dates.
- `Brès et al., (2017).md` — IJMR: combining-acute accents ×10 (`Qu´ebec`, `Universit´e`) and backtick-grave names (`Br\`es` ×3); combining-character filename (`Bre%CC%80s`).
- `Ruff et al., (2022).md`, `King, 2017_International_Development.md` — cleanest files; light touch.
- `Jarzabkowski, P. and Fenton, E. (2006).md` — LRP logo images, footnotes with exhibit references.
