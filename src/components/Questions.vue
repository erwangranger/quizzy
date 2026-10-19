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
    <!-- Everything that is not an answer lives in a footer strip below a
         hairline, so no action resembles the answer buttons above -->
    <div class="foot">
      <div v-if="store.revealed" class="reveal">
        <p class="reveal-answer">
          <strong>{{ t('reveal.correctAnswer', { answer: currentQuestion.correct_answer }) }}</strong>
        </p>
        <p class="reveal-explanation-label">{{ t('reveal.explanation') }}</p>
        <p class="reveal-explanation">{{ currentQuestion.explanation }}</p>
        <span v-if="currentQuestion.as_of" class="as-of-badge">{{ t('reveal.asOf', { date: currentQuestion.as_of }) }}</span>
        <a v-if="currentQuestion.source_url" :href="currentQuestion.source_url" target="_blank" rel="noopener noreferrer" class="source-link">{{ t('reveal.source') }}</a>
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
      <!-- Persistent per-player tally: each player's running score, visible
           while advancing between questions (solo shows one entry) -->
      <div class="tally">
        <p v-for="(player, i) in store.players" :key="i">
          <strong>{{ player.name }}</strong>: {{ t('gameover.points', { points: player.score.total }) }}
        </p>
      </div>
      <div class="foot-actions">
        <!-- Skip: no one answers or scores this round (e.g. a seen question) -->
        <button v-if="!store.revealed" class="text-btn" @click="skip">{{ t('questions.skip') }}</button>
        <!-- Leave the game and return to the Starter screen -->
        <button class="text-btn" @click="toMenu">{{ t('questions.menu') }}</button>
        <!-- Quizmaster reveals the answer, then marks players -->
        <button v-if="store.mode === 'quizmaster' && !store.revealed" class="primary" @click="store.revealAnswer()">
          {{ t('questions.reveal') }}
        </button>
        <!-- Next: scores and advances (quizmaster after marking, pass-and-play
             and solo after the reveal) -->
        <button v-if="showNext" class="primary" @click="advance">
          {{ t('questions.next') }}
        </button>
      </div>
    </div>
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
    padding: 1em 1em .5em;
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

.as-of-badge {
    display: block;
    font-size: 0.75em;
    color: $color-med;
    margin-top: 0.15em;
}

.source-link {
    display: inline-block;
    margin-top: 0.5em;
    color: $color-green;
    text-decoration: underline;
    font-size: 0.9em;
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
.tally {
    margin: 1em 0 0;
    padding: 0;
    min-width: 0;
    border-radius: 0;
    background: transparent;

    p {
        margin: 0.25em 0;
        font-size: 0.9em;
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
    padding: .25em 1em .5em;
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
// Footer strip: everything that is not an answer sits below a hairline,
// separated from the answer buttons' visual zone
.foot {
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 0;
    margin: 1.2em 0 0;
    min-width: 0;
    padding: 0.8em 1em 0;
}

.reveal {
    background-color: $color-alt-dark;
    border-radius: 12px;
    color: $color-white;
    margin: 0.8em 0;
    padding: 1em;
    text-align: left;
}

.foot-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin: 0;
    min-width: 0;
    padding: 0 0 0.6em;
}

// Quiet text actions: skip the round, leave for the Starter screen
.text-btn {
    background: transparent;
    border: 0;
    border-radius: 0;
    color: $color-white;
    opacity: 0.75;
    font-size: 0.85em;
    font-family: 'Quicksand', sans-serif;
    padding: 0.4em 0.6em;
    cursor: pointer;
    width: auto;
    max-width: none;
    min-height: 44px;
}

.text-btn:hover {
    opacity: 1;
}

// Compact primary action: reveal the answer, next question
.primary {
    background-color: $color-green;
    border: 2px solid $color-green;
    border-radius: 10px;
    color: $color-darkest;
    font-size: 0.95em;
    font-weight: bold;
    margin: 0 0 0 auto;
    padding: 0.5em 1.4em;
    width: auto;
}

@media (hover:hover) {
    .primary:hover,
    .primary:active {
        background-color: $color-green;
        border-color: $color-green;
        color: $color-darkest;
    }
}
</style>
