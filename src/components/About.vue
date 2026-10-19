<template>
  <div class="about-panel">
    <p class="version">v{{ version }}</p>
    <ul class="links">
      <li>
        <a
          href="https://github.com/erwangranger/quizzy"
          target="_blank"
          rel="noopener noreferrer"
          class="link-light"
        >{{ t('about.source') }}</a>
      </li>
      <li>
        <a
          href="https://github.com/erwangranger/quizzy/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          class="link-light"
        >{{ t('about.issues') }}</a>
      </li>
    </ul>
    <p class="credit">
      {{ t('about.creditLead') }}
      <a
        href="https://github.com/Splode/open-trivia-app"
        target="_blank"
        rel="noopener noreferrer"
        class="link-light"
      >{{ t('about.creditName') }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
declare const __APP_VERSION__: string

import { t } from '../locales'

const version = __APP_VERSION__
</script>
<style lang="scss" scoped>
@use '../styles/variables' as *;

.about-panel {
  background-color: $color-darkest;
  margin-bottom: 2em;
  width: 100%;
}

.version {
  color: $color-med;
  font-size: 0.85em;
  margin-bottom: 1.5em;
}

.links {
  margin-bottom: 1.5em;

  li {
    margin: 0.4em 0;
  }
}

.credit {
  color: $color-med;
  font-size: 0.85em;
  margin-bottom: 2em;
}
</style>
