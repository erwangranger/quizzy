import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drawQuestions, getCategories, resetSeenQuestions, loadAllQuestions } from './questionBank'
import type { Lang } from './schema'

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

  it('loads 322 reviewed questions from questions/*.json', () => {
    const all = loadAllQuestions()
    expect(all).toHaveLength(322)
    expect(all.every((q) => q.reviewed)).toBe(true)
    expect(all.filter((q) => q.lang === 'en')).toHaveLength(161)
    expect(all.filter((q) => q.lang === 'fr')).toHaveLength(161)
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
    // fr banks mirror the en categories
    expect(getCategories('fr')).toEqual([
      'geography',
      'history',
      'science',
      'arts-literature',
      'entertainment',
      'sports-leisure',
      'recent-news',
    ])
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
    // Draw all but one en question: no reset. The next draw leaves fewer
    // unseen than requested, so the bank resets the pool before drawing.
    const enPool = loadAllQuestions().filter((q) => q.lang === 'en').length
    const first = drawQuestions({ lang: 'en', categories: [], count: enPool - 1 })
    expect(first.poolReset).toBe(false)
    const second = drawQuestions({ lang: 'en', categories: [], count: 10 })
    expect(second.poolReset).toBe(true)
    expect(second.questions).toHaveLength(10)
  })

  it('caps draws at the available pool size per language', () => {
    const enPool = loadAllQuestions().filter((q) => q.lang === 'en').length
    const { questions, poolReset } = drawQuestions({ lang: 'en', categories: [], count: 1000 })
    expect(questions).toHaveLength(enPool)
    expect(poolReset).toBe(true)
    const frPool = loadAllQuestions().filter((q) => q.lang === 'fr').length
    const fr = drawQuestions({ lang: 'fr', categories: [], count: 1000 })
    expect(fr.questions).toHaveLength(frPool)
    expect(fr.questions.every((q) => q.lang === 'fr')).toBe(true)
  })


  it('tracks seen ids across draws until reset', () => {
    const first = drawQuestions({ lang: 'en', categories: [], count: 5 })
    const second = drawQuestions({ lang: 'en', categories: [], count: 5 })
    const overlap = first.questions.filter((q) => second.questions.some((s) => s.id === q.id))
    expect(overlap).toHaveLength(0)
    resetSeenQuestions()
    // Draw all but one en question so the post-reset draw must intersect
    // the first draw's 5 questions.
    const enPool = loadAllQuestions().filter((q) => q.lang === 'en').length
    const third = drawQuestions({ lang: 'en', categories: [], count: enPool - 1 })
    const overlapAfterReset = first.questions.filter((q) => third.questions.some((s) => s.id === q.id))
    // All but one of 161 drawn excludes at most one of the first draw's 5.
    expect(overlapAfterReset.length).toBeGreaterThanOrEqual(4)
  })

  it('returns an empty result with no poolReset for an unknown language', () => {
    const { questions, poolReset } = drawQuestions({ lang: 'zz' as Lang, categories: [], count: 5 })
    expect(questions).toHaveLength(0)
    expect(poolReset).toBe(false)
  })

  it('draws only fr questions for the fr language', () => {
    const { questions } = drawQuestions({ lang: 'fr', categories: ['recent-news'], count: 5 })
    expect(questions).toHaveLength(5)
    expect(questions.every((q) => q.lang === 'fr' && q.id.startsWith('news-'))).toBe(true)
  })
})
