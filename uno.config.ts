import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  shortcuts: {
    glass: 'bg-white/10 backdrop-blur-md border border-white/20',
    'btn-primary':
      'bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded transition-colors',
    'btn-danger': 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors',
  },
})
