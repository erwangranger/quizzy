<template>
  <div>
    <h2>{{ t('about.heading') }}</h2>
    <p><em>{{ t('about.partOfSpeech') }}</em><br>
{{ t('about.definition') }}</p>
    <br>
    <p>{{ t('about.love') }}</p>
  </div>
</template>

<script setup lang="ts">
import { t } from '../locales'
</script>
<style lang="scss" scoped>
@use '../styles/variables' as *;

div {
  background-color: $color-darkest;
  margin-bottom: 2em;
  //padding-bottom: 2em;
  width: 100%;
  //height: 200px;
}

h2 {
  font-weight: bold;
}

p:last-child {
  margin-bottom: 2em;
}
</style>
