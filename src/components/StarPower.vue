<template>
  <div>
  <template v-if="store.starPower">
    <i
    v-for="star in quantity"
    :key="star"
    class="material-icons star">star</i>
  </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../store/store'

const store = useGameStore()
const quantity = ref(10)
</script>
<style lang="scss">
@use 'sass:math';
@use '../styles/variables' as *;

// Star mixin for children
// Pass in upper limit for random size (based on em)
// Pass in timing for animation
@mixin star($fontSize, $timing) {
    animation: shoot $timing ease-in-out forwards;
    font-size: math.random($fontSize) + em;
    position: absolute;
    top: math.random(10) + vh;
    right: math.random(10) + vw;
    bottom: math.random(10) + vh;
    left: math.random(10) + vw;
}

// Star element
.star {
    color: #FDD835;
    position: absolute;
    &:nth-child(1) {
        @include star(8, 1.1s);
    }
    &:nth-child(2) {
        @include star(7, 1.3s);
    }
    &:nth-child(3) {
        @include star(6, 1.2s);
    }
    &:nth-child(4) {
        @include star(7, 1.1s);
    }
    &:nth-child(5) {
        @include star(7, 1s);
    }
    &:nth-child(6) {
        @include star(5, 1.1s);
    }
    &:nth-child(7) {
        @include star(8, 1.2s);
    }
    &:nth-child(8) {
        @include star(7, 1.3s);
    }
    &:nth-child(9) {
        @include star(7, 1.4s);
    }
    &:nth-child(10) {
        @include star(6, 1.5s);
    }
}
@keyframes shoot {
    0% {
        transform: rotate(0) translate3d(-90vw, 100vh, 0);
    }
    25% {
        transform: rotate(90deg) translate3d(10vw, 70vh, 0);
    }
    40% {
        transform: rotate(0deg) translate3d(10vw, 70vh, 0);
    }
    100% {
        transform: rotate(-10deg) translate3d(120vw, 0, 0);
    }
}
</style>
