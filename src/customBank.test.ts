import { beforeEach, describe, expect, it } from 'vitest'
import {
  BANK_PARAM,
  getCustomBank,
  loadCustomBankParam,
  normalizeCustomBank,
  normalizeCustomQuestion,
  presetSetup,
  readBankParam,
  setCustomBank,
  bankLabel,
  customBankName,
} from './customBank'
import { drawQuestions, loadAllQuestions, getCategories } from './questions/questionBank'
import type { Question } from './questions/schema'

// jsdom localStorage needs --localstorage-file; provide an in-memory mock so
// seen-question tracking is deterministic in tests. Assigned directly on the
// existing window: vi.stubGlobal('window', …) throws in the vmThreads pool
// (Cannot redefine property), which runs these tests too.
const storage = new Map<string, string>()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
    clear: () => void storage.clear(),
  },
})

function bankQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    question: 'Which river flows through Montreal?',
    correct_answer: 'Saint Lawrence River',
    incorrect_answers: ['Ottawa River', 'Hudson River', 'Richelieu River', 'A very wide creek'],
    explanation: 'Montreal sits on an island at the confluence of the Saint Lawrence and Ottawa rivers.',
    ...overrides,
  }
}

function encodeBank(value: unknown): string {
  const json = JSON.stringify(value)
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function hrefWithBank(value: string): string {
  return `https://quizzy.test/?${BANK_PARAM}=${value}`
}

describe('readBankParam', () => {
  it('returns null without a ?bank= parameter', () => {
    expect(readBankParam('https://quizzy.test/')).toBeNull()
  })

  it('reads the bank value from the URL', () => {
    expect(readBankParam(hrefWithBank('abc'))).toBe('abc')
  })
})

describe('normalizeCustomQuestion', () => {
  it('forces category custom, fills missing metadata, keeps author ids', () => {
    const { q, issues } = normalizeCustomQuestion(bankQuestion(), () => 'bank-0001')
    expect(issues).toEqual([])
    expect(q!.id).toBe('bank-0001')
    expect(q!.category).toBe('custom')
    expect(q!.lang).toBe('en')
    expect(q!.difficulty).toBe(2)
    expect(q!.origin).toBe('human')
    expect(q!.reviewed).toBe(true)
    expect(q!.source_url).toBeNull()
    expect(q!.as_of).toBeNull()
  })

  it('keeps author-supplied metadata when valid', () => {
    const { q, issues } = normalizeCustomQuestion(
      bankQuestion({ id: 'bank-0042', lang: 'fr', difficulty: 3, source_url: 'https://example.com/x' }),
      () => 'bank-0001',
    )
    expect(issues).toEqual([])
    expect(q!.id).toBe('bank-0042')
    expect(q!.lang).toBe('fr')
    expect(q!.difficulty).toBe(3)
    expect(q!.source_url).toBe('https://example.com/x')
  })

  it('rejects a question without 4 incorrect answers', () => {
    const { q, issues } = normalizeCustomQuestion(bankQuestion({ incorrect_answers: ['A', 'B'] }), () => 'bank-0001')
    expect(q).toBeUndefined()
    expect(issues.map((i) => i.field)).toContain('incorrect_answers')
  })

  it('rejects a question with an empty ask', () => {
    const { q, issues } = normalizeCustomQuestion(bankQuestion({ question: '  ' }), () => 'bank-0001')
    expect(q).toBeUndefined()
    expect(issues.map((i) => i.field)).toContain('question')
  })
})

describe('normalizeCustomBank', () => {
  it('normalizes a valid bank and reports no errors', () => {
    const { questions, errors } = normalizeCustomBank([bankQuestion(), bankQuestion({ question: 'Other?' })])
    expect(errors).toEqual([])
    expect(questions).toHaveLength(2)
    expect(questions[0].id).toBe('bank-0001')
    expect(questions[1].id).toBe('bank-0002')
  })

  it('drops invalid items with an error each, keeps the rest', () => {
    const { questions, errors } = normalizeCustomBank([bankQuestion(), 'not an object', bankQuestion({ incorrect_answers: [] })])
    expect(questions).toHaveLength(1)
    expect(errors).toHaveLength(2)
  })

  it('drops duplicate question text and duplicate ids', () => {
    const { questions, errors } = normalizeCustomBank([
      bankQuestion(),
      bankQuestion({ question: 'Another?' }),
      bankQuestion({ id: 'bank-0001', question: 'Different?' }),
    ])
    expect(questions).toHaveLength(2) // first + "Different?" (distinct text)
    expect(errors).toHaveLength(1) // "Another?" collides with the first text
  })

  it('rejects a non-array bank', () => {
    const { questions, errors } = normalizeCustomBank({ nope: true })
    expect(questions).toEqual([])
    expect(errors).toEqual(['bank must be an array of question objects'])
  })
})

describe('bankLabel', () => {
  it('strips the extension from a relative file', () => {
    expect(bankLabel('demo-bank.json')).toBe('demo-bank')
  })

  it('takes the basename of a remote URL', () => {
    expect(bankLabel('https://host.com/banks/history.json')).toBe('history')
  })

  it('names inline banks inline', () => {
    expect(bankLabel('inline bank')).toBe('inline')
  })
})

describe('loadCustomBankParam', () => {
  it('returns null without a ?bank= parameter', async () => {
    expect(await loadCustomBankParam('https://quizzy.test/')).toBeNull()
  })

  it('loads an inline base64url bank', async () => {
    const result = await loadCustomBankParam(hrefWithBank(encodeBank([bankQuestion()])))
    expect(result).not.toBeNull()
    expect(result!.errors).toEqual([])
    expect(result!.source).toBe('inline bank')
    expect(result!.name).toBe('inline')
  })

  it('reports an error for a corrupt inline bank', async () => {
    const result = await loadCustomBankParam(hrefWithBank('!!!not-base64!!!'))
    expect(result!.questions).toEqual([])
    expect(result!.errors[0]).toMatch(/inline bank/)
  })

  it('reports an error for a failed relative fetch', async () => {
    const original = window.fetch
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: () => Promise.resolve(new Response('nope', { status: 404 })),
    })
    try {
      const result = await loadCustomBankParam(hrefWithBank('missing-bank.json'))
      expect(result!.questions).toEqual([])
      expect(result!.errors[0]).toMatch(/HTTP 404/)
    } finally {
      Object.defineProperty(window, 'fetch', { configurable: true, value: original })
    }
  })

  it('derives the bank name from a relative file path', async () => {
    const result = await loadCustomBankParam(hrefWithBank('demo-bank.json'))
    expect(result!.source).toBe('demo-bank.json')
    expect(result!.name).toBe('demo-bank')
  })
})

describe('custom bank integration', () => {
  beforeEach(() => {
    setCustomBank([])
  })

  it('presetSetup picks the bank language, custom category and a fitting count', () => {
    const bank = normalizeCustomBank([bankQuestion(), bankQuestion({ lang: 'fr', question: 'En fr ?' }), bankQuestion({ question: 'Third?' })]).questions
    expect(presetSetup(bank)).toEqual({ lang: 'en', categories: ['custom'], count: 3 })
  })

  it('merges the custom bank into the play pool and derived categories', () => {
    const before = loadAllQuestions().length
    const bank = normalizeCustomBank([bankQuestion(), bankQuestion({ question: 'Second?' })]).questions
    setCustomBank(bank)
    expect(loadAllQuestions().length).toBe(before + 2)
    expect(loadAllQuestions().slice(-2)).toEqual(bank)
    expect(getCategories('en')).toContain('custom')
  })

  it('draws from the custom category once set', () => {
    const bank = normalizeCustomBank([bankQuestion(), bankQuestion({ question: 'Second?' }), bankQuestion({ question: 'Third?' })]).questions
    setCustomBank(bank)
    const { questions } = drawQuestions({ lang: 'en', categories: ['custom'], count: 2 })
    expect(questions).toHaveLength(2)
    expect(questions.every((q) => q.category === 'custom')).toBe(true)
  })

  it('getCustomBank reflects what was set', () => {
    expect(getCustomBank()).toEqual([])
    const bank = normalizeCustomBank([bankQuestion()]).questions
    setCustomBank(bank)
    expect(getCustomBank()).toEqual(bank)
  })

  it('remembers the bank name only while a bank is loaded', () => {
    const bank = normalizeCustomBank([bankQuestion()]).questions
    setCustomBank(bank, 'demo-bank')
    expect(customBankName()).toBe('demo-bank')
    setCustomBank([])
    expect(customBankName()).toBeNull()
  })

  it('stores bank questions with the full Question shape', () => {
    const bank = normalizeCustomBank([bankQuestion()]).questions
    const keys = Object.keys(bank[0]).sort()
    expect(keys).toEqual(
      ['as_of', 'category', 'correct_answer', 'difficulty', 'explanation', 'id', 'incorrect_answers', 'lang', 'origin', 'question', 'reviewed', 'source_url'].sort(),
    )
  })
})
