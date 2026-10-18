<template>
  <div>
    <p>{{ t('instructions.body') }}</p>
  </div>
</template>

<script setup lang="ts">
import { t } from '../locales'
</script>

<style lang="scss" scoped>
div {
  margin: 0 0 1em 0;
}

p {
  font-size: 1.25em;
}

@media (max-width: 600px) {
  div {
    padding: 0 1em;
  }

  p {
    font-size: 1.1em;
  }
}
</style>
