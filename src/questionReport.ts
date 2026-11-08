// Builds a prefilled GitHub issue for reporting a bad question, plus the
// clipboard fallback text. The URL targets
// https://github.com/erwangranger/quizzy/issues/new?title=&body= — the repo has
// no issue templates, so the URL builder IS the mechanism (same repo the About
// screen links to). Reason strings arrive already localized (the chip labels);
// categoryLabel() reads the locale active at tap time, so the report matches
// what the player saw.
import type { Question } from './questions/schema'
import { categoryLabel } from './locales'

// Declared per-file like About.vue does; defined in config/vite.config.ts.
declare const __APP_VERSION__: string

const ISSUES_URL = 'https://github.com/erwangranger/quizzy/issues/new'

export interface QuestionReport {
  title: string
  body: string
  url: string
}

export function buildQuestionReport(q: Question, reason?: string): QuestionReport {
  const category = categoryLabel(q.category)
  const title = reason
    ? `Question feedback: ${q.id} (${category}, ${q.lang}) — ${reason}`
    : `Question feedback: ${q.id} (${category}, ${q.lang})`

  const lines = [
    `## Question feedback: ${q.id} (${category}, ${q.lang})`,
    '',
    `**Question:** ${q.question}`,
    `**Correct answer:** ${q.correct_answer}`,
    `**Category:** ${category} · **Language:** ${q.lang} · **Difficulty:** ${q.difficulty}`,
  ]
  if (q.explanation) lines.push(`**Explanation:** ${q.explanation}`)
  if (q.as_of) lines.push(`**As of:** ${q.as_of}`)
  if (q.source_url) lines.push(`**Source:** ${q.source_url}`)
  lines.push(
    '',
    `**Reason:** ${reason ?? 'Not specified'}`,
    '',
    '**Details:**',
    '<!-- What is wrong with this question? Which answer is wrong, or what has changed? -->',
    '',
    `_Reported from Quizzy v${__APP_VERSION__}._`,
  )
  const body = lines.join('\n')

  // URLSearchParams percent-encodes newlines, ?, quotes and accents correctly.
  const url = `${ISSUES_URL}?${new URLSearchParams({ title, body }).toString()}`

  return { title, body, url }
}

// Self-contained paste: title, blank line, body, blank line, URL.
export function clipboardText(report: QuestionReport): string {
  return `${report.title}\n\n${report.body}\n\n${report.url}`
}
