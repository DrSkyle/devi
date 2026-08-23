// src/stores/notification.js
import { defineStore as create } from '@/core/zustand'

export const useNotificationStore = create((set, get) => ({
  message: '',
  type: '', // 'success' or 'error'
  isVisible: false,
  timeoutId: null,
  unreadCount: 0,

  showNotification: (newMessage, newType = 'success') => {
    const state = get()
    // If a notification is already showing, clear it first
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
    }

    set({
      message: newMessage,
      type: newType,
      isVisible: true,
    })

    // Automatically hide after 4 seconds
    const newTimeoutId = setTimeout(() => {
      set({ isVisible: false })
    }, 4000)

    set({ timeoutId: newTimeoutId })
  },

  checkUnreadMessages: async (pharmacyId) => {
    if (!pharmacyId) return

    // Local-First: We don't check cloud notifications for now.
    // Future: Check 'notifications' collection in WatermelonDB.
    set({ unreadCount: 0 })
  },

  markAsRead: () => {
    set({ unreadCount: 0 })
    localStorage.setItem('lastNotificationReadTime', new Date().toISOString())
  },
}))
