<template>
  <div>
    <p v-if="store.poolReset" class="pool-reset">{{ t('questions.poolReset') }}</p>
    <h3>{{ currentQuestion.category }}</h3>
    <h2>{{ currentQuestion.question }}</h2>
    <ul>
      <li v-for="(choice, i) in choices" :key="i">
        <button
        @click="answer(choice)"
        :disabled="store.isPaused"
        :class="choice.classes">{{ choice.text }}</button>
      </li>
    </ul>
    <button v-if="store.isPaused" @click="advance">{{ t('questions.next') }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Choice } from '../store/store'
import { t } from '../locales'

const store = useGameStore()

const currentQuestion = computed(() => store.questions[store.round])
const choices = computed(() => currentQuestion.value?.choices ?? [])

// Reset board, present next question
function advance() {
  store.pauseGame()
  store.incrementRound()
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

.pool-reset {
    background-color: $color-alt-med;
    border-radius: 12px;
    color: $color-white;
    font-size: 0.9em;
    margin: 0 0 1em;
    padding: 0.4em 1em;
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
