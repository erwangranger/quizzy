// Unit tests for the flag-this-question report builder: URL encoding, title
// and body template, conditional lines, clipboard fallback text, custom banks.
import { afterEach, describe, expect, it } from 'vitest'
import { buildQuestionReport, clipboardText } from './questionReport'
import { getCustomBank, setCustomBank } from './customBank'
import type { Question } from './questions/schema'

const fixture: Question = {
  id: 'geo-0001',
  lang: 'en',
  category: 'geography',
  difficulty: 1,
  question: 'What is the capital of France?',
  correct_answer: 'Paris',
  incorrect_answers: ['Lyon', 'Marseille', 'Nice', 'Toulouse'],
  explanation: 'Paris has been the capital since 987 CE.',
  source_url: 'https://en.wikipedia.org/wiki/Paris',
  as_of: '2026-01-15',
  origin: 'human',
  reviewed: true,
}

afterEach(() => {
  setCustomBank([], null)
})

describe('buildQuestionReport', () => {
  it('builds an issues/new URL that round-trips title and body', () => {
    const report = buildQuestionReport(fixture, 'Wrong answer')
    expect(report.url.startsWith('https://github.com/erwangranger/quizzy/issues/new?')).toBe(true)
    const parsed = new URL(report.url)
    expect(parsed.searchParams.get('title')).toBe(report.title)
    expect(parsed.searchParams.get('body')).toBe(report.body)
  })

  it('encodes accents and question marks safely (fr text round-trips)', () => {
    const frQuestion: Question = {
      ...fixture,
      lang: 'fr',
      question: 'Quelle est la capitale de la France ?',
      correct_answer: 'Paris',
    }
    const report = buildQuestionReport(frQuestion)
    const parsed = new URL(report.url)
    expect(parsed.searchParams.get('body')).toContain('Quelle est la capitale de la France ?')
  })

  it('titles with id, category label and lang, appending the reason', () => {
    const plain = buildQuestionReport(fixture)
    expect(plain.title).toBe('Question feedback: geo-0001 (Geography, en)')
    const withReason = buildQuestionReport(fixture, 'Wrong answer')
    expect(withReason.title).toBe('Question feedback: geo-0001 (Geography, en) — Wrong answer')
  })

  it('bodies include question, answer, difficulty and metadata lines', () => {
    const report = buildQuestionReport(fixture, 'Wrong answer')
    expect(report.body).toContain('**Question:** What is the capital of France?')
    expect(report.body).toContain('**Correct answer:** Paris')
    expect(report.body).toContain('**Difficulty:** 1')
    expect(report.body).toContain('**Explanation:** Paris has been the capital since 987 CE.')
    expect(report.body).toContain('**As of:** 2026-01-15')
    expect(report.body).toContain('**Source:** https://en.wikipedia.org/wiki/Paris')
    expect(report.body).toContain('**Reason:** Wrong answer')
  })

  it('omits explanation/as_of/source lines when unset and reports reason as not specified', () => {
    const minimal: Question = {
      ...fixture,
      explanation: '',
      as_of: null,
      source_url: null,
    }
    const report = buildQuestionReport(minimal)
    expect(report.body).not.toContain('**Explanation:**')
    expect(report.body).not.toContain('**As of:**')
    expect(report.body).not.toContain('**Source:**')
    expect(report.body).toContain('**Reason:** Not specified')
  })

  it('clipboardText concatenates title, body and URL', () => {
    const report = buildQuestionReport(fixture, 'Dead source link')
    expect(clipboardText(report)).toBe(`${report.title}\n\n${report.body}\n\n${report.url}`)
  })

  it('identifies custom-bank questions via categoryLabel', () => {
    setCustomBank([{ ...fixture, id: 'bank-0001', category: 'custom', lang: 'en' }], 'demo-bank')
    const report = buildQuestionReport(getCustomBank()[0])
    expect(report.title).toContain('Custom: demo-bank')
  })
})

