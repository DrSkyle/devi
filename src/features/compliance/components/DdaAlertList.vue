<template>
  <div class="dda-alert-list">
    <div v-if="alerts.length === 0" class="text-center py-4 text-gray-500">
      <p>No DDA alerts at this time</p>
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="font-medium text-yellow-800">{{ alert.message }}</p>
            <p class="text-sm text-yellow-600">{{ alert.timestamp }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Mock data for now
const alerts = ref([
  { id: 1, message: 'Sample DDA alert', timestamp: '2023-01-01 10:00' },
  { id: 2, message: 'Another DDA alert', timestamp: '2023-01-02 14:30' },
])
</script>
