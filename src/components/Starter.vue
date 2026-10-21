<template>
  <section class="flex-center-col">
    <!-- Language selector (segmented) -->
    <div class="seg-row">
      <span class="seg-label">{{ t('starter.language') }}</span>
      <div class="seg" role="group" :aria-label="t('starter.language')">
        <button
        v-for="lang in languages"
        :key="lang"
        type="button"
        :class="store.setup.lang === lang ? 'on' : null"
        @click="chooseLang(lang)"
        >{{ lang }}</button>
      </div>
    </div>

    <!-- Player count (1–4, segmented): one player is solo, 2+ reveals the mode choice -->
    <div class="seg-row">
      <span class="seg-label">{{ t('starter.players') }}</span>
      <div class="seg" role="group" :aria-label="t('starter.players')">
        <button
        v-for="n in maxPlayers"
        :key="n"
        type="button"
        :class="store.setup.players === n ? 'on' : null"
        @click="store.setSetup({ players: n })"
        >{{ n }}</button>
      </div>
    </div>

    <!-- Player name editing (one input per player) -->
    <div class="names">
      <label v-for="(player, i) in store.players" :key="i">
        <input
          type="text"
          :value="player.name"
          :aria-label="t('starter.playerName', { n: i + 1 })"
          @input="store.renamePlayer(i, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <!-- Multiplayer: quizmaster vs pass-and-play (segmented, 2+ players only) -->
    <div class="seg-row" v-if="store.setup.players >= 2">
      <span class="seg-label">{{ t('starter.mode') }}</span>
      <div class="seg" role="group" :aria-label="t('starter.mode')">
        <button
        type="button"
        :class="store.mode === 'quizmaster' ? 'on' : null"
        @click="store.setMultiplayerMode('quizmaster')"
        >{{ t('starter.quizmaster') }}</button>
        <button
        type="button"
        :class="store.mode === 'pass-and-play' ? 'on' : null"
        @click="store.setMultiplayerMode('pass-and-play')"
        >{{ t('starter.passPlay') }}</button>
      </div>
    </div>

    <!-- Quizmaster open-answer toggle -->
    <label class="toggle" v-if="store.mode === 'quizmaster'">
      <input type="checkbox" :checked="store.setup.hideChoices" @change="store.setSetup({ hideChoices: ($event.target as HTMLInputElement).checked })" />
      <span>{{ t('starter.hideChoices') }}</span>
    </label>

    <!-- Weighted scoring toggle (all modes) -->
    <label class="toggle">
      <input type="checkbox" :checked="store.setup.weightByDifficulty" @change="store.setSetup({ weightByDifficulty: ($event.target as HTMLInputElement).checked })" />
      <span>{{ t('starter.weightByDifficulty') }}</span>
    </label>

    <!-- Category multi-select chips -->
    <div class="chips-row">
      <span class="seg-label">{{ t('starter.chooseCategory') }}</span>
      <div class="chips" role="group" :aria-label="t('starter.chooseCategory')">
        <button
        v-for="category in store.categories"
        :key="category"
        type="button"
        :class="store.setup.categories.includes(category) ? 'on' : null"
        :aria-pressed="store.setup.categories.includes(category)"
        @click="toggleCategory(category)"
        >{{ categoryLabel(category) }}</button>
      </div>
    </div>

    <!-- Question count selector (segmented) -->
    <div class="seg-row">
      <span class="seg-label">{{ t('starter.questionCount') }}</span>
      <div class="seg" role="group" :aria-label="t('starter.questionCount')">
        <button
        v-for="n in questionCounts"
        :key="n"
        type="button"
        :class="store.setup.count === n ? 'on' : null"
        @click="store.setSetup({ count: n })"
        >{{ n }}</button>
      </div>
    </div>
    <!-- Launch button: clearly differentiated primary action, always last -->
    <button class="start" @click="startGame">{{ t('starter.start') }}</button>
  </section>
</template>

<script setup lang="ts">
import { useGameStore, MAX_PLAYERS } from '../store/store'
import { t, categoryLabel } from '../locales'
import type { Category, Lang } from '../questions/schema'

const store = useGameStore()

const languages: Lang[] = ['en', 'fr']
const questionCounts = [5, 10, 15, 20]
const maxPlayers = MAX_PLAYERS


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


// Segmented settings rows: label left, all options always visible
.seg-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
    justify-content: center;
    max-width: 400px;
    width: 100%;
}

.seg-label {
    font-size: 1em;
    min-width: 110px;
    text-align: right;
}

.seg {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;

    button {
        background: transparent;
        border: 2px solid transparent;
        border-radius: 9px;
        color: $color-white;
        flex: 1;
        font-size: 1em;
        margin: 0;
        max-width: none;
        min-height: 44px;
        padding: 0.4em 0.6em;
        transition: background 0.2s ease;
        width: auto;

        &.on {
            background: $color-green;
            color: $color-darkest;
            font-weight: bold;
        }
    }
}

// Category multi-select chips: tap toggles on/off
.chips-row {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    max-width: 400px;
    width: 100%;

    .seg-label {
        text-align: center;
    }
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    justify-content: center;

    button {
        background: transparent;
        border: 2px solid $color-white;
        border-radius: 999px;
        color: $color-white;
        font-size: 1em;
        margin: 0;
        max-width: none;
        min-height: 44px;
        padding: 0.4em 1.1em;
        transition: all 0.2s ease;
        width: auto;

        &.on {
            background: $color-green;
            border-color: $color-green;
            color: $color-darkest;
            font-weight: bold;
        }
    }
}

@media (hover:hover) {
    .seg button:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: transparent;
        color: $color-white;
    }

    .chips button:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: $color-white;
        color: $color-white;
    }

    .seg button.on:hover {
        background: $color-green;
        border-color: transparent;
        color: $color-darkest;
    }

    .chips button.on:hover {
        background: $color-green;
        border-color: $color-green;
        color: $color-darkest;
    }
}
// Launch button: differentiated primary action
.start {
    background-color: $color-green;
    border: 2px solid $color-green;
    color: $color-darkest;
    font-size: 1.5em;
    font-weight: bold;
    max-width: none;
}

@media (hover:hover) {
    .start:hover,
    .start:active {
        background-color: $color-green;
        border: 2px solid $color-green;
        color: $color-darkest;
    }
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
