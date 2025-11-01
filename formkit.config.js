// formkit.config.js
import { defaultConfig } from '@formkit/vue'
import { genesisIcons } from '@formkit/icons'

// This configuration only adds the free icon pack.
// The theme's CSS will be imported directly in main.js.
export default defaultConfig({
  icons: {
    ...genesisIcons,
  },
})
