#!/usr/bin/env node
// Prints share URLs for a question bank: one inline (base64url JSON in the
// ?bank= parameter) and one pointing at the file itself (host it anywhere with
// CORS — GitHub raw, Pages, gists). Pre-flight: validates the bank first and
// lists field issues so a broken bank never becomes a broken link. Zero
// dependencies (Node builtins only).
//   node scripts/encode-bank.mjs questions/my-bank.json
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/encode-bank.mjs <bank.json>')
  process.exit(1)
}

let raw
try {
  raw = readFileSync(file, 'utf8')
} catch (e) {
  console.error(`Cannot read ${file}: ${e.message}`)
  process.exit(1)
}

let data
try {
  data = JSON.parse(raw)
} catch (e) {
  console.error(`${file} is not valid JSON: ${e.message}`)
  process.exit(1)
}
if (!Array.isArray(data)) {
  console.error(`${file} must be an array of question objects`)
  process.exit(1)
}

// Same checks the app applies on load (scripts/validate-questions.mjs is the
// stricter arbiter for banks checked into the repo; the app normalizes
// metadata and drops invalid items, so only true garbage lands here).
const issues = []
for (const [index, q] of data.entries()) {
  if (typeof q !== 'object' || q === null || Array.isArray(q)) {
    issues.push(`question ${index}: not an object`)
    continue
  }
  if (typeof q.question !== 'string' || q.question.trim().length === 0) issues.push(`question ${index}: question must be a non-empty string`)
  if (typeof q.correct_answer !== 'string' || q.correct_answer.trim().length === 0) issues.push(`question ${index}: correct_answer must be a non-empty string`)
  if (!Array.isArray(q.incorrect_answers) || q.incorrect_answers.length !== 4) issues.push(`question ${index}: incorrect_answers must have exactly 4 items`)
  else if (q.incorrect_answers.some((a) => typeof a !== 'string' || a.trim().length === 0)) issues.push(`question ${index}: incorrect_answers items must be non-empty strings`)
  if (q.explanation !== undefined && (typeof q.explanation !== 'string' || q.explanation.trim().length === 0)) issues.push(`question ${index}: explanation must be a non-empty string when present`)
}

if (issues.length > 0) {
  console.error(`${file} has issues — fix them before sharing:\n  ${issues.join('\n  ')}`)
  process.exit(1)
}

// base64url-encode UTF-8, chunked so a large bank does not blow up one call
const bytes = new TextEncoder().encode(raw)
let binary = ''
const CHUNK = 0x8000
for (let i = 0; i < bytes.length; i += CHUNK) {
  binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
}
const inline = Buffer.from(binary, 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const origin = process.env.BANK_ORIGIN ?? 'http://localhost:5173'
console.log(`Questions: ${data.length}`)
console.log(`\nInline bank URL (bank travels in the URL, works from any host):\n  ${origin}/?bank=${inline}`)
console.log(`\nRemote bank URL (host ${file} with CORS enabled, then share its address):\n  ${origin}/?bank=${encodeURIComponent(file)}`)
console.log('\nNote: keep inline URLs under ~2000 characters (some browsers and chat apps truncate). For a bigger bank, use the remote form or split the bank.')
