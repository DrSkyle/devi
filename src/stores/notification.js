// src/stores/notification.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const message = ref('')
  const type = ref('') // 'success' or 'error'
  const isVisible = ref(false)
  let timeoutId = null

  function showNotification(newMessage, newType = 'success') {
    // If a notification is already showing, clear it first
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    message.value = newMessage
    type.value = newType
    isVisible.value = true

    // Automatically hide after 4 seconds
    timeoutId = setTimeout(() => {
      isVisible.value = false
    }, 4000)
  }

  return { message, type, isVisible, showNotification }
})