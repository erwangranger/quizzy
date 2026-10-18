<template>
  <div class="modal fade-in">
    <div class="container slide-in">
      <!-- Single player scores -->
      <div v-if="store.solo">
        <h1>{{ t('gameover.title') }}</h1>
        <h2 v-if="store.setup.weightByDifficulty">{{ t('gameover.points', { points: store.players[0]?.score.total ?? 0 }) }}</h2>
        <h2 v-else>{{ t('gameover.score', { score: store.players[0]?.score.total ?? 0, total: store.questions.length }) }}</h2>
        <p>{{ scoreMessage }}</p>
        <h3>{{ t('gameover.breakdown') }}</h3>
        <ul class="breakdown">
          <li v-for="(line, i) in soloBreakdown" :key="i">{{ line }}</li>
        </ul>
      </div>
      <!-- Multiplayer ranking -->
      <div v-else>
        <h1>{{ t('gameover.title') }}</h1>
        <h3>{{ t('gameover.breakdown') }}</h3>
        <ol class="ranking">
          <li v-for="(entry, i) in store.ranking" :key="i">
            <h2>
              {{ rankLabel(entry.rank) }}
              {{ entry.player.name }}
              <span :class="entry.rank === 1 ? 'score-high' : ''">
                {{ t('gameover.points', { points: entry.player.score.total }) }}
              </span>
              — {{ t('gameover.correct', { correct: correctCount(entry.player), total: store.questions.length }) }}
            </h2>
            <ul class="breakdown" v-if="breakdownText(entry.player).length > 0">
              <li v-for="(line, i) in breakdownText(entry.player)" :key="i">{{ line }}</li>
            </ul>
          </li>
        </ol>
      </div>
      <!-- Restart game buttons -->
      <button @click="newGame(true)">{{ t('gameover.newGame') }}</button>
      <button v-if="!store.solo" @click="newGame(false)">{{ t('gameover.rematch') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Player } from '../store/store'
import { t, categoryLabel } from '../locales'
import type { Category } from '../questions/schema'

const store = useGameStore()

// Award message for solo mode, by correct-answer ratio (not weighted points)
const scoreMessage = computed(() => {
  const total = Math.max(store.questions.length, 1)
  const player = store.players[0]
  const correct = player ? correctCount(player) : 0
  const ratio = correct / total
  if (correct === 0) return t('message.0')
  if (ratio >= 1) return t('message.10')
  if (ratio >= 0.8) return t('message.8')
  if (ratio >= 0.6) return t('message.6')
  if (ratio >= 0.4) return t('message.4')
  if (ratio >= 0.2) return t('message.2')
  return t('message.1')
})

// Solo: one line per category answered correctly.
const soloBreakdown = computed(() => {
  const counts = store.categoryBreakdown[0]
  if (!counts) return []
  return (Object.keys(counts) as Category[]).map(
    (category) => `${categoryLabel(category)}: ${counts[category]}`,
  )
})

// Correct history entries per player (weighting can make total != count)
function correctCount(player: Player): number {
  return player.score.history.filter((h) => h.correct).length
}

// Ties share a rank: "1." for winners, "2." etc. afterwards.
function rankLabel(rank: number): string {
  return `${rank}.`
}

// One readable line per category the player answered correctly.
function breakdownText(player: Player): string[] {
  const index = store.players.indexOf(player)
  const counts = store.categoryBreakdown[index]
  if (!counts) return []
  return (Object.keys(counts) as Category[]).map(
    (category) => `${categoryLabel(category)}: ${counts[category]}`,
  )
}

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

h3 {
  color: $color-darkest;
  margin-top: 1em;
}

.ranking {
  list-style: none;
  margin: 0;
  padding: 0;
  text-align: left;
}

.breakdown {
  list-style: none;
  margin: 0;
  padding: 0 0 0 1.5em;
  font-size: 0.9em;

  li {
    color: $color-dark;
  }
}

.container {
  background-color: $color-white;
  border-radius: 25px;
  color: $color-med;
  margin-top: 4em;
  max-height: 80vh;
  overflow-y: auto;
  padding: 2em 2.5%;
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
