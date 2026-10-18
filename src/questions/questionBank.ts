import type { Category, Difficulty, Lang, Question } from './schema'
import { CATEGORIES, validateQuestion } from './schema'

export interface DrawOptions {
  lang: Lang
  categories: Category[]
  count: number
  difficulty?: Difficulty
}


// Question bank built at compile time from questions/*.json via Vite glob
// import. Only reviewed questions make it into the build, so unreviewed
// generated questions can live in the repo without shipping to players.
const modules = import.meta.glob('/questions/*.json', { eager: true }) as Record<string, { default: unknown[] }>

export function loadAllQuestions(): Question[] {
  const valid: Question[] = []
  for (const [path, mod] of Object.entries(modules)) {
    const file = path.split('/').pop() ?? path
    for (const item of mod.default) {
      const issues = validateQuestion(item)
      if (issues.length > 0) {
        console.warn(`questions/${file}: dropping invalid question [${issues[0].id}]: ${issues[0].message}`)
        continue
      }
      const q = item as Question
      if (q.reviewed) valid.push(q)
    }
  }
  return valid
}

const SEEN_KEY = 'quizzy.seen-question-ids'
const SEEN_LIMIT = 500

// Returns the list of recently seen question IDs from localStorage, wrapped
// so the game still works when storage is unavailable (private mode, quota).
function getSeenIds(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveSeenIds(ids: string[]): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-SEEN_LIMIT)))
  } catch {
    // storage unavailable: seen tracking simply won't persist
  }
}

export function resetSeenQuestions(): void {
  try {
    window.localStorage.removeItem(SEEN_KEY)
  } catch {
    // ignore
  }
}

export function getCategories(lang: Lang): Category[] {
  const categories = new Set<Category>()
  for (const q of loadAllQuestions()) {
    if (q.lang === lang) categories.add(q.category)
  }
  return CATEGORIES.filter((c) => categories.has(c))
}

export interface DrawResult {
  questions: Question[]
  poolReset: boolean
}

// Draws `count` random questions without repeats within a game, preferring
// questions not seen recently. When the unseen pool is exhausted, resets it
// and reports poolReset so the UI can say so.
export function drawQuestions({ lang, categories, count, difficulty }: DrawOptions): DrawResult {
  const pool = loadAllQuestions().filter(
    (q) =>
      q.lang === lang &&
      (categories.length === 0 || categories.includes(q.category)) &&
      (difficulty === undefined || q.difficulty === difficulty),
  )

  const seen = new Set(getSeenIds())
  const unseen = pool.filter((q) => !seen.has(q.id))

  let picked: Question[]
  let poolReset = false
  if (unseen.length >= count) {
    picked = shuffle(unseen).slice(0, count)
  } else {
    // Not enough fresh questions: reset recency and redraw from the full pool
    poolReset = pool.length > 0 && unseen.length < count
    picked = shuffle(pool).slice(0, Math.min(count, pool.length))
  }

  const seenIds = getSeenIds()
  saveSeenIds([...seenIds, ...picked.map((q) => q.id)])

  return { questions: picked, poolReset }
}

// Fisher-Yates shuffle (same helper the store used upstream)
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
