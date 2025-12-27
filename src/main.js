// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { plugin as formKitPlugin, defaultConfig as formKitDefaultConfig } from '@formkit/vue'
import formkitConfig from '../formkit.config.js'
import { VueQueryPlugin } from '@tanstack/vue-query'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
import i18n from './i18n' // <-- ADD THIS IMPORT
import '@/database' // Initialize Database early

// --- THIS IS THE FIX ---
// Import the Genesis theme's CSS directly into the main application file.
import '@formkit/themes/genesis'

// Your other imports
import VueApexCharts from 'vue3-apexcharts'
// import './assets/main.css' // Removed


import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
// import './assets/style.css'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import Tooltip from 'primevue/tooltip'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(formKitPlugin, formKitDefaultConfig(formkitConfig))
app.use(VueApexCharts)
app.use(VueQueryPlugin)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.my-app-dark',
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)
app.directive('tooltip', Tooltip)

app.mount('#app')
