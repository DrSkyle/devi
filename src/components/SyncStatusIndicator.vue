<template>
  <div
    v-if="showIndicator"
    class="sync-status-indicator shadow-2 cursor-pointer hover:surface-200"
    :class="sync.status"
    @click="handleForceSync"
    v-tooltip.bottom="'Click to force sync'"
  >
    <i class="pi" :class="iconClass"></i>
    <span class="text ml-2 font-medium">{{ statusText }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSyncStore } from '@/stores/sync'
import { sync as syncDatabase } from '@/database/sync'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const sync = useSyncStore()
const showIndicator = ref(true)

const { isOnline } = useNetworkStatus()

const statusText = computed(() => {
  if (!isOnline.value) return 'Offline (Local Only)'
  if (sync.status === 'synced') return 'Mesh Active'
  if (sync.status === 'syncing') return 'Broadcasting...'
  return 'Local Mode'
})

const iconClass = computed(() => {
  if (!isOnline.value) return 'pi-wifi-off text-600'
  if (sync.status === 'synced') return 'pi-sitemap text-primary' // Use sitemap icon for Mesh
  if (sync.status === 'syncing') return 'pi-spin pi-sync text-primary'
  return 'pi-circle text-600'
})

const handleForceSync = async () => {
  if (sync.status === 'syncing') return
  await syncDatabase()
}

watch(
  () => sync.status,
  () => {
    // Always show indicator
    showIndicator.value = true
  },
  { immediate: true },
)
</script>

<style scoped>
.sync-status-indicator {
  display: flex;
  align-items: center;
  background-color: var(--surface-card);
  padding: 0.5rem 1rem;
  border-radius: 99px;
  border: 1px solid var(--surface-border);
  font-size: 0.8rem;
  transition: all 0.3s ease;
  user-select: none;
}
</style>
