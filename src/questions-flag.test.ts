// Regression/behavior tests for the flag-this-question UI on the reveal
// screen: button appears only after reveal, tap copies the report to the
// clipboard and shows reason chips, a chip opens the prefilled GitHub issue,
// and leaving the reveal screen resets the tray.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Questions from './components/Questions.vue'
import { useGameStore, type Choice, type GameQuestion } from './store/store'
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

const fixture: GameQuestion = {
  id: 'geo-0001',
  lang: 'en',
  category: 'geography',
  difficulty: 1,
  question: 'What is the capital of France?',
  correct_answer: 'Paris',
  incorrect_answers: ['Lyon', 'Marseille', 'Nice', 'Toulouse'],
  explanation: 'Paris has been the capital since 987 CE.',
  source_url: 'https://en.wikipedia.org/wiki/Paris',
  as_of: '2026-01-15',
  origin: 'human',
  reviewed: true,
  choices: [
    { text: 'Paris', answer: true, letter: 'A', classes: { correct: false, incorrect: false } },
    { text: 'Lyon', answer: false, letter: 'B', classes: { correct: false, incorrect: false } },
    { text: 'Marseille', answer: false, letter: 'C', classes: { correct: false, incorrect: false } },
    { text: 'Nice', answer: false, letter: 'D', classes: { correct: false, incorrect: false } },
  ],
}

describe('flag this question', () => {
  beforeEach(() => {
    storage.clear()
    setActivePinia(createPinia())
  })

  function seedStore() {
    const store = useGameStore()
    store.setup.lang = 'en'
    store.setup.players = 1
    store.questions = [fixture]
    store.round = 0
    return store
  }

  it('hides the flag button before the reveal and shows it after', async () => {
    const store = seedStore()
    const wrapper = mount(Questions)
    expect(wrapper.find('.flag-btn').exists()).toBe(false)
    store.revealAnswer()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flag-btn').exists()).toBe(true)
    expect(wrapper.find('.flag-btn').text()).toContain(t('questions.flag'))
  })

  it('copies the report to the clipboard and shows reason chips on tap', async () => {
    const store = seedStore()
    store.revealAnswer()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const wrapper = mount(Questions)

    await wrapper.find('.flag-btn').trigger('click')
    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain('What is the capital of France?')
    expect(copied).toContain('https://github.com/erwangranger/quizzy/issues/new?')
    expect(wrapper.find('.flag-copied').exists()).toBe(true)

    // A question with as_of and source_url offers all four reasons
    const chips = wrapper.findAll('.flag-chip')
    expect(chips).toHaveLength(4)
    expect(chips.map((c) => c.text())).toEqual([
      t('flag.wrongAnswer'),
      t('flag.badExplanation'),
      t('flag.stale'),
      t('flag.deadSource'),
    ])
  })

  it('opens the prefilled GitHub issue with the chip reason in the title', async () => {
    const store = seedStore()
    store.revealAnswer()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const open = vi.fn()
    Object.defineProperty(window, 'open', { configurable: true, value: open })
    const wrapper = mount(Questions)

    await wrapper.find('.flag-btn').trigger('click')
    const chips = wrapper.findAll('.flag-chip')
    await chips[0].trigger('click')

    expect(open).toHaveBeenCalledTimes(1)
    const url = open.mock.calls[0][0] as string
    const parsed = new URL(url)
    const title = parsed.searchParams.get('title') ?? ''
    expect(title).toContain('geo-0001')
    expect(title).toContain(t('flag.wrongAnswer'))
    // Tray resets after reporting
    expect(wrapper.find('.flag-chip').exists()).toBe(false)
    expect(wrapper.find('.flag-btn').exists()).toBe(true)
  })

  it('offers only wrongAnswer and badExplanation without as_of or source_url', async () => {
    const store = seedStore()
    store.questions = [{ ...fixture, as_of: null, source_url: null }]
    store.revealAnswer()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('no clipboard')) },
    })
    const wrapper = mount(Questions)

    await wrapper.find('.flag-btn').trigger('click')
    const chips = wrapper.findAll('.flag-chip')
    expect(chips).toHaveLength(2)
    // Clipboard failure must not block the tray
    expect(wrapper.find('.flag-copied').exists()).toBe(false)
  })

  it('resets the tray when advancing to the next question', async () => {
    const store = seedStore()
    store.revealAnswer()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const wrapper = mount(Questions)

    await wrapper.find('.flag-btn').trigger('click')
    expect(wrapper.find('.flag-chip').exists()).toBe(true)

    store.setup.count = 2
    store.questions = [fixture, { ...fixture, id: 'geo-0002' }]
    await wrapper.find('.foot-actions .primary').trigger('click')
    store.revealAnswer()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.flag-chip').exists()).toBe(false)
    expect(wrapper.find('.flag-btn').exists()).toBe(true)
  })
})
