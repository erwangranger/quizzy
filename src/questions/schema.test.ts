import { beforeEach, describe, expect, it } from 'vitest'
import { validateQuestion, validateQuestionFile, type Question } from './schema'

function validQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'geo-0001',
    lang: 'en',
    category: 'geography',
    difficulty: 1,
    question: 'Which river flows through Montreal?',
    correct_answer: 'Saint Lawrence River',
    incorrect_answers: ['Ottawa River', 'Hudson River', 'Richelieu River', 'A very wide creek'],
    explanation:
      'Montreal sits on an island at the confluence of the Saint Lawrence and Ottawa rivers. The Saint Lawrence connects the Great Lakes to the Atlantic, which made the city a major port.',
    source_url: null,
    as_of: null,
    origin: 'human',
    reviewed: true,
    ...overrides,
  }
}

describe('validateQuestion', () => {
  it('accepts a fully valid question', () => {
    expect(validateQuestion(validQuestion())).toEqual([])
  })

  it('rejects invalid lang, category, difficulty and origin', () => {
    const issues = validateQuestion(
      validQuestion({ lang: 'de' as never, category: 'cuisine' as never, difficulty: 5 as never, origin: 'robot' as never }),
    )
    const fields = issues.map((i) => i.field)
    expect(fields).toContain('lang')
    expect(fields).toContain('category')
    expect(fields).toContain('difficulty')
    expect(fields).toContain('origin')
  })

  it('rejects HTML entities in question text', () => {
    const issues = validateQuestion(validQuestion({ question: 'What &amp; where?' }))
    expect(issues.map((i) => i.field)).toContain('question')
  })

  it('rejects wrong incorrect_answers count and duplicates of the correct answer', () => {
    const issues = validateQuestion(validQuestion({ incorrect_answers: ['A', 'B'] as never }))
    expect(issues.map((i) => i.field)).toContain('incorrect_answers')
    const tooMany = validateQuestion(validQuestion({ incorrect_answers: ['A', 'B', 'C', 'D', 'E'] as never }))
    expect(tooMany.map((i) => i.field)).toContain('incorrect_answers')
    const dup = validateQuestion(validQuestion({ incorrect_answers: ['Saint Lawrence River', 'B', 'C', 'D'] }))
  })

  it('rejects explanations over 400 chars or with more than 3 sentences', () => {
    const long = validateQuestion(validQuestion({ explanation: 'x'.repeat(401) }))
    expect(long.map((i) => i.field)).toContain('explanation')
    const sentences = validateQuestion(
      validQuestion({ explanation: 'One. Two. Three. Four.' }),
    )
    expect(sentences.map((i) => i.field)).toContain('explanation')
  })

  it('requires source_url, as_of and date-anchored text for current-events', () => {
    const issues = validateQuestion(
      validQuestion({
        category: 'current-events',
        question: 'What happened recently?',
        explanation: 'An event happened that was notable for quiz play.',
      }),
    )
    const fields = issues.map((i) => i.field)
    expect(fields).toContain('source_url')
    expect(fields).toContain('as_of')
    expect(fields).toContain('question')
  })

  it('accepts a valid current-events question with all anchors', () => {
    const issues = validateQuestion(
      validQuestion({
        id: 'news-20260901-01',
        origin: 'claude',
        reviewed: false,
        category: 'current-events',
        question: 'In September 2026, which spacecraft reached Mars?',
        correct_answer: 'Probe X',
        incorrect_answers: ['Probe Y', 'Probe Z', 'Probe W', 'Probe V'],
        explanation: 'Probe X entered Mars orbit in September 2026 after a seven-month cruise. It is the first mission of its program.',
        source_url: 'https://example.com/news',
        as_of: '2026-09-15',
      }),
    )
    expect(issues).toEqual([])
  })

  it('enforces id format per origin', () => {
    expect(validateQuestion(validQuestion({ id: 'bad_id' })).map((i) => i.field)).toContain('id')
    expect(validateQuestion(validQuestion({ id: 'news-20260901-01', origin: 'human' })).map((i) => i.field)).toContain('id')
  })
})

describe('validateQuestionFile', () => {
  it('rejects non-array files', () => {
    expect(validateQuestionFile({})).toHaveLength(1)
  })

  it('detects duplicate ids and duplicate question text across items', () => {
    const issues = validateQuestionFile([
      validQuestion(),
      validQuestion({ incorrect_answers: ['A', 'B', 'C', 'D'] }),
      validQuestion({ id: 'hist-0001', question: 'Which river flows through Montreal?  ', incorrect_answers: ['A', 'B', 'C', 'D'] }),
    ])
    const messages = issues.map((i) => i.message)
    expect(messages.some((m) => m.includes('duplicate id'))).toBe(true)
    expect(messages.some((m) => m.includes('duplicate question text'))).toBe(true)
  })
})
