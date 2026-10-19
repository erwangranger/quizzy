// Section-5 question data model. Questions live as JSON files in questions/
// and are bundled at build time via import.meta.glob, so play works offline.
export type Lang = 'en' | 'fr'
export type Category =
  | 'geography'
  | 'history'
  | 'science'
  | 'arts-literature'
  | 'entertainment'
  | 'sports-leisure'
  | 'recent-news'
export type Difficulty = 1 | 2 | 3
export type Origin = 'human' | 'claude'

export interface Question {
  id: string
  lang: Lang
  category: Category
  difficulty: Difficulty
  question: string
  correct_answer: string
  incorrect_answers: [string, string, string, string]
  explanation: string
  source_url: string | null
  as_of: string | null
  origin: Origin
  reviewed: boolean
}

export const CATEGORIES: readonly Category[] = [
  'geography',
  'history',
  'science',
  'arts-literature',
  'entertainment',
  'sports-leisure',
  'recent-news',
]

export interface ValidationIssue {
  id: string
  field: string
  message: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HTML_ENTITY = /&[a-zA-Z]+;|&#\d+;/
const MONTH_YEAR = /(January|February|March|April|May|June|July|August|September|October|November|December|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) 20\d{2}/
const SHORT_ID = /^[a-z-]+-\d{4}$/ // human questions and claude-generated general knowledge
const NEWS_ID = /^news-\d{8}-\d{2}$/ // claude-generated news-pipeline questions

// Validates one question object against the section-5 field rules.
// Returns issues found; empty array means valid. Shape-agnostic: accepts
// unknown input and reports everything wrong rather than throwing.
export function validateQuestion(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return [{ id: '(unknown)', field: 'question', message: 'must be an object' }]
  }
  const q = input as Record<string, unknown>
  const id = typeof q.id === 'string' ? q.id : '(missing id)'
  const fail = (field: string, message: string) => issues.push({ id, field, message })

  if (typeof q.id !== 'string' || q.id.length === 0) fail('id', 'must be a non-empty string')

  if (q.lang !== 'en' && q.lang !== 'fr') fail('lang', `must be "en" or "fr", got ${JSON.stringify(q.lang)}`)
  if (!CATEGORIES.includes(q.category as Category)) fail('category', `must be one of ${CATEGORIES.join(', ')}, got ${JSON.stringify(q.category)}`)
  if (![1, 2, 3].includes(q.difficulty as number)) fail('difficulty', `must be 1, 2 or 3, got ${JSON.stringify(q.difficulty)}`)

  if (typeof q.question !== 'string' || q.question.trim().length === 0) fail('question', 'must be a non-empty string')
  else if (HTML_ENTITY.test(q.question)) fail('question', 'must be plain text without HTML entities')

  if (typeof q.correct_answer !== 'string' || q.correct_answer.trim().length === 0) fail('correct_answer', 'must be a non-empty string')
  if (!Array.isArray(q.incorrect_answers) || q.incorrect_answers.length !== 4) {
    fail('incorrect_answers', 'must have exactly 4 items')
  } else {
    for (const wrong of q.incorrect_answers) {
      if (typeof wrong !== 'string' || wrong.trim().length === 0) fail('incorrect_answers', 'items must be non-empty strings')
      if (wrong === q.correct_answer) fail('incorrect_answers', `item equals correct answer: "${wrong}"`)
    }
  }

  if (typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
    fail('explanation', 'must be a non-empty string')
  } else {
    if (q.explanation.length > 400) fail('explanation', `exceeds 400 characters (${q.explanation.length})`)
    const sentences = q.explanation.split(/[.!?]+\s/).filter((s) => s.trim().length > 0).length
    if (sentences > 3) fail('explanation', `must be 1-3 sentences, found ${sentences}`)
  }

  if (q.source_url !== null && (typeof q.source_url !== 'string' || !/^https?:\/\//.test(q.source_url))) {
    fail('source_url', 'must be an http(s) URL or null')
  }
  if (q.as_of !== null && (typeof q.as_of !== 'string' || !ISO_DATE.test(q.as_of))) {
    fail('as_of', 'must be an ISO date (YYYY-MM-DD) or null')
  }
  if (q.category === 'recent-news') {
    if (typeof q.source_url !== 'string' || q.source_url.length === 0) fail('source_url', 'recent-news questions require a non-null source_url')
    if (typeof q.as_of !== 'string' || !ISO_DATE.test(q.as_of)) fail('as_of', 'recent-news questions require as_of')
    if (typeof q.question === 'string' && !MONTH_YEAR.test(q.question)) {
      fail('question', 'recent-news question text must be date-anchored (e.g. "In September 2026, ...")')
    }
  }

  if (q.origin === 'human' && typeof q.id === 'string' && !SHORT_ID.test(q.id)) {
    fail('id', `human id must match <category-prefix>-<4 digits>, got "${q.id}"`)
  }
  if (q.origin === 'claude' && typeof q.id === 'string' && !SHORT_ID.test(q.id) && !NEWS_ID.test(q.id)) {
    fail('id', `claude id must match <category-prefix>-<4 digits> or news-YYYYMMDD-<nn>, got "${q.id}"`)
  }
  if (q.origin !== 'human' && q.origin !== 'claude') fail('origin', `must be "human" or "claude", got ${JSON.stringify(q.origin)}`)
  if (typeof q.reviewed !== 'boolean') fail('reviewed', 'must be a boolean')

  return issues
}

// Validates a whole file (array) plus cross-file rules: ID uniqueness and
// duplicate question text. `file` names the source for error messages.
export function validateQuestionFile(data: unknown, file = 'input'): ValidationIssue[] {
  if (!Array.isArray(data)) {
    return [{ id: '(file)', field: file, message: 'file must be an array of question objects' }]
  }
  const issues: ValidationIssue[] = []
  const seenIds = new Map<string, string>()
  const seenTexts = new Map<string, string>()
  for (const item of data) {
    for (const issue of validateQuestion(item)) {
      issues.push({ ...issue, id: `${file} [${issue.id}]` })
    }
    if (typeof item === 'object' && item !== null) {
      const q = item as Record<string, unknown>
      if (typeof q.id === 'string' && q.id.length > 0) {
        if (seenIds.has(q.id)) issues.push({ id: q.id, field: 'id', message: `duplicate id (also in ${seenIds.get(q.id)})` })
        else seenIds.set(q.id, file)
      }
      if (typeof q.question === 'string') {
        const norm = q.question.trim().toLowerCase()
        if (seenTexts.has(norm)) issues.push({ id: q.id as string, field: 'question', message: `duplicate question text (also ${seenTexts.get(norm)})` })
        else seenTexts.set(norm, q.id as string)
      }
    }
  }
  return issues
}
