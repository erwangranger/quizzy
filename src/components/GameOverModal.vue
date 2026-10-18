<template>
  <div class="modal fade-in">
    <div class="container slide-in">
      <!-- Single player scores -->
      <div v-if="store.solo">
        <h1>{{ t('gameover.title') }}</h1>
        <h2>{{ t('gameover.score', { score: store.scores.playerOne.total, total: store.questions.length }) }}</h2>
        <p>{{ scoreMessage }}</p>
      </div>
      <!-- Multiplayer scores -->
      <div v-if="!store.solo">
        <!-- Win conditions -->
        <h1 v-if="store.scores.playerOne.total > store.scores.playerTwo.total">{{ t('gameover.playerOneWins') }}</h1>
        <h1 v-if="store.scores.playerTwo.total > store.scores.playerOne.total">{{ t('gameover.playerTwoWins') }}</h1>
        <h1 v-if="store.scores.playerOne.total === store.scores.playerTwo.total">{{ t('gameover.draw') }}</h1>
        <!-- Results -->
        <h2>{{ t('gameover.playerOne', { score: store.scores.playerOne.total }) }} <span :class="store.scores.playerOne.total >= store.scores.playerTwo.total ? 'score-high' : 'score-low'"></span></h2>
        <h2>{{ t('gameover.playerTwo', { score: store.scores.playerTwo.total }) }} <span :class="store.scores.playerTwo.total >= store.scores.playerOne.total ? 'score-high' : 'score-low'"></span></h2>
      </div>
      <!-- Restart game buttons -->
      <button @click="newGame(true)">{{ t('gameover.newGame') }}</button>
      <button v-if="!store.solo" @click="newGame(false)">{{ t('gameover.rematch') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../store/store'
import { t } from '../locales'

const store = useGameStore()

// Award message for solo mode
const scoreMessage = computed(() => {
  const cases = {
    0: t('message.0'),
    1: t('message.1'),
    2: t('message.2'),
    3: t('message.3'),
    4: t('message.4'),
    5: t('message.5'),
    6: t('message.6'),
    7: t('message.7'),
    8: t('message.8'),
    9: t('message.9'),
    10: t('message.10'),
  }
  const score = store.scores.playerOne.total
  if (score) {
    return cases[score as keyof typeof cases]
  }
  return ''
})

function newGame(payload: boolean) {
  store.resetGame()
  if (payload) {
    store.newGame()
  } else {
    store.startGame()
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

button {
  background-color: $color-med;
  border: 2px solid $color-med;
  color: $color-white;
  width: 90%;
  &:first-child {
    margin-top: 2em;
  }
}

h1, p {
  color: $color-darkest;
}

h2 {
  color: $color-dark;
}

.container {
  background-color: $color-white;
  border-radius: 25px;
  color: $color-med;
  margin-top: 4em;
  padding: 2em 2.5%;
  //height: 500px;
}

.modal {
  align-items: center;
  animation: fade-in .75s ease forwards; // defined in main.scss
  background-color: rgba(0, 0, 0, .5);
  display: flex;
  flex-direction: column;
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.slide-in {
  animation: slide-in .75s ease forwards;
}

@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateY(-400px);
  }
  25% {
    transform: translateY(100px);
  }
  75% {
    opacity: 1;
  }
  100% {
    transform: translateY(0);
  }
}

@media (hover:hover) {
  button:hover {
    background-color: $color-white;
    border: 2px solid $color-med;
    color: $color-med;
  }
}

@media (max-width: 600px) {
  .container {
    width: 85%;
  }
}

@media (min-width: 600px) {
  .container {
    width: 500px;
  }
}
</style>
