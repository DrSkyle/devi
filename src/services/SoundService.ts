import { useSound } from '@vueuse/sound'
import { ref } from 'vue'

// Short beep for scan/add
const beepBase64 = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'

// Success chime
const successBase64 = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'

// Error buzz
const errorBase64 = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'

// Click/Tap
const clickBase64 = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'

export function useAppSounds() {
  const { play: playBeep } = useSound(beepBase64, { volume: 0.5 })
  const { play: playSuccess } = useSound(successBase64, { volume: 0.5 })
  const { play: playError } = useSound(errorBase64, { volume: 0.5 })
  const { play: playClick } = useSound(clickBase64, { volume: 0.3 })

  return {
    playBeep,
    playSuccess,
    playError,
    playClick,
  }
}
