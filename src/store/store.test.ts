import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { loadAllQuestions } from '../questions/questionBank'
import { useGameStore } from './store'

// jsdom localStorage needs --localstorage-file; in-memory mock so the
// question bank's seen-question tracking and player names are deterministic
// in tests.
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
    expect(store.mode).toBe('solo')
    expect(store.setup).toEqual({
      lang: 'en',
      categories: [],
      count: 10,
      difficulty: undefined,
      players: 1,
      hideChoices: false,
      weightByDifficulty: false,
    })
  })

  it('selects quizmaster as the default multiplayer mode', () => {
    const store = useGameStore()
    store.selectMode(false)
    expect(store.solo).toBe(false)
    expect(store.mode).toBe('quizmaster')
    expect(store.setup.players).toBe(2)
    expect(store.players).toHaveLength(2)
  })

  it('builds a roster of 1 to 6 players with localized default names', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 4 })
    expect(store.players).toHaveLength(4)
    expect(store.players.map((p) => p.name)).toEqual([
      'Player 1',
      'Player 2',
      'Player 3',
      'Player 4',
    ])
    store.setSetup({ players: 6 })
    expect(store.players).toHaveLength(6)
  })

  it('remembers edited player names in localStorage and reuses them', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 2 })
    store.renamePlayer(0, 'Ada')
    expect(JSON.parse(storage.get('quizzy.player-names') ?? '[]')).toEqual([
      'Ada',
      'Player 2',
    ])
    // A new game (new pinia instance) reloads the saved names
    setActivePinia(createPinia())
    const next = useGameStore()
    next.selectMode(false)
    expect(next.players.map((p) => p.name)).toEqual(['Ada', 'Player 2'])
  })

  it('draws from the local bank with shuffled 5-way choices', () => {
    const store = useGameStore()
    store.startGame()
    expect(store.currentView).toBe('app-game-board')
    expect(store.questions).toHaveLength(10)
    for (const q of store.questions) {
      expect(q.choices).toHaveLength(5)
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

  it('scores one point per correct answer into history and total', () => {
    const store = useGameStore()
    store.startGame()
    store.score(0, 1)
    store.score(0, 1)
    store.score(0, 0)
    expect(store.players[0].score.total).toBe(2)
    expect(store.players[0].score.history).toEqual([
      { correct: true, incorrect: false, category: store.questions[0]?.category },
      { correct: true, incorrect: false, category: store.questions[0]?.category },
      { correct: false, incorrect: true, category: store.questions[0]?.category },
    ])
  })

  it('quizmaster mode: scores only the marked players on Next', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 3 })
    store.startGame()
    expect(store.mode).toBe('quizmaster')
    // Pre-reveal: choices visible unless hide-choices was set
    expect(store.hiddenChoices).toBe(false)
    store.revealAnswer()
    // Revealing resets the marks for the round
    expect(store.marks).toEqual([false, false, false])
    expect(store.revealed).toBe(true)
    store.toggleMark(0)
    store.toggleMark(2)
    store.next()
    expect(store.players.map((p) => p.score.total)).toEqual([1, 0, 1])
    // Unmarked players still get a history row so dots stay aligned
    expect(store.players[1].score.history).toEqual([
      { correct: false, incorrect: true, category: store.questions[0]?.category },
    ])
    // Round advanced and marks cleared for the next question
    expect(store.round).toBe(1)
    expect(store.marks).toEqual([])
  })

  it('quizmaster mode with hide-choices: choices hidden until reveal', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 2, hideChoices: true })
    store.startGame()
    expect(store.hiddenChoices).toBe(true)
    store.revealAnswer()
    expect(store.hiddenChoices).toBe(false)
    expect(store.revealed).toBe(true)
    // Next question hides the choices again
    store.next()
    expect(store.hiddenChoices).toBe(true)
  })

  it('pass-and-play: interstitial between players, reveal after the last', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setMultiplayerMode('pass-and-play')
    store.setSetup({ players: 2 })
    store.startGame()
    expect(store.mode).toBe('pass-and-play')
    expect(store.revealed).toBe(false)
    // Player 1 answers
    const correct = store.questions[0].choices.find((c) => c.answer)!
    const wrong = store.questions[0].choices.find((c) => !c.answer)!
    store.answer(wrong)
    expect(store.answering).toBe(1)
    expect(store.revealed).toBe(false)
    // Player 2 answers; the round reveals automatically
    store.answer(correct)
    expect(store.answering).toBe(1)
    expect(store.revealed).toBe(true)
    expect(store.playerChoices[0]).toEqual(wrong)
    expect(store.playerChoices[1]).toEqual(correct)
    // Next scores both players
    store.next()
    expect(store.players.map((p) => p.score.total)).toEqual([0, 1])
    expect(store.players[0].score.history).toEqual([
      { correct: false, incorrect: true, category: store.questions[0]?.category },
    ])
    expect(store.players[1].score.history).toEqual([
      { correct: true, incorrect: false, category: store.questions[0]?.category },
    ])
    // Next round starts with a fresh answering index
    expect(store.round).toBe(1)
    expect(store.answering).toBe(0)
    expect(store.revealed).toBe(false)
  })

  it('solo answers every question itself with no interstitial turn handoff', () => {
    const store = useGameStore()
    store.startGame()
    expect(store.isPassAndPlay()).toBe(true)
    const correct = store.questions[0].choices.find((c) => c.answer)!
    store.answer(correct)
    // One player: the answer reveals immediately, no second answering turn
    expect(store.answering).toBe(0)
    expect(store.revealed).toBe(true)
    store.next()
    expect(store.players[0].score.total).toBe(1)
    expect(store.round).toBe(1)
  })

  it('ranks players with ties sharing a rank', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 3 })
    store.startGame()
    store.score(0, 3)
    store.score(1, 3)
    store.score(2, 1)
    const ranked = store.ranking
    expect(ranked.map((r) => r.player.score.total)).toEqual([3, 3, 1])
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3])
  })

  it('weights correct answers by difficulty when enabled', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 2, weightByDifficulty: true, count: 12, categories: ['geography', 'history', 'science', 'arts-literature', 'entertainment', 'sports-leisure'] })
    store.startGame()
    // Difficulty 1 and 2 questions exist in the sample pool
    const easy = store.questions.findIndex((q) => q.difficulty === 1)
    const hard = store.questions.findIndex((q) => q.difficulty === 2)
    expect(easy).toBeGreaterThanOrEqual(0)
    expect(hard).toBeGreaterThanOrEqual(0)
    store.score(0, store.questions[easy].difficulty)
    store.score(1, store.questions[hard].difficulty)
    expect(store.players[0].score.total).toBe(1)
    expect(store.players[1].score.total).toBe(2)
  })

  it('scores one point per correct answer when weighting is off', () => {
    const store = useGameStore()
    store.setSetup({ weightByDifficulty: false })
    store.startGame()
    const hard = store.questions.findIndex((q) => q.difficulty === 2)
    expect(hard).toBeGreaterThanOrEqual(0)
    // scoreRound-style scoring without weighting still awards 1 point
    store.score(0, 1)
    expect(store.players[0].score.total).toBe(1)
    expect(store.players[0].score.history).toHaveLength(1)
  })

  it('scores a full quizmaster round through scoreRound with weighting', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setSetup({ players: 2, weightByDifficulty: true, count: 12 })
    store.startGame()
    store.revealAnswer()
    store.toggleMark(0)
    store.toggleMark(1)
    store.scoreRound()
    const difficulty = store.questions[0].difficulty
    expect(store.players[0].score.total).toBe(difficulty)
    expect(store.players[1].score.total).toBe(difficulty)
  })

  it('ends the game after the last question and resets', () => {
    const store = useGameStore()
    store.setSetup({ count: 3 })
    store.startGame()
    for (let i = 0; i < 2; i++) store.next()
    expect(store.isGameOver).toBe(false)
    store.next()
    expect(store.isGameOver).toBe(true)
    store.resetGame()
    expect(store.isGameOver).toBe(false)
    expect(store.round).toBe(0)
    expect(store.questions).toHaveLength(0)
    expect(store.players[0].score.total).toBe(0)
    store.newGame()
    expect(store.currentView).toBe('app-intro')
    expect(store.solo).toBe(true)
    expect(store.mode).toBe('solo')
  })

  it('flags poolReset when the seen pool is exhausted', () => {
    const store = useGameStore()
    // Seen ids persist across games, so a second full-pool draw exhausts
    // the unseen pool and the bank resets recency before redrawing.
    const enPool = loadAllQuestions().filter((q) => q.lang === 'en').length
    store.setSetup({ count: enPool - 1 })
    store.startGame()
    expect(store.poolReset).toBe(false)
    store.resetGame()
    store.startGame()
    expect(store.poolReset).toBe(true)
  })

  it('breaks down correct answers per category', () => {
    const store = useGameStore()
    store.setSetup({ count: 12, categories: ['geography', 'history', 'science', 'arts-literature', 'entertainment', 'sports-leisure'] })
    store.startGame()
    // Rows are stamped with the drawn question's category at score time
    store.players[0].score.history = store.questions.map((q) => ({
      correct: true,
      incorrect: false,
      category: q.category,
    }))
    const breakdown = store.categoryBreakdown[0]
    const scienceCount = store.questions.filter((q) => q.category === 'science').length
    expect(breakdown['science'] ?? 0).toBe(scienceCount)
  })

  it('credits post-skip answers to their own category, not the skipped one', () => {
    const store = useGameStore()
    store.setSetup({ count: 3, categories: ['geography', 'science', 'history', 'arts-literature', 'entertainment', 'sports-leisure'] })
    store.startGame()
    // Answer q1, skip q2, answer q3 — each answer must be credited to its
    // own question's category, never the skipped question's. The draw may
    // pick the same category twice (2 questions per category in the bank),
    // so expectations are computed from the drawn questions.
    const first = store.questions[0].choices.find((c) => c.answer)!
    store.answer(first)
    store.next()
    store.skipRound()
    const third = store.questions[2].choices.find((c) => c.answer)!
    store.answer(third)
    store.next()
    const breakdown = store.categoryBreakdown[0]
    const q1cat = store.questions[0].category
    const q2cat = store.questions[1].category
    const q3cat = store.questions[2].category
    // q1 and q3 credited to their own categories (2 if the draw repeated
    // the category, 1 otherwise)
    expect(breakdown[q1cat]).toBe(q1cat === q3cat ? 2 : 1)
    expect(breakdown[q3cat]).toBe(q1cat === q3cat ? 2 : 1)
    // The skipped question's category appears only if q1 or q3 shares it
    const shared = (q1cat === q2cat ? 1 : 0) + (q3cat === q2cat ? 1 : 0)
    expect(breakdown[q2cat]).toBe(shared === 0 ? undefined : shared)
    // Never more correct rows than played rounds
    expect(store.players[0].score.history.filter((h) => h.correct)).toHaveLength(2)
  })

  it('skips a round: no history row, no score, round advances', () => {
    const store = useGameStore()
    store.setSetup({ count: 3 })
    store.startGame()
    store.skipRound()
    // Skipped questions record nothing: no score, no history row, and they
    // are excluded from the game-over total
    expect(store.players[0].score.total).toBe(0)
    expect(store.players[0].score.history).toEqual([])
    expect(store.answeredTotal).toBe(0)
    expect(store.round).toBe(1)
    expect(store.revealed).toBe(false)
    expect(store.isGameOver).toBe(false)
  })

  it('skip on the last question ends the game', () => {
    const store = useGameStore()
    store.setSetup({ count: 3 })
    store.startGame()
    store.skipRound()
    store.skipRound()
    store.skipRound()
    expect(store.round).toBe(2)
    expect(store.isGameOver).toBe(true)
  })

  it('skips a round in pass-and-play and quizmaster modes', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setMultiplayerMode('pass-and-play')
    store.setSetup({ players: 2, count: 3 })
    store.startGame()
    store.skipRound()
    // Skipped rounds record nothing for anyone
    expect(store.players.map((p) => p.score.history)).toEqual([[], []])
    expect(store.players.every((p) => p.score.total === 0)).toBe(true)
    expect(store.round).toBe(1)

    const quiz = useGameStore()
    quiz.selectMode(false)
    quiz.setMultiplayerMode('quizmaster')
    quiz.setSetup({ players: 2, count: 3 })
    quiz.startGame()
    quiz.skipRound()
    expect(quiz.players.map((p) => p.score.total)).toEqual([0, 0])
    expect(quiz.players[0].score.history).toEqual([])
    expect(quiz.round).toBe(1)
  })

  it('skipped questions shrink the dots: dots follow answered rounds', () => {
    const store = useGameStore()
    store.setSetup({ count: 3 })
    store.startGame()
    const correct = store.questions[0].choices.find((c) => c.answer)!
    store.answer(correct)
    store.next()
    store.skipRound()
    // One played round (correct) — the skipped round contributes no row
    expect(store.players[0].score.history).toEqual([
      { correct: true, incorrect: false, category: store.questions[0]?.category },
    ])
    expect(store.answeredTotal).toBe(1)
    expect(store.players[0].score.total).toBe(1)
  })

  it('answeredTotal excludes skipped questions: 7 of 10 played, not 7 of 10', () => {
    const store = useGameStore()
    store.setSetup({ count: 3 })
    store.startGame()
    // Answer 1, skip 1, answer 1 → 2 of 2 played
    const correct = store.questions[0].choices.find((c) => c.answer)!
    store.answer(correct)
    store.next()
    store.skipRound()
    const correct3 = store.questions[2].choices.find((c) => c.answer)!
    store.answer(correct3)
    store.next()
    expect(store.questions).toHaveLength(3)
    expect(store.answeredTotal).toBe(2)
    expect(store.players[0].score.total).toBe(2)
  })

  it('all-skip game: every round contributes nothing', () => {
    const skipped = useGameStore()
    skipped.setSetup({ count: 2 })
    skipped.startGame()
    skipped.skipRound()
    skipped.skipRound()
    expect(skipped.players[0].score.history).toEqual([])
    expect(skipped.players[0].score.total).toBe(0)
    expect(skipped.answeredTotal).toBe(0)
    expect(skipped.isGameOver).toBe(true)
  })

  it('leaving for the menu resets a paused/revealed state like game-over New Game', () => {
    const store = useGameStore()
    store.selectMode(false)
    store.setMultiplayerMode('quizmaster')
    store.setSetup({ players: 2 })
    store.startGame()
    // Quit from a revealed, paused round (revealAnswer pauses the game)
    store.revealAnswer()
    expect(store.isPaused).toBe(true)
    expect(store.revealed).toBe(true)
    store.resetGame()
    store.newGame()
    expect(store.currentView).toBe('app-intro')
    expect(store.isPaused).toBe(false)
    expect(store.revealed).toBe(false)
    expect(store.isGameOver).toBe(false)
    expect(store.questions).toHaveLength(0)
    expect(store.solo).toBe(true)
    expect(store.mode).toBe('solo')
  })
})

