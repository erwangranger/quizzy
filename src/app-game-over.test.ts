// Regression: the game-over tally must appear when the last round completes.
// The perf commit 0762018 dropped the <GameOverModal v-if="store.isGameOver" />
// render from App.vue while keeping the import, so the last Next click set
// isGameOver with nothing on screen — no tally, no next question.
import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'
import { useGameStore } from './store/store'
import { t } from './locales'

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

describe('game-over tally render', () => {
  beforeEach(() => {
    storage.clear()
    setActivePinia(createPinia())
  })

  it('shows the tally breakdown after the last question', async () => {
    const store = useGameStore()
    await store.startGame()
    store.questions = store.questions.slice(0, 2)
    store.setup.count = 2
    const wrapper = mount(App)

    // Play to the end: solo, reveal then next each round.
    for (let round = 0; round < 2; round++) {
      store.revealAnswer()
      const correct = store.questions[store.round].choices.find((c) => c.answer)!
      store.score(0, correct.answer ? 1 : 0)
      await flushPromises()
      store.next()
      await flushPromises()
    }
    expect(store.isGameOver).toBe(true)

    const modal = wrapper.find('.modal .container')
    expect(modal.exists()).toBe(true)
    // The tally heading is rendered and at least one category line follows.
    expect(modal.text()).toContain(t('gameover.breakdown'))
    expect(wrapper.findAll('.breakdown li').length).toBeGreaterThan(0)
  })
})
