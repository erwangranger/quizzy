<template>
  <transition name="update-fade">
    <div v-if="visible" class="update-prompt" role="status">
      <span class="update-prompt-text">{{ t('update.prompt') }}</span>
      <button type="button" class="update-prompt-refresh" @click="refresh">
        {{ t('update.refresh') }}
      </button>
      <button
        type="button"
        class="update-prompt-close"
        @click="$emit('dismiss')"
      >
        ✕
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { t } from '../locales'

defineEmits<{ (e: 'dismiss'): void }>()

const visible = ref(true)

// Fade-out on refresh: hide first, then reload once the leave transition ends.
function refresh() {
  visible.value = false
  window.setTimeout(() => window.location.reload(), 200)
}
</script>

<style lang="scss" scoped>
.update-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.75em 1em;
  background: #1e1e1e;
  color: #fff;
  font-size: 0.9rem;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.25);
}

.update-prompt-text {
  flex: 1;
  min-width: 0;
}

.update-prompt-refresh {
  flex-shrink: 0;
  padding: 0.4em 0.9em;
  border: 1px solid #fff;
  border-radius: 4px;
  background: transparent;
  color: #fff;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.update-prompt-close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 1em;
  cursor: pointer;
  padding: 0.25em;

  &:hover {
    opacity: 0.7;
  }
}

.update-fade-enter-active,
.update-fade-leave-active {
  transition: opacity 0.2s ease;
}

.update-fade-enter-from,
.update-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .update-prompt {
    font-size: 0.8rem;
    gap: 0.5em;
    padding: 0.6em 0.75em;
  }
}
</style>
