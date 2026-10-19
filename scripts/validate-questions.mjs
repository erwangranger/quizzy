#!/usr/bin/env node
// Validates every questions/*.json file against the section-5 data model:
// field rules, ID uniqueness and duplicate question text. Exits non-zero on
// any error. Zero-dependency (Node builtins only) so CI needs nothing extra.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CATEGORIES = ['geography', 'history', 'science', 'arts-literature', 'entertainment', 'sports-leisure', 'current-events', 'recent-news']
const QUESTIONS_DIR = 'questions'

const errors = []
const seenIds = new Map()
const seenTexts = new Map()

function fail(file, id, msg) {
  errors.push(`${file}${id ? ` [${id}]` : ''}: ${msg}`)
}

let files
try {
  files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'))
} catch {
  console.log('No questions/ directory found — nothing to validate.')
  process.exit(0)
}

if (files.length === 0) {
  console.log('No question files found — nothing to validate.')
  process.exit(0)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HTML_ENTITY = /&[a-zA-Z]+;|&#\d+;/
const MONTH_YEAR = /(January|February|March|April|May|June|July|August|September|October|November|December) 20\d{2}/

for (const file of files) {
  const path = join(QUESTIONS_DIR, file)
  let data
  try {
    data = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    fail(path, null, `invalid JSON: ${e.message}`)
    continue
  }
  if (!Array.isArray(data)) {
    fail(path, null, 'file must be an array of question objects')
    continue
  }

  data.forEach((q, i) => {
    const id = typeof q.id === 'string' ? q.id : `(index ${i})`

    if (typeof q.id !== 'string' || q.id.length === 0) fail(path, id, 'id must be a non-empty string')
    if (seenIds.has(q.id)) fail(path, id, `duplicate id (also in ${seenIds.get(q.id)})`)
    else seenIds.set(q.id, path)

    const prefix = typeof q.id === 'string' ? q.id.split('-')[0] : ''
    if (q.origin === 'human' && !/^[a-z-]+-\d{4}$/.test(q.id ?? '')) {
      fail(path, id, `human id must match <category-prefix>-<4 digits>, got "${q.id}"`)
    }
    if (q.origin === 'claude' && !/^news-\d{8}-\d{2}$/.test(q.id ?? '')) {
      fail(path, id, `claude id must match news-YYYYMMDD-<nn>, got "${q.id}"`)
    }
    if (prefix === 'news' && q.origin !== 'claude') fail(path, id, 'news- ids are reserved for claude-origin questions')

    if (q.lang !== 'en' && q.lang !== 'fr') fail(path, id, `lang must be "en" or "fr", got ${JSON.stringify(q.lang)}`)
    if (!CATEGORIES.includes(q.category)) fail(path, id, `category must be one of ${CATEGORIES.join(', ')}, got ${JSON.stringify(q.category)}`)
    if (![1, 2, 3].includes(q.difficulty)) fail(path, id, `difficulty must be 1, 2 or 3, got ${JSON.stringify(q.difficulty)}`)

    if (typeof q.question !== 'string' || q.question.trim().length === 0) fail(path, id, 'question must be a non-empty string')
    else if (HTML_ENTITY.test(q.question)) fail(path, id, 'question must be plain text without HTML entities')

    if (typeof q.correct_answer !== 'string' || q.correct_answer.trim().length === 0) fail(path, id, 'correct_answer must be a non-empty string')
    if (!Array.isArray(q.incorrect_answers) || q.incorrect_answers.length !== 4) {
      fail(path, id, 'incorrect_answers must have exactly 4 items')
    } else {
      for (const wrong of q.incorrect_answers) {
        if (typeof wrong !== 'string' || wrong.trim().length === 0) fail(path, id, 'incorrect_answers items must be non-empty strings')
        if (wrong === q.correct_answer) fail(path, id, `incorrect answer equals correct answer: "${wrong}"`)
      }
    }

    if (typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      fail(path, id, 'explanation must be a non-empty string')
    } else {
      if (q.explanation.length > 400) fail(path, id, `explanation exceeds 400 characters (${q.explanation.length})`)
      const sentences = q.explanation.split(/[.!?]+\s/).filter((s) => s.trim().length > 0).length
      if (sentences > 3) fail(path, id, `explanation must be 1-3 sentences, found ${sentences}`)
      if (q.correct_answer && q.explanation.includes(q.correct_answer)) {
        // explanation may mention the answer but must add context; a pure restatement is shorter than the answer plus 20 chars
        if (q.explanation.trim().length < q.correct_answer.length + 20) {
          fail(path, id, 'explanation looks like a pure restatement of the answer')
        }
      }
    }

    if (q.source_url !== null && (typeof q.source_url !== 'string' || !/^https?:\/\//.test(q.source_url))) {
      fail(path, id, 'source_url must be an http(s) URL or null')
    }
    if (q.as_of !== null && (typeof q.as_of !== 'string' || !ISO_DATE.test(q.as_of))) {
      fail(path, id, 'as_of must be an ISO date (YYYY-MM-DD) or null')
    }

    if (q.category === 'current-events' || q.category === 'recent-news') {
      if (q.source_url === null || q.source_url === undefined) fail(path, id, 'current-events questions require a non-null source_url')
      if (!q.as_of) fail(path, id, 'current-events questions require as_of')
      if (typeof q.question === 'string' && !MONTH_YEAR.test(q.question)) {
        fail(path, id, 'current-events question text must be date-anchored (e.g. "In September 2026, ...")')
      }
    }

    if (q.origin !== 'human' && q.origin !== 'claude') fail(path, id, `origin must be "human" or "claude", got ${JSON.stringify(q.origin)}`)
    if (typeof q.reviewed !== 'boolean') fail(path, id, 'reviewed must be a boolean')
  })

  for (const q of data) {
    if (typeof q.question === 'string') {
      const norm = q.question.trim().toLowerCase()
      if (seenTexts.has(norm)) fail(path, q.id, `duplicate question text (also ${seenTexts.get(norm)})`)
      else seenTexts.set(norm, q.id)
    }
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} validation error(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const total = seenIds.size
console.log(`Validated ${total} question(s) across ${files.length} file(s). All checks passed.`)
