import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from './store'

// jsdom localStorage needs --localstorage-file; in-memory mock so the
// question bank's seen-question tracking is deterministic in tests.
const storage = new Map<string, string>()
vi.stubGlobal(
  'window',
  Object.assign(window, {
    localStorage: {
      getItem: (key: string) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
      clear: () => void storage.clear(),
    },
  }),
)

describe('useGameStore', () => {
  beforeEach(() => {
    storage.clear()
    setActivePinia(createPinia())
  })

  it('starts at the intro view in solo mode with default setup', () => {
    const store = useGameStore()
    expect(store.currentView).toBe('app-intro')
    expect(store.solo).toBe(true)
    expect(store.setup).toEqual({ lang: 'en', categories: [], count: 10, difficulty: undefined })
  })

  it('alternates turns by round parity', () => {
    const store = useGameStore()
    expect(store.turn).toBe('playerOne')
    store.incrementRound()
    expect(store.turn).toBe('playerTwo')
    store.incrementRound()
    expect(store.turn).toBe('playerOne')
  })

  it('draws from the local bank with shuffled 4-way choices', () => {
    const store = useGameStore()
    store.startGame()
    expect(store.currentView).toBe('app-game-board')
    expect(store.questions).toHaveLength(10)
    for (const q of store.questions) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices.filter((c) => c.answer)).toHaveLength(1)
      expect(q.choices.map((c) => c.text).sort()).toEqual(
        [q.correct_answer, ...q.incorrect_answers].sort(),
      )
    }
  })

  it('honors setup: category filter and question count', () => {
    const store = useGameStore()
    store.setSetup({ categories: ['science'], count: 2 })
    store.startGame()
    expect(store.questions).toHaveLength(2)
    expect(store.questions.every((q) => q.category === 'science')).toBe(true)
  })

  it('scores correct and incorrect answers into history and total', () => {
    const store = useGameStore()
    store.startGame()
    store.score({ correct: true, mode: 'playerOne' })
    store.score({ correct: true, mode: 'playerOne' })
    store.score({ correct: false, mode: 'playerTwo' })
    expect(store.scores.playerOne.total).toBe(2)
    expect(store.scores.playerOne.history).toEqual([
      { correct: true, incorrect: false },
      { correct: true, incorrect: false },
    ])
    expect(store.scores.playerTwo.total).toBe(0)
    expect(store.scores.playerTwo.history).toEqual([
      { correct: false, incorrect: true },
    ])
  })

  it('styles buttons to mark the correct answer after a guess', () => {
    const store = useGameStore()
    store.startGame()
    store.styleButtons()
    const marked = store.questions[0].choices
    expect(marked.filter((c) => c.classes.correct)).toHaveLength(1)
    expect(marked.filter((c) => c.classes.incorrect)).toHaveLength(3)
  })

  it('ends the game after the last question and resets', () => {
    const store = useGameStore()
    store.setSetup({ count: 3 })
    store.startGame()
    for (let i = 0; i < 2; i++) store.incrementRound()
    store.isGameOverCheck()
    expect(store.isGameOver).toBe(true)
    store.resetGame()
    expect(store.isGameOver).toBe(false)
    expect(store.round).toBe(0)
    expect(store.questions).toHaveLength(0)
    expect(store.scores.playerOne.total).toBe(0)
    store.newGame()
    expect(store.currentView).toBe('app-intro')
    expect(store.solo).toBe(true)
  })

  it('flags poolReset when the seen pool is exhausted', () => {
    const store = useGameStore()
    store.setSetup({ count: 10 })
    store.startGame()
    expect(store.poolReset).toBe(false)
    store.resetGame()
    store.startGame()
    expect(store.poolReset).toBe(true)
  })
})
