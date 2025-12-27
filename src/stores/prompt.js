// src/stores/prompt.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePromptStore = defineStore('prompt', () => {
  const isVisible = ref(false)
  const title = ref('')
  const message = ref('')
  const inputType = ref(null) // 🧠 null = no input
  const inputValue = ref('')
  const mode = ref('prompt') // 👈 'prompt' or 'confirm'

  let resolvePromise = null
  let rejectPromise = null

  function show(options) {
    isVisible.value = true
    title.value = options.title || 'Input Required'
    message.value = options.message || ''
    mode.value = options.type || 'prompt' // 👈 detect type

    // only set input fields if prompt mode
    if (mode.value === 'prompt') {
      inputType.value = options.inputType || 'text'
      inputValue.value = options.initialValue || ''
    } else {
      inputType.value = null
      inputValue.value = ''
    }

    return new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })
  }

  function confirm() {
    if (resolvePromise) {
      // only return input value if there is an input
      if (mode.value === 'prompt') resolvePromise(inputValue.value)
      else resolvePromise(true)
    }
    reset()
  }

  function cancel() {
    if (rejectPromise) {
      rejectPromise('cancelled')
    }
    reset()
  }

  function reset() {
    isVisible.value = false
    title.value = ''
    message.value = ''
    inputType.value = null
    inputValue.value = ''
    mode.value = 'prompt'
    resolvePromise = null
    rejectPromise = null
  }

  return { isVisible, title, message, inputType, inputValue, show, confirm, cancel, mode }
})
