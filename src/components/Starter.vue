<template>
  <section class="flex-center-col">
    <!-- Mode: single player vs multiplayer -->
    <button
    @click="store.selectMode(true)"
    :class="store.solo ? 'active' : null"
    >{{ t('starter.singlePlayer') }}</button>
    <button
    @click="store.selectMode(false)"
    :class="!store.solo ? 'active' : null"
    >{{ t('starter.multiplayer') }}</button>
    <button @click="startGame">{{ t('starter.start') }}</button>

    <!-- Multiplayer: quizmaster vs pass-and-play -->
    <div class="dropdown" v-if="!store.solo" @click="modeToggle">
      <div class="dropdown-label">
        <h2>{{ t('starter.mode') }}</h2>
        <transition name="fade" mode="out-in">
          <i class="material-icons expand-more" v-if="modeExpand" key="expand-more">expand_more</i>
          <i class="material-icons expand-less" v-else key="expand-less">expand_less</i>
        </transition>
      </div>
      <h3>{{ modeLabel }}</h3>
      <ul :class="modeClass">
        <li
        :class="store.mode === 'quizmaster' ? 'selected' : null"
        @click="store.setMultiplayerMode('quizmaster')"
        >{{ t('starter.quizmaster') }}</li>
        <li
        :class="store.mode === 'pass-and-play' ? 'selected' : null"
        @click="store.setMultiplayerMode('pass-and-play')"
        >{{ t('starter.passPlay') }}</li>
      </ul>
    </div>

    <!-- Player count and names (multiplayer only) -->
    <div class="dropdown" v-if="!store.solo" @click="playersToggle">
      <div class="dropdown-label">
        <h2>{{ t('starter.players') }}</h2>
        <transition name="fade" mode="out-in">
          <i class="material-icons expand-more" v-if="playersExpand" key="expand-more">expand_more</i>
          <i class="material-icons expand-less" v-else key="expand-less">expand_less</i>
        </transition>
      </div>
      <h3>{{ store.setup.players }}</h3>
      <ul :class="playersClass">
        <li
        v-for="n in maxPlayers"
        :key="n"
        :class="store.setup.players === n ? 'selected' : null"
        @click="store.setSetup({ players: n })"
        >{{ n }}</li>
      </ul>
    </div>

    <!-- Player name editing (multiplayer only) -->
    <div class="names" v-if="!store.solo">
      <label v-for="(player, i) in store.players" :key="i">
        <input
          type="text"
          :value="player.name"
          :aria-label="t('starter.playerName', { n: i + 1 })"
          @input="store.renamePlayer(i, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <!-- Quizmaster open-answer toggle -->
    <label class="toggle" v-if="!store.solo && store.mode === 'quizmaster'">
      <input type="checkbox" :checked="store.setup.hideChoices" @change="store.setSetup({ hideChoices: ($event.target as HTMLInputElement).checked })" />
      <span>{{ t('starter.hideChoices') }}</span>
    </label>

    <!-- Weighted scoring toggle (all modes) -->
    <label class="toggle">
      <input type="checkbox" :checked="store.setup.weightByDifficulty" @change="store.setSetup({ weightByDifficulty: ($event.target as HTMLInputElement).checked })" />
      <span>{{ t('starter.weightByDifficulty') }}</span>
    </label>

    <!-- Language selector -->
    <div class="dropdown" @click="langToggle">
      <div class="dropdown-label">
        <h2>{{ t('starter.language') }}</h2>
        <transition name="fade" mode="out-in">
          <i class="material-icons expand-more" v-if="langExpand" key="expand-more">expand_more</i>
          <i class="material-icons expand-less" v-else key="expand-less">expand_less</i>
        </transition>
      </div>
      <h3>{{ store.setup.lang }}</h3>
      <ul :class="langClass">
        <li
        v-for="lang in languages"
        :key="lang"
        @click="chooseLang(lang)"
        >{{ lang }}</li>
      </ul>
    </div>

    <!-- Category multi-select dropdown -->
    <div class="dropdown" @click="categoryToggle">
      <div class="dropdown-label">
        <h2>{{ t('starter.chooseCategory') }}</h2>
        <transition name="fade" mode="out-in">
          <i class="material-icons expand-more" v-if="categoryExpand" key="expand-more">expand_more</i>
          <i class="material-icons expand-less" v-else key="expand-less">expand_less</i>
        </transition>
      </div>
      <h3>{{ selectedCategoryLabel }}</h3>
      <ul :class="categoryClass">
        <li
        v-for="category in store.categories"
        :key="category"
        @click="toggleCategory(category)"
        >{{ category }}</li>
      </ul>
    </div>

    <!-- Question count selector -->
    <div class="dropdown" @click="countToggle">
      <div class="dropdown-label">
        <h2>{{ t('starter.questionCount') }}</h2>
        <transition name="fade" mode="out-in">
          <i class="material-icons expand-more" v-if="countExpand" key="expand-more">expand_more</i>
          <i class="material-icons expand-less" v-else key="expand-less">expand_less</i>
        </transition>
      </div>
      <h3>{{ store.setup.count }}</h3>
      <ul :class="countClass">
        <li
        v-for="n in questionCounts"
        :key="n"
        @click="store.setSetup({ count: n })"
        >{{ n }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useGameStore, MAX_PLAYERS } from '../store/store'
import { t } from '../locales'
import type { Category, Lang } from '../questions/schema'

const store = useGameStore()

const languages: Lang[] = ['en', 'fr']
const questionCounts = [5, 10, 15, 20]
const maxPlayers = MAX_PLAYERS

const langClass = reactive({ close: false, open: false })
const categoryClass = reactive({ close: false, open: false })
const countClass = reactive({ close: false, open: false })
const modeClass = reactive({ close: false, open: false })
const playersClass = reactive({ close: false, open: false })
const langExpand = ref(true)
const categoryExpand = ref(true)
const countExpand = ref(true)
const modeExpand = ref(true)
const playersExpand = ref(true)

const selectedCategoryLabel = computed(() => {
  const chosen = store.setup.categories
  if (chosen.length === 0) return t('starter.allCategories')
  if (chosen.length === 1) return chosen[0]
  return `${chosen.length} ${t('starter.categoriesSelected')}`
})

const modeLabel = computed(() =>
  store.mode === 'quizmaster' ? t('starter.quizmaster') : t('starter.passPlay'),
)

// Toggle a category in the multi-select (empty list = all categories)
function toggleCategory(category: Category) {
  const chosen = store.setup.categories
  const next = chosen.includes(category)
    ? chosen.filter((c) => c !== category)
    : [...chosen, category]
  store.setSetup({ categories: next })
}

function chooseLang(lang: Lang) {
  store.setSetup({ lang, categories: [] })
}

function toggle(open: { open: boolean; close: boolean }) {
  if (open.open) {
    open.open = false
    open.close = true
  } else {
    open.open = true
    open.close = false
  }
}

function langToggle() {
  langExpand.value = !langExpand.value
  toggle(langClass)
}

function categoryToggle() {
  categoryExpand.value = !categoryExpand.value
  toggle(categoryClass)
}

function countToggle() {
  countExpand.value = !countExpand.value
  toggle(countClass)
}

function modeToggle() {
  modeExpand.value = !modeExpand.value
  toggle(modeClass)
}

function playersToggle() {
  playersExpand.value = !playersExpand.value
  toggle(playersClass)
}

function startGame() {
  store.startGame()
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

@media (max-width: 600px) {
    section {
        padding: 0 2.5%;
    }
}

.expand-less,
.expand-more,
h2,
li {
    cursor: pointer;
}

h3 {
    color: $color-white;
    margin: 0;
}

li {
    margin: 0.5em 0;
    transition: all 0.3s ease;
    &:hover {
        color: $color-white;
        transform: scale(1.5);
    }
}

// Selected category in the multi-select
.selected {
    color: $color-green;
    font-weight: bold;
}

ul {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
}

// Selected mode button
.active {
    background-color: $color-darkest;
    border: 2px solid $color-darkest;
    color: $color-white;
}

.dropdown-label {
    align-items: center;
    display: flex;
    justify-content: center;
}

// Dropdown expand icon
.expand-less,
.expand-more {
    font-size: 2em;
    padding-top: 7px;
    margin-left: 15px;
    transition: all 0.3s ease;
}

.expand-more {
    color: $color-white;
    &:hover {
        color: $color-darkest;
    }
}

.expand-less {
    color: $color-darkest;
    &:hover {
        color: $color-white;
    }
}

// Open dropdown
.open {
    animation: open 1s ease forwards;
}

// Close dropdown
.close {
    animation: close 1s ease forwards;
}

// Editable player names
.names {
    display: flex;
    flex-direction: column;
    width: 90%;
    max-width: 400px;

    input {
        border: 2px solid $color-white;
        border-radius: 12px;
        color: $color-darkest;
        font-family: 'Quicksand', sans-serif;
        font-size: 1em;
        margin: 0.25em 0;
        padding: 0.6em 1em;
        text-align: center;
    }
}

// Setup toggles (hide choices, weighted scoring)
.toggle {
    align-items: center;
    display: flex;
    font-size: 1.1em;
    gap: 0.5em;
    margin: 0.25em 0;
    min-height: 44px;

    input {
        height: 22px;
        width: 22px;
    }
}
</style>
