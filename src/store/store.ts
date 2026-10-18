import { defineStore } from 'pinia'

export interface Choice {
  text: string
  answer: boolean
  classes: { correct: boolean; incorrect: boolean }
}

export interface Question {
  category: string
  type: string
  difficulty: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
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

interface State {
  aboutShow: boolean
  categories: { name: string; id: number }[]
  currentCategory: { name: string; id: number }
  currentView: string
  questions: Question[]
  isGameOver: boolean
  isPaused: boolean
  round: number
  scores: { playerOne: PlayerScore; playerTwo: PlayerScore }
  solo: boolean
  starPower: boolean
}

// Fisher-Yates shuffle, same behavior as upstream
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

export const useGameStore = defineStore('game', {
  state: (): State => ({
    aboutShow: false, // Show or hide About menu
    categories: [], // trivia categories
    currentCategory: {
      // chosen category
      name: 'Random',
      id: 9,
    },
    currentView: 'app-intro',
    questions: [], // current list of questions in game
    isGameOver: false, // game state
    isPaused: false,
    round: 0, // round counter, starts at 0, ends at 9
    scores: emptyScores(),
    solo: true, // Game mode, solo or multiplayer?
    starPower: false, // show starPower animation
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
  },
  actions: {
    aboutToggle() {
      this.aboutShow = !this.aboutShow
    },
    isGameOverCheck() {
      if (this.round === 9) {
        this.isGameOver = true
      }
    },
    incrementRound() {
      this.round += 1
    },
    newGame() {
      this.currentCategory.name = 'Random'
      this.currentCategory.id = 9
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
    setCurrentCategory(payload: { name: string; id: number }) {
      this.currentCategory.name = payload.name
      this.currentCategory.id = payload.id
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
    async fetchCategories() {
      const response = await fetch('https://opentdb.com/api_category.php')
      const data = await response.json()
      this.categories = data.trivia_categories
    },
    async startGame() {
      this.currentView = 'app-loader'
      // Fetch batch of questions for specific category
      let api: string
      // Determine if random (default) or chosen category
      if (this.currentCategory.name === 'Random') {
        api = 'https://opentdb.com/api.php?amount=10'
      } else {
        api = 'https://opentdb.com/api.php?amount=10&category=' + this.currentCategory.id
      }
      const response = await fetch(api)
      const data = await response.json()
      this.applyQuestions(data.results)
    },
    applyQuestions(payload: Omit<Question, 'choices'>[]) {
      // Set questions to payload from http request
      this.questions = payload.map((el) => {
        // Create list of incorrect choices
        const choices: Choice[] = el.incorrect_answers.map((item) => ({
          text: item,
          answer: false,
          classes: { correct: false, incorrect: false },
        }))
        // Add correct answer
        choices.push({
          text: el.correct_answer,
          answer: true,
          classes: { correct: false, incorrect: false },
        })
        return { ...el, choices: shuffle(choices) }
      })
      // Set view to game board
      this.currentView = 'app-game-board'
    },
  },
})
