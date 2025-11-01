// src/i18n.js
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ne from './locales/ne.json'

const i18n = createI18n({
  legacy: false, // Use Vue 3 Composition API
  locale: localStorage.getItem('locale') || 'en', // Default locale
  fallbackLocale: 'en',
  messages: {
    en,
    ne,
  },
})

export default i18n
