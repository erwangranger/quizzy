<template>
  <div>
    <h3>{{ currentQuestion.category }}</h3>
    <h2>{{ decodedQuestion }}</h2>
    <ul>
      <li v-for="(choice, i) in choices" :key="i">
        <button
        @click="answer(choice)"
        :disabled="store.isPaused"
        :class="choice.classes">{{ decode(choice.text) }}</button>
      </li>
    </ul>
    <button v-if="store.isPaused" @click="advance">{{ t('questions.next') }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Choice } from '../store/store'
import { decode } from '../utils/htmlEntity'
import { t } from '../locales'

const store = useGameStore()

const currentQuestion = computed(() => store.questions[store.round])
const choices = computed(() => currentQuestion.value?.choices ?? [])
// Decode HTML entities in question. Based on htmlEntity mixin
const decodedQuestion = computed(() => decode(currentQuestion.value?.question ?? ''))

// Reset board, present next question
function advance() {
  // Proceed if less than 10 rounds
  if (store.round <= 8) {
    store.pauseGame()
    store.incrementRound()
  }
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
}

// Resolve answer
function answer(choice: Choice) {
  // Pause game state (effects buttons)
  store.pauseGame('pause')
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
  // Apply button styles for correct / incorrect
  store.styleButtons()
  // Check mode for payload
  let mode: 'playerOne' | 'playerTwo'
  if (store.solo || store.turn === 'playerOne') {
    mode = 'playerOne'
  } else {
    mode = 'playerTwo'
  }
  // Check for correct answer and score
  if (choice.answer) {
    // Score correctly
    store.score({ correct: true, mode })
    // Call down the stars!
    store.starPowerOn()
  } else {
    // Score incorrectly
    store.score({ correct: false, mode })
  }
  store.isGameOverCheck()
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

div {
    background-color: #0277BD;
    border-radius: 25px;
    margin-bottom: 2em;
    padding: 1em 1em 2.5em;
    min-width: 320px;
}

h3 {
    color: $color-med;
}

@media (max-width: 600px) {
  div {
    border-radius: 0;
    margin-bottom: 1em;
    padding: .25em 1em 1.5em;
    min-width: auto;
  }
}

.correct {
    background-color: $color-green;
    border: 2px solid $color-green;
    color: $color-white;
}

.incorrect {
    background-color: $color-red;
    border: 2px solid $color-red;
    color: $color-white;
}
</style>
