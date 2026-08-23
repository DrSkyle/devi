// src/stores/prompt.js
import { defineStore as create } from '@/core/zustand'

export const usePromptStore = create((set, get) => ({
  isVisible: false,
  title: '',
  message: '',
  inputType: null, // 🧠 null = no input
  inputValue: '',
  mode: 'prompt', // 👈 'prompt' or 'confirm'
  resolvePromise: null,
  rejectPromise: null,

  show: (options) => {
    set({
      isVisible: true,
      title: options.title || 'Input Required',
      message: options.message || '',
      mode: options.type || 'prompt', // 👈 detect type
      // only set input fields if prompt mode
      inputType: options.type === 'prompt' ? options.inputType || 'text' : null,
      inputValue: options.type === 'prompt' ? options.initialValue || '' : '',
    })

    return new Promise((resolve, reject) => {
      // Store the resolve and reject functions in the state
      set({ resolvePromise: resolve, rejectPromise: reject })
    })
  },

  confirm: () => {
    const state = get()
    if (state.resolvePromise) {
      // only return input value if there is an input
      if (state.mode === 'prompt') state.resolvePromise(state.inputValue)
      else state.resolvePromise(true)
    }
    set({
      isVisible: false,
      title: '',
      message: '',
      inputType: null,
      inputValue: '',
      mode: 'prompt',
      resolvePromise: null,
      rejectPromise: null,
    })
  },

  cancel: () => {
    const state = get()
    if (state.rejectPromise) {
      state.rejectPromise('cancelled')
    }
    set({
      isVisible: false,
      title: '',
      message: '',
      inputType: null,
      inputValue: '',
      mode: 'prompt',
      resolvePromise: null,
      rejectPromise: null,
    })
  },
}))
