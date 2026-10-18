<template>
  <section class="flex-center-col">
    <button
    @click="store.selectMode(true)"
    :class="store.solo ? 'active' : null"
    >{{ t('starter.singlePlayer') }}</button>
    <button
    @click="store.selectMode(false)"
    :class="!store.solo ? 'active' : null"
    >{{ t('starter.multiplayer') }}</button>
    <button @click="startGame">{{ t('starter.start') }}</button>

    <!-- Category dropdown selector -->
    <div class="dropdown" @click="dropdownToggle">
      <!-- dropdown label -->
      <div class="dropdown-label">
        <h2>{{ t('starter.chooseCategory') }}</h2>
        <!-- toggle expand icons -->
        <transition name="fade" mode="out-in">
          <i class="material-icons expand-more" v-if="toggleExpand" key="expand-more">expand_more</i>
          <i class="material-icons expand-less" v-else key="expand-less">expand_less</i>
        </transition>
      </div>
      <h3>{{ store.currentCategory.name }}</h3>
      <ul :class="dropdownClass">
        <li @click="chooseCategory({ name: 'Random', id: 9 })">{{ t('starter.random') }}</li>
        <li v-for="category in store.categories" :key="category.id" @click="chooseCategory(category)">{{ category.name }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useGameStore } from '../store/store'
import { t } from '../locales'

const store = useGameStore()

const dropdownClass = reactive({
  close: false,
  open: false,
})
const toggleExpand = ref(true) // toggles expand icons

// Send category data to store, set selected category
function chooseCategory(category: { name: string; id: number }) {
  store.setCurrentCategory(category)
}

// Toggle animation/display classes for category list
function dropdownToggle() {
  toggleExpand.value = !toggleExpand.value
  if (dropdownClass.open) {
    dropdownClass.open = false
    dropdownClass.close = true
  } else {
    dropdownClass.open = true
    dropdownClass.close = false
  }
}


function startGame() {
  store.startGame()
  // Close About menu if open
  if (store.aboutShow) {
    store.aboutToggle()
  }
}
</script>
<style lang="scss" scoped>
@use '../styles/variables' as *;

@media (max-width: 600px) {
    section {
        padding: 0 2.5%;
    }
}

.expand-less,
.expand-more,
h2,
li {
    cursor: pointer;
}

h3 {
    color: $color-white;
    margin: 0;
}

li {
    margin: 0.5em 0;
    transition: all 0.3s ease;
    &:hover {
        color: $color-white;
        //font-size: 1.5em;
        transform: scale(1.5);
    }
}

ul {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
}

// Selected mode button
.active {
    background-color: $color-darkest;
    border: 2px solid $color-darkest;
    color: $color-white;
}

.dropdown-label {
    align-items: center;
    display: flex;
    justify-content: center;
}

// Category dropdown expand icon
.expand-less,
.expand-more {
    font-size: 2em;
    padding-top: 7px;
    margin-left: 15px;
    transition: all 0.3s ease;
}

.expand-more {
    color: $color-white;
    &:hover {
        color: $color-darkest;
    }
}

.expand-less {
    color: $color-darkest;
    &:hover {
        color: $color-white;
    }
}

// Open dropdown
.open {
    animation: open 1s ease forwards;
}

// Close dropdown
.close {
    animation: close 1s ease forwards;
}
</style>
