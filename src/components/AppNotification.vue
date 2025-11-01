<template>
  <Transition name="slide-fade">
    <div
      v-if="notification.isVisible"
      class="notification-bar"
      :class="`is-${notification.type}`"
    >
      <p>{{ notification.message }}</p>
    </div>
  </Transition>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification.js'

const notification = useNotificationStore()
</script>

<style scoped>
.notification-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 12px;
  color: var(--color-soft-cream);
  font-weight: 600;
  z-index: 200;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.is-success {
  background-color: var(--color-peacock-teal);
}

.is-error {
  background-color: var(--color-danger);
}

/* --- Animation --- */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}
</style>