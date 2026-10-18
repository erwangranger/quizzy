<template>
  <div>
    <!-- Single player score card -->
    <div class="single" v-if="store.solo">
      <div class="droplet-container">
        <i
        class="droplet"
        v-for="(drop, i) in quantity"
        :class="store.scores.playerOne.history[i]"></i>
      </div>
    </div>
    <!-- multiplayer score cards -->
    <div class="multi" v-if="!store.solo">
      <!-- Player One score -->
      <div class="droplet-container">
        <i
        class="droplet"
        v-for="(drop, i) in quantity"
        :key="i"
        :class="store.scores.playerOne.history[i]"></i>
      </div>
      <!-- Player Two score -->
      <div class="droplet-container">
        <i
        class="droplet"
        v-for="(drop, i) in quantity"
        :key="i"
        :class="store.scores.playerTwo.history[i]"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../store/store'

const store = useGameStore()

// Quantity of dots, dependent on single player or multiplayer
const quantity = computed(() => (store.solo ? 10 : 5))
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
  display: flex;
  justify-content: space-around;
}

.single {
  display: flex;
  justify-content: center;
}

.correct {
  background-color: $color-green;
}

.incorrect {
  background-color: $color-red;
}
</style>
