// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { plugin as formKitPlugin, defaultConfig as formKitDefaultConfig } from '@formkit/vue'
import formkitConfig from '../formkit.config.js'
import i18n from './i18n' // <-- ADD THIS IMPORT

// --- THIS IS THE FIX ---
// Import the Genesis theme's CSS directly into the main application file.
import '@formkit/themes/genesis'

// Your other imports
import VueApexCharts from 'vue3-apexcharts'
import './assets/main.css'
import './supabase.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(formKitPlugin, formKitDefaultConfig(formkitConfig))
app.use(VueApexCharts)
app.use(i18n) // <-- ADD THIS LINE

app.mount('#app')
