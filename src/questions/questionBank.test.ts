import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drawQuestions, getCategories, resetSeenQuestions, loadAllQuestions } from './questionBank'

// jsdom localStorage needs --localstorage-file; provide an in-memory mock so
// seen-question tracking is exercised deterministically.
const store = new Map<string, string>()
const storageMock = {
  getItem: (key: string) => (store.has(key) ? store.get(key) : null),
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => void store.clear(),
}
vi.stubGlobal('window', Object.assign(window, { localStorage: storageMock }))

describe('questionBank', () => {
  beforeEach(() => {
    resetSeenQuestions()
  })

  it('loads 61 reviewed questions from questions/*.json', () => {
    const all = loadAllQuestions()
    expect(all).toHaveLength(61)
    expect(all.every((q) => q.reviewed)).toBe(true)
  })

  it('derives categories from the data for the given language', () => {
    expect(getCategories('en')).toEqual([
      'geography',
      'history',
      'science',
      'arts-literature',
      'entertainment',
      'sports-leisure',
      'recent-news',
    ])
    // no fr questions in the sample data
    expect(getCategories('fr')).toEqual([])
  })

  it('draws the requested count without repeats within a game', () => {
    const { questions } = drawQuestions({ lang: 'en', categories: [], count: 10 })
    expect(questions).toHaveLength(10)
    const ids = new Set(questions.map((q) => q.id))
    expect(ids.size).toBe(10)
  })

  it('draws only from selected categories and requested language', () => {
    const { questions } = drawQuestions({ lang: 'en', categories: ['science'], count: 2 })
    expect(questions).toHaveLength(2)
    expect(questions.every((q) => q.category === 'science' && q.lang === 'en')).toBe(true)
  })

  it('draws only from the recent-news category', () => {
    const { questions } = drawQuestions({ lang: 'en', categories: ['recent-news'], count: 5 })
    expect(questions).toHaveLength(5)
    expect(questions.every((q) => q.category === 'recent-news' && q.reviewed)).toBe(true)
  })

  it('draws only the requested difficulty', () => {
    const { questions } = drawQuestions({ lang: 'en', categories: [], count: 5, difficulty: 1 })
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.difficulty === 1)).toBe(true)
  })

  it('prefers unseen questions and resets the pool when exhausted', () => {
    // 61 questions total: draw 60 (no reset), the next draw sees one unseen
    // question left, so the bank resets the pool to full before drawing.
    const first = drawQuestions({ lang: 'en', categories: [], count: 60 })
    expect(first.poolReset).toBe(false)
    const second = drawQuestions({ lang: 'en', categories: [], count: 10 })
    expect(second.poolReset).toBe(true)
    expect(second.questions).toHaveLength(10)
  })

  it('caps draws at the available pool size', () => {
    const { questions, poolReset } = drawQuestions({ lang: 'en', categories: [], count: 100 })
    expect(questions).toHaveLength(61)
    expect(poolReset).toBe(true)
  })

  it('tracks seen ids across draws until reset', () => {
    const first = drawQuestions({ lang: 'en', categories: [], count: 5 })
    const second = drawQuestions({ lang: 'en', categories: [], count: 5 })
    const overlap = first.questions.filter((q) => second.questions.some((s) => s.id === q.id))
    expect(overlap).toHaveLength(0)
    resetSeenQuestions()
    // Draw 60 of 61 so the post-reset draw must intersect the first draw.
    const third = drawQuestions({ lang: 'en', categories: [], count: 60 })
    const overlapAfterReset = first.questions.filter((q) => third.questions.some((s) => s.id === q.id))
    // 60 of 61 drawn excludes at most one of the first draw's 5.
    expect(overlapAfterReset.length).toBeGreaterThanOrEqual(4)
  })

  it('returns an empty result with no poolReset for an unknown language', () => {
    const { questions, poolReset } = drawQuestions({ lang: 'fr', categories: [], count: 5 })
    expect(questions).toHaveLength(0)
    expect(poolReset).toBe(false)
  })
})
