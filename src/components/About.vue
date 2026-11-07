<template>
  <div class="about-panel">
    <p class="version">v{{ version }} · {{ t('about.contentUpdated', { date: contentDate }) }}</p>
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
      <li>
        <button type="button" class="link-light reset-seen" @click="resetSeen">{{ t('about.resetSeen') }}</button>
      </li>
    </ul>
    <div class="quizzes" v-if="customQuizzes.length > 0">
      <p class="quizzes-lead">{{ t('about.customQuizzes') }}</p>
      <ul class="quizzes-list">
        <li v-for="quiz in customQuizzes" :key="quiz.file">
          <a :href="quizHref(quiz.file)" class="link-light">{{ quiz.name }}</a>
        </li>
      </ul>
    </div>
    <div class="install">
      <p class="install-lead">{{ t('about.installLead') }}</p>
      <ul class="install-steps">
        <li>{{ t('about.installChrome') }}</li>
        <li>{{ t('about.installSafari') }}</li>
        <li>{{ t('about.installFirefox') }}</li>
      </ul>
      <p class="install-after">{{ t('about.installAfter') }}</p>
    </div>
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
declare const __CONTENT_DATE__: string

import { t } from '../locales'
import { useGameStore } from '../store/store'

const store = useGameStore()
const version = __APP_VERSION__
const contentDate = __CONTENT_DATE__

// Clear the recency pool so every question counts as unseen again. The
// current game keeps its drawn questions; the next draw starts fresh.
function resetSeen() {
  store.clearSeenQuestions()
}

// Pre-loaded custom quizzes: bank files under public/, served at the app
// root. A quiz is one entry here + the .json file; the link re-enters the
// app with a relative ?bank= parameter (works on Pages subpath, in dev and
// inside a Capacitor WebView alike).
const customQuizzes = [
  { name: 'Canada sample', file: 'sample-bank.json' },
  { name: 'Quick demo', file: 'demo-bank.json' },
  { name: 'Logic and reasoning (en)', file: 'logic-bank_en.json' },
  { name: 'Logique et raisonnement (fr)', file: 'logic-bank_fr.json' },
]

function quizHref(file: string): string {
  return new URL(`?bank=${file}`, window.location.href).href
}
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

// The reset-seen action is a button styled like the sibling links
.reset-seen {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover {
    color: $color-med;
  }
}

// Pre-loaded custom quizzes: same rhythm as the install block
.quizzes {
  margin-bottom: 1.5em;

  .quizzes-lead {
    color: $color-med;
    font-size: 0.85em;
    margin-bottom: 0.75em;
  }

  .quizzes-list li {
    margin: 0.4em 0;
  }
}

.install {
  margin-bottom: 1.5em;

  p {
    color: $color-med;
    font-size: 0.85em;
  }

  .install-lead {
    margin-bottom: 0.75em;
  }

  .install-steps {
    margin-bottom: 0.75em;

    li {
      margin: 0.4em 0;
    }
  }
}

.credit {
  color: $color-med;
  font-size: 0.85em;
  margin-bottom: 2em;
}
</style>
