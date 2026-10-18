<template>
  <div>
    <div
      class="droplet-container"
      v-for="(player, p) in store.players"
      :key="p"
      :class="store.players.length > 1 ? 'multi' : 'single'"
    >
      <i
      class="droplet"
      v-for="(drop, i) in quantity"
      :key="i"
      :class="player.score.history[i]"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../store/store'

const store = useGameStore()

// Dots follow the rounds actually played; skipped questions show no dot
// (works for 1-6 players, one history row per player).
const quantity = computed(() => Math.max(store.answeredTotal, 1))
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.droplet-container {
  display: flex;
  flex-direction: row;
  margin-bottom: 2em;
}

.droplet {
  background-color: whitesmoke;
  border-radius: 100%;
  margin: 0 5px;
  width: 10px;
  height: 10px;
}

.multi {
  justify-content: flex-start;
}

.single {
  justify-content: center;
}

.correct {
  background-color: $color-green;
}

.incorrect {
  background-color: $color-red;
}
</style>
