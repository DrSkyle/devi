<template>
  <div class="glass-panel p-4 flex flex-column gap-3">
    <div class="flex justify-content-between align-items-center">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-clock text-xl text-primary-400"></i>
        <span class="font-bold text-white">Shift Management</span>
      </div>
      <Tag
        :value="activeShift ? 'On Duty' : 'Off Duty'"
        :severity="activeShift ? 'success' : 'danger'"
      />
    </div>

    <div v-if="activeShift" class="text-center py-2">
      <div class="text-4xl font-mono text-white mb-1">{{ shiftDuration }}</div>
      <div class="text-xs text-gray-400">Started at {{ formatTime(activeShift.startTime) }}</div>
    </div>

    <div v-else class="text-center py-4 text-gray-400 text-sm italic">
      You are currently off duty.
    </div>

    <div class="flex flex-column gap-2">
      <Button
        v-if="!activeShift"
        label="Start Shift"
        icon="pi pi-play"
        class="w-full p-button-success"
        :loading="isLoading"
        @click="startShift"
      />
      <Button
        v-else
        label="End Shift"
        icon="pi pi-stop"
        class="w-full p-button-danger"
        :loading="isLoading"
        @click="endShift"
      />
    </div>

    <div v-if="locationError" class="text-red-400 text-xs text-center mt-2">
      <i class="pi pi-exclamation-triangle mr-1"></i>
      {{ locationError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useStaffStore } from '@/features/staff/store'
import { useProfileStore } from '@/features/profile/store'
import { GeofenceService } from '@/services/GeofenceService'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import { formatTime, getDuration } from '@/utils/dateUtils'

const staffStore = useStaffStore()
const profileStore = useProfileStore()
const activeShift = ref<any>(null)
const isLoading = ref(false)
const locationError = ref('')
const timer = ref<any>(null)
const now = ref(Date.now())

const shiftDuration = computed(() => {
  if (!activeShift.value) return '00:00:00'
  const d = getDuration(activeShift.value.startTime, now.value)
  const hours = Math.floor(d.asHours()).toString().padStart(2, '0')
  const minutes = d.minutes().toString().padStart(2, '0')
  const seconds = d.seconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
})

const fetchActiveShift = async () => {
  if (!staffStore.activeUserId) return

  const shifts = await database
    .get('shifts')
    .query(Q.where('staff_id', staffStore.activeUserId), Q.where('status', 'active'))
    .fetch()

  if (shifts.length > 0) {
    activeShift.value = shifts[0]
  } else {
    activeShift.value = null
  }
}

const startShift = async () => {
  isLoading.value = true
  locationError.value = ''

  try {
    // 1. Get Location
    const location = await GeofenceService.getCurrentLocation()

    // 2. Check Geofence (if pharmacy has coords)
    if (profileStore.latitude && profileStore.longitude) {
      const isWithin = GeofenceService.isWithinRange(location, {
        latitude: profileStore.latitude,
        longitude: profileStore.longitude,
      })

      if (!isWithin) {
        throw new Error('You are too far from the pharmacy to start a shift.')
      }
    }

    // 3. Create Shift
    await database.write(async () => {
      await database.get('shifts').create((shift: any) => {
        shift.pharmacyId = profileStore.pharmacyId
        shift.staffId = staffStore.activeUserId
        shift.startTime = Date.now()
        shift.status = 'active'
        shift.openingFloat = 0 // TODO: Prompt for float
        shift.startLat = location.latitude
        shift.startLong = location.longitude
      })
    })

    await fetchActiveShift()
  } catch (e: any) {
    console.error(e)
    locationError.value = e.message || 'Failed to start shift'
  } finally {
    isLoading.value = false
  }
}

const endShift = async () => {
  if (!activeShift.value) return
  isLoading.value = true

  try {
    const location = await GeofenceService.getCurrentLocation()

    await database.write(async () => {
      await activeShift.value.update((shift: any) => {
        shift.endTime = Date.now()
        shift.status = 'completed'
        shift.endLat = location.latitude
        shift.endLong = location.longitude
      })
    })

    activeShift.value = null
  } catch (e: any) {
    console.error(e)
    locationError.value = 'Failed to end shift. Location required.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchActiveShift()
  timer.value = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer.value)
})
</script>
