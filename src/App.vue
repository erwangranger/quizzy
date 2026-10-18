<template>
  <!-- starPower hack for proper animation display on style binding -->
  <div class="container" :style="store.starPower ? 'overflow: hidden' : 'overflow: inherit'">
    <GameOverModal v-if="store.isGameOver" />

    <div class="about-button" @click="store.aboutToggle()">
      <transition name="fade" mode="out-in">
        <i class="material-icons icon-menu" v-if="!store.aboutShow" key="menu">menu</i>
        <i class="material-icons icon-close" v-else key="close">close</i>
      </transition>
    </div>

    <main>
      <header :class="store.currentView === 'app-intro' ? 'grow' : 'small'">
        <h1>{{ t('app.title') }}</h1>
      </header>

      <transition name="expand" mode="out-in">
        <About v-if="store.aboutShow" />
      </transition>

      <!-- Primary page components -->
      <transition name="fade" mode="out-in">
        <Intro v-if="store.currentView === 'app-intro'" />
        <Loader v-else-if="store.currentView === 'app-loader'" />
        <GameBoard v-else-if="store.currentView === 'app-game-board'" />
      </transition>

    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import About from './components/About.vue'
import GameBoard from './components/GameBoard.vue'
import GameOverModal from './components/GameOverModal.vue'
import Intro from './components/Intro.vue'
import Loader from './components/Loader.vue'
import { useGameStore } from './store/store'
import { t } from './locales'

const store = useGameStore()

onMounted(() => {
  // Fetch categories from open trivia, send to store (Phase 1 removes this)
  store.fetchCategories()
})
</script>

<style lang="scss">
@use './styles/variables' as *;

$header-shrink-scale: .66;

header {
  //background-color: $color-darkest;
  color: $color-white;
  transform: scale(1); //width: 100%;
}

h1,
p {
  margin: 0;
}

main {
  align-items: center;
  animation: fade-in 1.5s ease; // defined in main.scss
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
}

.about-button {
  align-items: center;
  background-color: $color-darkest;
  border: 2px solid $color-med;
  border-radius: 100%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  position: fixed;
  right: .5em;
  top: .25em;
  width: 40px;
  height: 40px;
  z-index: 1000;
}

.container {
  width: 100%;
}

.icon-menu,
.icon-close {
  transition: all .3s ease;

  &:hover {
    color: $color-med;
  }
}

.grow {
  animation: grow 0.5s ease forwards; //background-color: $color-dark;
}

.small {
  animation: squeeze 0.5s ease forwards; //background-color: $color-darkest;
}

@keyframes grow {
  from {
    transform: scale($header-shrink-scale);
    padding: 0.25em 0;
  }
  to {
    transform: scale(1);
    padding: 1em;
  }
}

@keyframes squeeze {
  from {
    transform: scale(1);
    padding: 1em;
  }
  to {
    transform: scale($header-shrink-scale);
    padding: 0.5em 0;
  }
}

.expand-enter-active {
  animation: open .75s ease forwards;
}

.expand-leave-active {
  animation: close .5s ease forwards;
}


</style>
