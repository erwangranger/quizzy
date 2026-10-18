import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from './store'

const questions = [
  {
    category: 'General',
    type: 'multiple',
    difficulty: 'easy',
    question: 'Q1?',
    correct_answer: 'A1',
    incorrect_answers: ['B1', 'C1', 'D1'],
  },
  {
    category: 'General',
    type: 'multiple',
    difficulty: 'easy',
    question: 'Q2?',
    correct_answer: 'A2',
    incorrect_answers: ['B2', 'C2', 'D2'],
  },
]

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts at the intro view in solo mode', () => {
    const store = useGameStore()
    expect(store.currentView).toBe('app-intro')
    expect(store.solo).toBe(true)
  })

  it('alternates turns by round parity', () => {
    const store = useGameStore()
    expect(store.turn).toBe('playerOne')
    store.incrementRound()
    expect(store.turn).toBe('playerTwo')
    store.incrementRound()
    expect(store.turn).toBe('playerOne')
  })

  it('applies questions with shuffled 4-way choices', () => {
    const store = useGameStore()
    store.applyQuestions(questions)
    expect(store.currentView).toBe('app-game-board')
    expect(store.questions).toHaveLength(2)
    for (const q of store.questions) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices.filter((c) => c.answer)).toHaveLength(1)
      expect(q.choices.map((c) => c.text).sort()).toEqual(
        [q.correct_answer, ...q.incorrect_answers].sort(),
      )
    }
  })

  it('scores correct and incorrect answers into history and total', () => {
    const store = useGameStore()
    store.applyQuestions(questions)
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
    store.applyQuestions(questions)
    store.styleButtons()
    const marked = store.questions[0].choices
    expect(marked.filter((c) => c.classes.correct)).toHaveLength(1)
    expect(marked.filter((c) => c.classes.incorrect)).toHaveLength(3)
  })

  it('ends the game at round 9 and resets on new game', () => {
    const store = useGameStore()
    for (let i = 0; i < 9; i++) store.incrementRound()
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
    expect(store.currentCategory.name).toBe('Random')
  })
})
