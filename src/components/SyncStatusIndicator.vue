<template>
  <div v-if="showIndicator" class="sync-status-indicator" :class="sync.status">
    <span class="icon" :class="{ spinning: sync.status === 'syncing' }">
      <svg
        v-if="sync.status === 'synced'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"
        />
        <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </svg>
      <svg
        v-if="sync.status === 'syncing'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
      </svg>
      <svg
        v-if="sync.status === 'offline'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          d="M10.707 1.293a1 1 0 0 1 0 1.414L6.414 7H15a1 1 0 1 1 0 2H6.414l4.293 4.293a1 1 0 1 1-1.414 1.414l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 0z"
        />
      </svg>
    </span>
    <span class="text">{{ statusText }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSyncStore } from '@/stores/sync'

const sync = useSyncStore()
const showIndicator = ref(true)
let hideTimeout = null

const statusText = computed(() => {
  if (sync.status === 'synced') return 'All changes saved'
  if (sync.status === 'syncing') return 'Syncing...'
  if (sync.status === 'offline') return 'Offline Mode'
  return '...'
})

// This is the key change. The indicator is now always shown unless the status is 'synced'.
watch(
  () => sync.status,
  (newStatus) => {
    clearTimeout(hideTimeout)
    if (newStatus === 'synced') {
      // When synced, show the message for a moment, then hide it.
      showIndicator.value = true
      hideTimeout = setTimeout(() => {
        showIndicator.value = false
      }, 2500)
    } else {
      // For 'syncing' or 'offline', make sure the indicator is always visible.
      showIndicator.value = true
    }
  },
  { immediate: true },
) // 'immediate' ensures this runs on component load
</script>

<style scoped>
/* Styles remain the same, but here they are for completeness */
.sync-status-indicator {
  position: fixed;
  bottom: 85px;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-surface);
  padding: 0.5rem 1rem;
  border-radius: 99px;
  border: 1px solid var(--color-border);
  font-size: 0.8rem;
  font-weight: 500;
  z-index: 1000;
  transition: all 0.3s ease;
  opacity: 1;
}
.icon {
  display: flex;
  align-items: center;
}
.icon.spinning {
  animation: spin 1.5s linear infinite;
}
.synced {
  color: var(--color-peacock-teal);
  border-color: var(--color-peacock-teal);
}
.syncing {
  color: var(--color-saffron-orange);
  border-color: var(--color-saffron-orange);
}
.offline {
  color: var(--color-text-light);
  border-color: var(--color-slate-gray);
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@media (min-width: 1024px) {
  .sync-status-indicator {
    bottom: 1.5rem;
  }
}
</style>
