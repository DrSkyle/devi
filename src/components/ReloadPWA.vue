<template>
  <div v-if="needRefresh" class="pwa-toast" role="alert">
    <div class="message">A new version is available, please reload.</div>
    <button @click="updateServiceWorker()">Reload</button>
  </div>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 8px;
  z-index: 2000;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: var(--color-surface);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pwa-toast .message {
  margin-bottom: 0;
  color: var(--color-text);
}

.pwa-toast button {
  width: auto;
  border: 1px solid var(--color-primary);
  outline: none;
  margin-right: 5px;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--color-midnight-blue);
  background-color: var(--color-primary);
}
</style>
