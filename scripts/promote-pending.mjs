#!/usr/bin/env node
// Moves reviewed questions out of questions/pending/ into the shipped news
// banks (questions/recent-news.json for en, questions/fr-recent-news.json for
// fr), drops the unreviewed ones, deletes the emptied pending files, then
// runs the validator. Run on the review branch before merging.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PENDING_DIR = join('questions', 'pending')
const BANKS = { en: join('questions', 'recent-news.json'), fr: join('questions', 'fr-recent-news.json') }

if (!existsSync(PENDING_DIR)) {
  console.log('No questions/pending/ directory — nothing to promote.')
  process.exit(0)
}

const banks = Object.fromEntries(Object.entries(BANKS).map(([lang, path]) => [lang, JSON.parse(readFileSync(path, 'utf8'))]))
let promoted = 0
let dropped = 0

for (const file of readdirSync(PENDING_DIR).filter((f) => f.endsWith('.json'))) {
  const path = join(PENDING_DIR, file)
  for (const q of JSON.parse(readFileSync(path, 'utf8'))) {
    if (q.reviewed === true && banks[q.lang]) {
      banks[q.lang].push(q)
      promoted++
    } else {
      dropped++
    }
  }
  rmSync(path)
}
if (readdirSync(PENDING_DIR).length === 0) rmSync(PENDING_DIR, { recursive: true })

for (const [lang, path] of Object.entries(BANKS)) writeFileSync(path, JSON.stringify(banks[lang], null, 2) + '\n')
console.log(`Promoted ${promoted} reviewed question(s), dropped ${dropped} unreviewed.`)

execFileSync('node', ['scripts/validate-questions.mjs'], { stdio: 'inherit' })
