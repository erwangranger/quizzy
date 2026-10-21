#!/usr/bin/env node
// Prints the recent-news questions (shipped banks plus questions/pending/)
// whose as_of falls within the last N days, as JSON lines of id, lang, as_of
// and question text. The news-questions run reads this to avoid duplicates
// and to pick the next free news-YYYYMMDD-<nn> ids.
// Usage: node scripts/news-context.mjs [--days 90]
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dirs = ['questions', join('questions', 'pending')]
const daysFlag = process.argv.indexOf('--days')
const days = daysFlag === -1 ? 90 : Number(process.argv[daysFlag + 1])
if (!Number.isInteger(days) || days <= 0) {
  console.error('--days must be a positive integer')
  process.exit(1)
}
const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

const rows = []
for (const dir of dirs) {
  if (!existsSync(dir)) continue
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    for (const q of JSON.parse(readFileSync(join(dir, file), 'utf8'))) {
      if (q.category === 'recent-news' && q.as_of && q.as_of >= cutoff) {
        rows.push({ id: q.id, lang: q.lang, as_of: q.as_of, question: q.question })
      }
    }
  }
}

rows.sort((a, b) => a.as_of.localeCompare(b.as_of) || a.id.localeCompare(b.id))
for (const row of rows) console.log(JSON.stringify(row))
console.error(`${rows.length} recent-news question(s) with as_of on or after ${cutoff}.`)
