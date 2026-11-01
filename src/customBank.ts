// Custom question banks arrive via the ?bank= URL parameter, in three forms:
//   ?bank=https://host/bank.json  remote bank (host must send CORS headers)
//   ?bank=sample-bank.json        relative path (GitHub Pages subpath, Capacitor)
//   ?bank=<base64url JSON>        inline bank (works from any host)
// A custom bank is forced to category "custom" on load, so bank authors never
// set categories. Metadata is lenient (see normalizeCustomQuestion): missing
// lang, difficulty, source_url and as_of are filled with defaults. Everything
// that makes a question playable — exactly 4 incorrect answers, unique ids,
// explanation rules — is strict: invalid items are dropped and logged, never
// shipped half-broken.
import type { Lang, Question } from './questions/schema'
import { validateQuestion, type ValidationIssue } from './questions/schema'

export const BANK_PARAM = 'bank'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const BANK_URL = /^https?:\/\//i

// The loaded custom bank (empty until setCustomBank runs at bootstrap).
// questionBank merges it into the play pool; an empty bank means a normal game.
let bank: Question[] = []

export function setCustomBank(questions: Question[]): void {
  bank = questions
}

export function getCustomBank(): Question[] {
  return bank
}

export interface CustomBankResult {
  questions: Question[]
  errors: string[]
  source: string
}

// Reads the ?bank= parameter from an href, or null when there is none.
export function readBankParam(href: string = window.location.href): string | null {
  try {
    return new URL(href).searchParams.get(BANK_PARAM)
  } catch {
    return null
  }
}

// base64url → UTF-8 text. Throws when the value is not valid base64 or JSON.
function decodeInlineBank(value: string): string {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// Normalizes one custom-bank question. Missing or invalid metadata falls back
// to defaults (lang en, difficulty 2, no source/as_of); `category` is forced
// to "custom" and `reviewed` to true. Returns the play-ready Question, or the
// issues that make it unusable.
export function normalizeCustomQuestion(
  input: unknown,
  allocateId: () => string,
): { q?: Question; issues: ValidationIssue[] } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { issues: [{ id: '(unknown)', field: 'question', message: 'must be an object' }] }
  }
  const raw = { ...(input as Record<string, unknown>) }
  const authorId = typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : null
  raw.id = authorId ?? allocateId()
  raw.category = 'custom'
  raw.reviewed = true
  if (raw.lang !== 'en' && raw.lang !== 'fr') raw.lang = 'en'
  if (raw.origin !== 'human' && raw.origin !== 'claude') raw.origin = 'human'
  if (raw.difficulty !== 1 && raw.difficulty !== 2 && raw.difficulty !== 3) raw.difficulty = 2
  if (typeof raw.source_url !== 'string' || !/^https?:\/\//.test(raw.source_url)) raw.source_url = null
  if (typeof raw.as_of !== 'string' || !ISO_DATE.test(raw.as_of)) raw.as_of = null
  // explanation is shown at the reveal; missing or blank becomes empty, not a
  // dropped question — a bank without explanations stays playable.
  if (typeof raw.explanation !== 'string' || raw.explanation.trim().length === 0) raw.explanation = ''
  const issues = validateQuestion(raw)
  return issues.length > 0 ? { issues } : { q: raw as unknown as Question, issues: [] }
}

// Normalizes a whole custom bank: lenient per-question metadata, strict
// playability. Duplicate ids (author-supplied or colliding with allocated
// bank-NNNN ids) and duplicate question text are dropped with an error each.
export function normalizeCustomBank(input: unknown): { questions: Question[]; errors: string[] } {
  if (!Array.isArray(input)) {
    return { questions: [], errors: ['bank must be an array of question objects'] }
  }
  const questions: Question[] = []
  const errors: string[] = []
  const seenIds = new Set<string>()
  const seenTexts = new Set<string>()
  let next = 1
  const allocateId = () => {
    while (seenIds.has(`bank-${String(next).padStart(4, '0')}`)) next++
    const id = `bank-${String(next).padStart(4, '0')}`
    next++
    return id
  }
  for (const [index, item] of input.entries()) {
    const normalized = normalizeCustomQuestion(item, allocateId)
    if (!normalized.q) {
      const detail = normalized.issues.map((issue) => `${issue.field} ${issue.message}`).join('; ')
      errors.push(`question ${index}: ${detail}`)
      continue
    }
    const q = normalized.q
    if (seenIds.has(q.id)) {
      errors.push(`question ${index} [${q.id}]: duplicate id`)
      continue
    }
    const text = q.question.trim().toLowerCase()
    if (seenTexts.has(text)) {
      errors.push(`question ${index} [${q.id}]: duplicate question text`)
      continue
    }
    seenIds.add(q.id)
    seenTexts.add(text)
    questions.push(q)
  }
  return { questions, errors }
}

// Loads the bank named by the ?bank= parameter: fetches remote/relative banks,
// decodes inline ones, normalizes the result. Returns null when the URL has no
// ?bank= parameter (a normal game). Fetch and JSON failures come back as
// errors — a broken bank URL must never throw in the app's face.
export async function loadCustomBankParam(href: string = window.location.href): Promise<CustomBankResult | null> {
  const param = readBankParam(href)
  if (param === null || param.trim() === '') return null
  const value = param.trim()
  let data: unknown
  let source: string
  if (BANK_URL.test(value)) {
    source = value
    try {
      const res = await fetch(value)
      if (!res.ok) return { questions: [], errors: [`bank fetch failed: HTTP ${res.status}`], source }
      data = await res.json()
    } catch (e) {
      return { questions: [], errors: [`bank fetch failed: ${(e as Error).message}`], source }
    }
  } else if (value.endsWith('.json')) {
    source = value
    try {
      const res = await fetch(value)
      if (!res.ok) return { questions: [], errors: [`bank fetch failed: HTTP ${res.status}`], source }
      data = await res.json()
    } catch (e) {
      return { questions: [], errors: [`bank fetch failed: ${(e as Error).message}`], source }
    }
  } else {
    source = 'inline bank'
    try {
      data = JSON.parse(decodeInlineBank(value))
    } catch {
      return { questions: [], errors: ['inline bank is not valid base64url JSON'], source }
    }
  }
  const normalized = normalizeCustomBank(data)
  return { ...normalized, source }
}

// Preset setup for a loaded custom bank: the bank's language, the custom
// category selected, and a default count that fits the bank.
export const presetSetup = (questions: Question[]): { lang: Lang; categories: ['custom']; count: number } => ({
  lang: questions[0]?.lang ?? 'en',
  categories: ['custom'],
  count: Math.min(10, questions.length),
})
