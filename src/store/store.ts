import { defineStore } from 'pinia'
import type { Category, Difficulty, Lang, Question } from '../questions/schema'
import { drawQuestions, getCategories, resetSeenQuestions } from '../questions/questionBank'

export interface Choice {
  text: string
  answer: boolean
  classes: { correct: boolean; incorrect: boolean }
}

export interface GameQuestion extends Question {
  choices: Choice[]
}

export interface ScoreHistory {
  correct: boolean
  incorrect: boolean
}

interface PlayerScore {
  history: ScoreHistory[]
  total: number
}

export interface GameSetup {
  lang: Lang
  categories: Category[]
  count: number
  difficulty?: Difficulty
}

interface State {
  aboutShow: boolean
  currentView: string
  questions: GameQuestion[]
  isGameOver: boolean
  isPaused: boolean
  round: number
  scores: { playerOne: PlayerScore; playerTwo: PlayerScore }
  solo: boolean
  starPower: boolean
  setup: GameSetup
  poolReset: boolean
}

// Fisher-Yates shuffle
function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  let i = arr.length
  let temp: T
  let rand: number
  while (0 !== i) {
    rand = Math.floor(Math.random() * i)
    i -= 1
    temp = arr[i]
    arr[i] = arr[rand]
    arr[rand] = temp
  }
  return arr
}

// Canonical empty score state; shared by initial state and reset so both stay in lockstep
function emptyScores(): { playerOne: PlayerScore; playerTwo: PlayerScore } {
  return {
    playerOne: { history: [], total: 0 },
    playerTwo: { history: [], total: 0 },
  }
}

function defaultSetup(): GameSetup {
  return {
    lang: 'en',
    categories: [],
    count: 10,
    difficulty: undefined,
  }
}

export const useGameStore = defineStore('game', {
  state: (): State => ({
    aboutShow: false, // Show or hide About menu
    currentView: 'app-intro',
    questions: [], // current list of questions in game
    isGameOver: false, // game state
    isPaused: false,
    round: 0, // round counter, starts at 0, ends at setup.count - 1
    scores: emptyScores(),
    solo: true, // Game mode, solo or multiplayer?
    starPower: false, // show starPower animation
    setup: defaultSetup(),
    poolReset: false, // seen-question pool was exhausted on the last draw
  }),
  getters: {
    turn: (state) => {
      let check = state.round % 2
      if (check === 0 || state.round === 0) {
        return 'playerOne'
      } else {
        return 'playerTwo'
      }
    },
    categories: (state) => getCategories(state.setup.lang),
  },
  actions: {
    aboutToggle() {
      this.aboutShow = !this.aboutShow
    },
    isGameOverCheck() {
      if (this.round === this.questions.length - 1) {
        this.isGameOver = true
      }
    },
    incrementRound() {
      this.round += 1
    },
    newGame() {
      this.currentView = 'app-intro'
      this.solo = true
    },
    pauseGame(payload?: 'pause') {
      if (payload === 'pause') {
        this.isPaused = true
      } else {
        this.isPaused = false
      }
    },
    resetGame() {
      this.isGameOver = false
      this.isPaused = false
      this.questions = []
      this.round = 0
      this.scores = emptyScores()
      this.poolReset = false
    },
    score(payload: { correct: boolean; mode: 'playerOne' | 'playerTwo' }) {
      const player = payload.mode
      if (payload.correct) {
        this.scores[player].history.push({
          correct: true,
          incorrect: false,
        })
        this.scores[player].total += 1
      } else {
        this.scores[player].history.push({
          correct: false,
          incorrect: true,
        })
      }
    },
    selectMode(payload: boolean) {
      payload === true ? (this.solo = true) : (this.solo = false)
    },
    setSetup(payload: Partial<GameSetup>) {
      Object.assign(this.setup, payload)
    },
    starPowerOn() {
      this.starPower = true
      setTimeout(() => {
        this.starPower = false
      }, 1600)
    },
    styleButtons() {
      const current = this.questions[this.round]
      if (!current) return
      current.choices.forEach((el) => {
        if (el.answer) {
          el.classes = { correct: true, incorrect: false }
        } else {
          el.classes = { correct: false, incorrect: true }
        }
      })
    },
    // Draws questions from the local bank (bundled at build time, offline-safe)
    // and applies them to the game state. Replaces the Open Trivia DB fetch.
    startGame() {
      const { questions, poolReset } = drawQuestions(this.setup)
      this.poolReset = poolReset
      this.questions = questions.map((q) => {
        const choices: Choice[] = q.incorrect_answers.map((item) => ({
          text: item,
          answer: false,
          classes: { correct: false, incorrect: false },
        }))
        choices.push({
          text: q.correct_answer,
          answer: true,
          classes: { correct: false, incorrect: false },
        })
        return { ...q, choices: shuffle(choices) }
      })
      this.currentView = this.questions.length > 0 ? 'app-game-board' : 'app-intro'
    },
    clearSeenQuestions() {
      resetSeenQuestions()
    },
  },
})
