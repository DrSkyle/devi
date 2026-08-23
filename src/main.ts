// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin as formKitPlugin, defaultConfig as formKitDefaultConfig } from '@formkit/vue'
// @ts-ignore
import formkitConfig from '../formkit.config.js'
import { VueQueryPlugin } from '@tanstack/vue-query'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
// @ts-ignore
import i18n from './i18n'

// Import the Genesis theme's CSS directly into the main application file.
import '@formkit/themes/genesis'

import VueApexCharts from 'vue3-apexcharts'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import Tooltip from 'primevue/tooltip'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const app = createApp(App)

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
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)

app.mount('#app')
