import { defineStore } from 'pinia'
import type { Category, Difficulty, Lang, Question } from '../questions/schema'
import { drawQuestions, getCategories, resetSeenQuestions } from '../questions/questionBank'
import { analytics } from '../analytics'
import { setLocale, t } from '../locales'

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
  category?: Category
}

export interface Player {
  name: string
  score: { history: ScoreHistory[]; total: number }
}

export type GameMode = 'solo' | 'quizmaster' | 'pass-and-play'

export interface GameSetup {
  lang: Lang
  categories: Category[]
  count: number
  difficulty?: Difficulty
  players: number
  hideChoices: boolean
  weightByDifficulty: boolean
}

// Wake Lock API is absent in jsdom and older Safari; the game is a no-op there.
interface WakeLockSentinel {
  release(): Promise<void>
}
interface WakeLockApi {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> }
}

function getWakeLock(): WakeLockApi['wakeLock'] {
  const nav = navigator as WakeLockApi
  return nav.wakeLock
}
interface State {
  aboutShow: boolean
  currentView: string
  questions: GameQuestion[]
  isGameOver: boolean
  isPaused: boolean
  round: number
  players: Player[]
  solo: boolean
  mode: GameMode
  answering: number // pass-and-play: index of the player answering this round
  playerChoices: (Choice | undefined)[] // pass-and-play: choice per player this round
  revealed: boolean // reveal shown for the current round
  marks: boolean[] // quizmaster: which players were right this round
  hiddenChoices: boolean // quizmaster open-answer play: choices hidden until reveal
  starPower: boolean
  setup: GameSetup
  poolReset: boolean
  wakeLockSentinel: WakeLockSentinel | null
}

export const MAX_PLAYERS = 6

const PLAYERS_KEY = 'quizzy.player-names'

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

// Saved player names from localStorage, wrapped so the game still works when
// storage is unavailable (private mode, quota). Missing names fall back to the
// localized defaults ("Player 1".."Player 6" / "Joueur 1".."Joueur 6"), in
// sync with the 'player.default' locale keys.
function loadPlayerNames(count: number): Player[] {
  const fallback = Array.from({ length: count }, (_, i) => t('player.default', { n: i + 1 }))
  let names: string[] = []
  try {
    const raw = window.localStorage.getItem(PLAYERS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    names = Array.isArray(parsed)
      ? parsed.filter((n): n is string => typeof n === 'string' && n.trim() !== '')
      : []
  } catch {
    names = []
  }
  return Array.from({ length: count }, (_, i) => ({
    name: names[i] ?? fallback[i],
    score: { history: [] as ScoreHistory[], total: 0 },
  }))
}

function savePlayerNames(players: Player[]): void {
  try {
    window.localStorage.setItem(PLAYERS_KEY, JSON.stringify(players.map((p) => p.name)))
  } catch {
    // storage unavailable: names simply won't persist
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
    players: loadPlayerNames(1),
    solo: true, // Game mode, solo or multiplayer?
    mode: 'solo',
    answering: 0, // pass-and-play: index of the player currently answering
    playerChoices: [], // pass-and-play: choice per player this round
    revealed: false, // reveal screen shown for the current round
    marks: [], // quizmaster: who was right this round
    hiddenChoices: false, // choices hidden until reveal (quizmaster open-answer play)
    starPower: false, // show starPower animation
    setup: {
      lang: 'en',
      categories: [],
      count: 10,
      difficulty: undefined,
      players: 1,
      hideChoices: false,
      weightByDifficulty: false,
    },
    poolReset: false, // seen-question pool was exhausted on the last draw
    wakeLockSentinel: null,
  }),
  getters: {
    // Competition ranking (1, 1, 3...): players sorted by total, ties share a rank.
    ranking: (state) => {
      const sorted = [...state.players].sort((a, b) => b.score.total - a.score.total)
      return sorted.map((player, i) => ({
        player,
        rank: i > 0 && player.score.total === sorted[i - 1].score.total ? 0 : i + 1,
      })).map((entry, i, all) => ({
        player: entry.player,
        rank: entry.rank === 0 ? all[i - 1].rank : entry.rank,
      }))
    },
    // Correct answers per player, keyed by category. Each history row is
    // stamped with the drawn question's category at score time, so answers
    // credit their own category even when earlier rounds were skipped.
    categoryBreakdown: (state) => {
      return state.players.map((player) => {
        const counts: Partial<Record<Category, number>> = {}
        player.score.history.forEach((entry) => {
          if (entry.correct && entry.category) {
            counts[entry.category] = (counts[entry.category] ?? 0) + 1
          }
        })
        return counts
      })
    },
    // Rounds actually played (answers recorded): skipped questions are
    // excluded, so "7/10 correct" means 7 of the 7 questions played.
    answeredTotal: (state) => {
      if (state.players.length === 0) return state.questions.length
      return Math.max(...state.players.map((p) => p.score.history.length))
    },
    categories: (state) => getCategories(state.setup.lang),
  },
  actions: {
    aboutToggle() {
      this.aboutShow = !this.aboutShow
    },
    selectMode(payload: boolean) {
      this.solo = payload
      if (payload) {
        this.mode = 'solo'
        this.players = loadPlayerNames(1)
      } else {
        // Quizmaster is the default multiplayer mode
        this.mode = 'quizmaster'
        if (this.setup.players < 2) this.setup.players = 2
        this.players = loadPlayerNames(this.setup.players)
      }
    },
    setMultiplayerMode(mode: 'quizmaster' | 'pass-and-play') {
      if (this.solo) return
      this.mode = mode
    },
    setSetup(payload: Partial<GameSetup>) {
      const playersChanged = payload.players !== undefined && payload.players !== this.setup.players
      Object.assign(this.setup, payload)
      if (payload.lang) setLocale(payload.lang)
      if (playersChanged && !this.solo) this.players = loadPlayerNames(this.setup.players)
    },
    renamePlayer(index: number, name: string) {
      const player = this.players[index]
      if (!player) return
      player.name = name
      savePlayerNames(this.players)
    },
    isPassAndPlay() {
      return this.mode === 'solo' || this.mode === 'pass-and-play'
    },
    // Mark who answered correctly in quizmaster mode (toggle button state)
    toggleMark(index: number) {
      this.marks[index] = !this.marks[index]
    },
    // Reveal the answer for this round: quizmaster button, or automatic once
    // the last pass-and-play player has answered.
    revealAnswer() {
      this.hiddenChoices = false
      this.styleButtons()
      this.pauseGame('pause')
      this.revealed = true
      if (this.mode === 'quizmaster') {
        this.marks = this.players.map(() => false)
      }
    },
    // Record the answering player's choice in pass-and-play. Between players
    // the phone is paused so the interstitial can cover the board; the last
    // player goes straight to the reveal.
    answer(choice: Choice) {
      this.styleButtons()
      this.playerChoices[this.answering] = choice
      if (choice.answer) this.starPowerOn()
      if (this.answering < this.players.length - 1) {
        this.answering += 1
        // Wipe button feedback before the interstitial fades in, so the
        // next player cannot glimpse the correct answer mid-fade
        const current = this.questions[this.round]
        if (current) {
          current.choices.forEach((el) => {
            el.classes = { correct: false, incorrect: false }
          })
        }
        // Pause for the pass-the-phone interstitial
        this.pauseGame('pause')
      } else {
        this.revealAnswer()
      }
    },
    // Ready pressed on the pass-the-phone interstitial: hand the phone
    // over; feedback was already wiped in answer() before the fade-in.
    readyNext() {
      this.pauseGame()
    },
    // Score one player's answer. Zero-point answers still record history so
    // every player's score dots stay aligned with the question count. The
    // drawn question's category is stamped on the row so the breakdown
    // credits each answer to its own category even when earlier rounds
    // were skipped (history index no longer maps to questions[i]).
    score(index: number, points: number) {
      const player = this.players[index]
      if (!player) return
      const category = this.questions[this.round]?.category
      analytics.questionAnswered(
        this.questions[this.round]?.id ?? '',
        points > 0,
        this.mode,
        player.name,
      )
      if (points > 0) {
        player.score.history.push({ correct: true, incorrect: false, category })
        player.score.total += points
      } else {
        player.score.history.push({ correct: false, incorrect: true, category })
      }
    },
    // Score the finished round. Quizmaster: marked players earn points
    // (weighting per player from the drawn question's difficulty).
    // Pass-and-play: every recorded choice is scored.
    scoreRound() {
      const question = this.questions[this.round]
      const points = this.setup.weightByDifficulty && question ? question.difficulty : 1
      if (this.mode === 'quizmaster') {
        this.players.forEach((_, i) => {
          this.score(i, this.marks[i] ? points : 0)
        })
      } else {
        this.players.forEach((_, i) => {
          const choice = this.playerChoices[i]
          if (choice) {
            this.score(i, choice.answer ? points : 0)
            this.playerChoices[i] = undefined
          }
        })
      }
    },
    // Skip the current round: no one answers or scores, and no history row
    // is recorded — skipped questions are excluded from the game-over total
    // ("7/10" means 7 of the questions actually played) and from the dots.
    skipRound() {
      if (this.round === this.questions.length - 1) {
        this.isGameOver = true
        this.releaseWakeLock()
      } else {
        this.incrementRound()
      }
    },
    // Score the round and move on. The game ends after the last question's
    // reveal, so game-over handling lives here and in skipRound.
    next() {
      this.scoreRound()
      if (this.mode === 'quizmaster' && this.marks.some((marked) => marked)) {
        this.starPowerOn()
      }
      if (this.round === this.questions.length - 1) {
        this.isGameOver = true
        this.releaseWakeLock()
      } else {
        this.incrementRound()
      }
    },
    incrementRound() {
      this.round += 1
      this.answering = 0
      this.playerChoices = []
      this.revealed = false
      this.marks = []
      this.hiddenChoices = this.setup.hideChoices && this.mode === 'quizmaster'
      this.pauseGame()
      this.trackQuestionShown()
    },
    // Quizmaster mode keeps the screen awake for the whole game (Screen Wake
    // Lock API; no-op where unsupported, e.g. jsdom or older Safari).
    async requestWakeLock() {
      if (this.mode !== 'quizmaster') return
      try {
        const wakeLock = getWakeLock()
        this.wakeLockSentinel = wakeLock ? await wakeLock.request('screen') : null
      } catch {
        // Wake Lock unsupported or denied: the game still works
      }
    },
    async releaseWakeLock() {
      try {
        await this.wakeLockSentinel?.release()
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null
    },
    newGame() {
      this.currentView = 'app-intro'
      // Keep the play-mode setup (single/multiplayer, mode, player count) so
      // "Main Menu" / "New Game" returns to the Starter as configured, not
      // collapsed back to solo; player names already persist in storage.
      if (this.solo) {
        this.players = loadPlayerNames(1)
      } else if (this.setup.players < 2) {
        this.setup.players = 2
        this.players = loadPlayerNames(2)
      } else {
        this.players = loadPlayerNames(this.setup.players)
      }
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
      this.answering = 0
      this.playerChoices = []
      this.revealed = false
      this.marks = []
      this.hiddenChoices = false
      this.players = this.players.map((p) => ({ name: p.name, score: { history: [], total: 0 } }))
      this.poolReset = false
      this.releaseWakeLock()
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
      this.round = 0
      this.answering = 0
      this.playerChoices = []
      this.revealed = false
      this.marks = []
      this.hiddenChoices = this.setup.hideChoices && this.mode === 'quizmaster'
      this.isPaused = false
      this.requestWakeLock()
      analytics.gameStart(this.mode, this.players.length, this.questions.length)
      this.trackQuestionShown()
    },
    // Fires question_shown for the current round's question (question IDs
    // per the analytics telemetry list). No-op when the round has no
    // question. Called on game start and every round advance.
    trackQuestionShown() {
      const question = this.questions[this.round]
      if (question) analytics.questionShown(question.id, question.category)
    },
    clearSeenQuestions() {
      resetSeenQuestions()
    },
  },
})
