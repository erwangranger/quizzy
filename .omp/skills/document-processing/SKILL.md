---
name: document-processing
description: How to bulk-download documents and extract text and images as Markdown with docling — source/extracted folder layout, the exact convert command, image-link quirks (artifact nesting, URL encoding), and the link-resolution verification gate.
---

# Document processing (download → Markdown)

Applies when asked to download documents (course readings, paper dumps) or extract
text/images from PDFs into editable Markdown.

## Layout

Two folders per corpus, both git-ignored (append `<dir>/` to `.gitignore`):

| Folder | Contents |
|---|---|
| `<corpus>-source/` | Downloaded originals, untouched |
| `<corpus>-extracted/` | One `.md` per input + `<Doc>_artifacts/*.png` |

Download with `curl -L -o "<dir>/<name>" "<url>"`, keeping the user's file names.

## Conversion

Install once: `uv tool install docling` (first run pulls models, minutes; later docs
run ~1–2 s/page on Apple Silicon).

```bash
docling convert --from pdf --to md --image-export-mode referenced \
  --output <corpus>-extracted "<corpus>-source/"
```

- `--image-export-mode referenced` is REQUIRED: the default (`embedded`) base64-inlines
  every image into the Markdown.
- Batch the whole folder in one call; docling converts serially and logs per-document
  timing.
- `--to md` is the default; add `--to json` to also get the structured docling document.

## Quirks to fix after conversion

1. **Artifact nesting**: with `--output <out> "<in>/"`, `.md` files land in `<out>/` but
   images land one level deeper, in `<out>/<in-basename>/<Doc>_artifacts/` — the source
   folder's basename is re-created inside the output root. Flatten and rewrite the links
   (`sed -i ''` is the BSD/macOS form):
   ```bash
   cd <out> && mv <in-basename>/*_artifacts . && rmdir <in-basename>
   find . -maxdepth 1 -name '*.md' -print0 | xargs -0 sed -i '' 's|](<in-basename>/|](|g'
   ```
   Left unflattened the links still resolve (they encode the nesting), so this is layout
   hygiene, not correctness.
2. **URL-encoded links**: docling percent-encodes image paths (`%20` for spaces; non-ASCII
   decomposed — `Brès` → `Bre%CC%80s`). That is correct Markdown; never "unencode" it.

## Verification gate (all before reporting done)

1. One `.md` per source document (`ls <out>/*.md | wc -l`).
2. Every internal image link resolves after percent-decoding; zero required
   (`http`-prefixed hits are external hyperlinks, not images):
   ```bash
   grep -ho '](\([^)]*\))' *.md | tr -d ']()' | grep -v '^http' | sort -u | python3 -c "
   import sys, urllib.parse, os
   broken = [l.strip() for l in sys.stdin if not os.path.exists(urllib.parse.unquote(l.strip()))]
   print('BROKEN:', len(broken)); [print(p) for p in broken]"
   ```
3. Spot-read one `.md`: headings, tables, and at least one image link present.
