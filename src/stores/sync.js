// src/stores/sync.js
import { defineStore as create } from '@/core/zustand'

export const useSyncStore = create((set, get) => ({
  // States can be: 'synced', 'syncing', 'offline'
  status: navigator.onLine ? 'synced' : 'offline',
  isOnline: navigator.onLine,

  setStatus: (newStatus) => {
    const state = get()
    // If we are offline, the status must remain 'offline'
    if (state.isOnline) {
      set({ status: newStatus })
    }
  },

  setIsOnline: (online) => {
    set({
      isOnline: online,
      status: online ? 'synced' : 'offline',
    })
  },
}))
