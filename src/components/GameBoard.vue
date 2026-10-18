<template>
  <section>
    <!-- Display player turn in multiplayer mode -->
    <div v-if="!store.solo" class="turnDisplay">
      <h2 v-if="store.turn === 'playerOne'">{{ t('gameboard.playerOne') }}</h2>
      <h2 v-if="store.turn === 'playerTwo'">{{ t('gameboard.playerTwo') }}</h2>
    </div>
    <Questions />
    <ScoreDots />
    <StarPower />
  </section>
</template>

<script setup lang="ts">
import Questions from './Questions.vue'
import ScoreDots from './ScoreDots.vue'
import StarPower from './StarPower.vue'
import { useGameStore } from '../store/store'
import { t } from '../locales'

const store = useGameStore()
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

h2 {
    font-weight: bold;
}

section {
  max-width: 600px;
  position: relative;
}

.turnDisplay {
  background-color: $color-white;
  border-radius: 25px;
  color: $color-darkest;
  margin-bottom: 2em;
  padding: 0.15em;
}

@media (max-width: 600px) {
  h2 {
    margin: 0;
  }

  .turnDisplay {
    border-radius: 0;
    margin: 0;
  }
}
</style>
