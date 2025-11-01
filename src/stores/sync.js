// src/stores/sync.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSyncStore = defineStore('sync', () => {
  // States can be: 'synced', 'syncing', 'offline'
  const status = ref('synced')
  const isOnline = ref(navigator.onLine)

  function setStatus(newStatus) {
    // If we are offline, the status must remain 'offline'
    if (isOnline.value) {
      status.value = newStatus
    }
  }

  function setIsOnline(online) {
    isOnline.value = online
    status.value = online ? 'synced' : 'offline'
  }

  return { status, isOnline, setStatus, setIsOnline }
})
