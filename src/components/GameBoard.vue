<template>
  <section>
    <!-- Display player turn in multiplayer mode -->
    <div v-if="store.mode === 'pass-and-play' && !store.revealed" class="turnDisplay">
      <h2>{{ t('gameboard.turn', { name: currentName }) }}</h2>
    </div>
    <Questions />
    <ScoreDots />
    <StarPower />

    <!-- Pass-and-play interstitial: covers the board so the next player
         cannot see the previous answer. Solo skips it. -->
    <div v-if="showInterstitial" class="modal fade-in">
      <div class="interstitial-card slide-in">
        <h1>{{ t('interstitial.passTo', { name: currentName }) }}</h1>
        <button @click="ready">{{ t('interstitial.ready') }}</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Questions from './Questions.vue'
import ScoreDots from './ScoreDots.vue'
import StarPower from './StarPower.vue'
import { useGameStore } from '../store/store'
import { t } from '../locales'

const store = useGameStore()

const currentName = computed(() => store.players[store.answering]?.name ?? '')

// Shown after a player answers and before the next one is ready; not in solo
// play (one player, nothing to hide) and gone at the reveal.
const showInterstitial = computed(() => {
  return (
    store.isPassAndPlay() &&
    !store.solo &&
    !store.revealed &&
    store.isPaused &&
    store.answering > 0
  )
})

// Ready pressed: clear the previous player's button feedback and hand the
// phone over (the store unpauses).
function ready() {
  store.readyNext()
}

</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

h2 {
    font-weight: bold;
}

.turnDisplay {
  background-color: $color-white;
  border-radius: 25px;
  color: $color-darkest;
  margin-bottom: 2em;
  padding: 0.15em;
}

.modal {
  align-items: center;
  animation: fade-in .75s ease forwards; // defined in main.scss
  background-color: rgba(0, 0, 0, .5);
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0;
  width: 100%;
  z-index: 9999;
}

.interstitial-card {
  background-color: $color-white;
  border-radius: 25px;
  color: $color-darkest;
  padding: 2em;
  width: 85%;

  h1 {
    color: $color-darkest;
  }

  button {
    background-color: $color-med;
    border: 2px solid $color-med;
    color: $color-white;
    width: 90%;
  }
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
