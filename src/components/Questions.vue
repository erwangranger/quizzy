<template>
  <div>
    <p v-if="store.poolReset" class="pool-reset">{{ t('questions.poolReset') }}</p>
    <h3>{{ categoryLabel(currentQuestion.category) }}</h3>
    <h2>{{ currentQuestion.question }}</h2>
    <ul v-if="choicesVisible">
      <li v-for="(choice, i) in choices" :key="i">
        <button
        @click="answer(choice)"
        :disabled="store.isPaused"
        :class="choice.classes">{{ choice.text }}</button>
      </li>
    </ul>
    <div v-if="store.revealed" class="reveal">
      <p class="reveal-answer">
        <strong>{{ t('reveal.correctAnswer', { answer: currentQuestion.correct_answer }) }}</strong>
      </p>
      <p class="reveal-explanation-label">{{ t('reveal.explanation') }}</p>
      <p class="reveal-explanation">{{ currentQuestion.explanation }}</p>
      <!-- Quizmaster marks who was right -->
      <div v-if="store.mode === 'quizmaster'" class="marks">
        <p class="marks-label">{{ t('reveal.whoWasRight') }}</p>
        <button
          v-for="(player, i) in store.players"
          :key="i"
          :class="store.marks[i] ? 'mark-active' : null"
          @click="store.toggleMark(i)"
        >{{ player.name }}</button>
      </div>
      <!-- Pass-and-play: show every player's choice -->
      <div v-else class="choices-taken">
        <p v-for="(player, i) in store.players" :key="i">
          <strong>{{ player.name }}</strong>: {{ choiceLabel(i) }}
        </p>
      </div>
    </div>
    <!-- Quizmaster reveals the answer, then marks players -->
    <button v-if="store.mode === 'quizmaster' && !store.revealed" class="start" @click="store.revealAnswer()">
      {{ t('questions.reveal') }}
    </button>
    <!-- Skip: no one answers or scores this round (e.g. a seen question) -->
    <button v-if="!store.revealed" @click="skip">{{ t('questions.skip') }}</button>
    <!-- Next: scores and advances (quizmaster after marking, pass-and-play
         and solo after the reveal) -->
    <button v-if="showNext" class="start" @click="advance">
      {{ t('questions.next') }}
    </button>
    <!-- Leave the game and return to the Starter screen -->
    <button class="menu" @click="toMenu">{{ t('questions.menu') }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Choice } from '../store/store'
import { t, categoryLabel } from '../locales'

const store = useGameStore()

const currentQuestion = computed(() => store.questions[store.round])
const choices = computed(() => currentQuestion.value?.choices ?? [])

// Quizmaster open-answer play hides the choices until the reveal; otherwise
// choices stay on screen for everyone who answers.
const choicesVisible = computed(() => {
  if (store.isPassAndPlay()) return true
  return !store.hiddenChoices
})

// Pass-and-play records the tap privately and hands the phone over; the
// quizmaster taps Reveal instead, so taps are ignored there.
function answer(choice: Choice) {
  if (store.mode === 'quizmaster') return
  store.answer(choice)
}

// Next appears at the reveal in every mode: quizmaster after marking,
// pass-and-play and solo after every player has answered.
const showNext = computed(() => store.revealed)

// Which choice the player picked at the reveal (pass-and-play)
function choiceLabel(index: number): string {
  const choice = store.playerChoices[index]
  if (!choice) return '—'
  return choice.text
}

// Score the round and move on
function advance() {
  store.pauseGame()
  store.next()
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
}

// Skip the round: no one answers or scores
function skip() {
  store.skipRound()
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
}

// Leave the game and return to the Starter screen
function toMenu() {
  store.resetGame()
  store.newGame()
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
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

.reveal {
    background-color: $color-alt-dark;
    border-radius: 12px;
    color: $color-white;
    margin: 1em 0 0;
    padding: 1em;
    text-align: left;
}

.reveal-answer {
    margin: 0;
}

.reveal-explanation {
    font-size: 0.95em;
    margin: 0.5em 0 0;
}
.reveal-explanation-label {
    font-size: 0.8em;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 1em 0 0.25em;
    color: $color-med;
}

.marks {
    margin-top: 1em;

    .marks-label {
        margin: 0 0 0.5em;
    }

    button {
        margin: 0.25em;
        width: auto;
        min-height: 44px;
        padding: 0.5em 1em;
    }
}

.mark-active {
    background-color: $color-green;
    border: 2px solid $color-green;
    color: $color-white;
}

.choices-taken {
    margin-top: 1em;

    p {
        margin: 0.25em 0;
    }
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

// Secondary actions: skip the round, leave for the Starter screen
.menu,
.skip {
    background-color: transparent;
    border: 2px solid $color-white;
    border-radius: 12px;
    color: $color-white;
    font-size: 1em;
    margin: 1em 0;
    padding: 0.5em 1.5em;
}

.menu:hover,
.skip:hover {
    background-color: $color-alt-dark;
    border-color: $color-alt-dark;
}

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
</style>
