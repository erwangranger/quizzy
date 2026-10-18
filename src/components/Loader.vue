<template>
  <div class="wrapper flex-center-col">
    <div class="droplet-container">
      <i class="droplet" v-for="drop in quantity" :key="drop"></i>
    </div>
    <div class="message">
      <transition name="fade">
        <h2 v-if="show">{{ message[counter] }}</h2>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { t } from '../locales'

const quantity = 10
const message = [t('loader.doinTheWorm'), t('loader.fetching'), t('loader.massaging')]
const counter = ref(-1)
const show = ref(false)

const timers: ReturnType<typeof setTimeout>[] = []

function loopMessage() {
  timers.push(setTimeout(() => {
    if (counter.value >= message.length - 1) {
      counter.value = -1
    }
    counter.value += 1
  }, 500))
  timers.push(setTimeout(() => {
    show.value = true
  }, 1500))
  timers.push(setTimeout(() => {
    show.value = false
  }, 5000))
}

// TODO: refactor initial timing
loopMessage()
// TODO: refactor loops
const interval = setInterval(() => {
  loopMessage()
}, 5000)

onUnmounted(() => {
  clearInterval(interval)
  timers.forEach(clearTimeout)
})
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@mixin drop($delay) {
  animation: drop-in 1s ease infinite;
  animation-delay: $delay;
}

.message {
  height: 3em;
}

.droplet-container {
  display: flex;
  flex-direction: row;
  margin-bottom: 6em;
}

.droplet {
  background-color: whitesmoke;
  border-radius: 100%;
  margin: 0 5px;
  width: 10px;
  height: 10px;
  &:nth-child(1) {
    @include drop(.1s);
  }
  &:nth-child(2) {
    @include drop(.2s);
  }
  &:nth-child(3) {
    @include drop(.3s);
  }
  &:nth-child(4) {
    @include drop(.4s);
  }
  &:nth-child(5) {
    @include drop(.5s);
  }
  &:nth-child(6) {
    @include drop(.6s);
  }
  &:nth-child(7) {
    @include drop(.7s);
  }
  &:nth-child(8) {
    @include drop(.8s);
  }
  &:nth-child(9) {
    @include drop(.9s);
  }
  &:nth-child(10) {
    @include drop(1s);
  }
}

.wrapper {
  height: 80vh; // NOTE: iOS browsers require explicit height
}
@keyframes drop-in {
  0% {
    transform: translatey(0);
  }
  33% {
    transform: translatey(30px);
  }
  66% {
    opacity: 1;
    transform: translatey(30px);
  }
  100% {
    transform: translatey(0);
  }
}
</style>
