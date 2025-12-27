import { useNetwork } from '@vueuse/core'
import { computed } from 'vue'

export function useNetworkStatus() {
  const { isOnline, offlineAt, downlink, effectiveType } = useNetwork()

  const statusColor = computed(() => {
    if (!isOnline.value) return 'text-red-500'
    if (effectiveType.value === 'slow-2g' || effectiveType.value === '2g') return 'text-orange-500'
    return 'text-green-500'
  })

  const statusText = computed(() => {
    if (!isOnline.value) return 'Offline'
    return 'Online'
  })

  return {
    isOnline,
    offlineAt,
    downlink,
    effectiveType,
    statusColor,
    statusText,
  }
}
