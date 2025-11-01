<template>
  <button @click="exportData" class="button-secondary" :disabled="isExporting">
    {{ isExporting ? 'Exporting...' : buttonText }}
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notification.js'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  fileName: {
    type: String,
    default: 'export.csv', // Default to .csv
  },
  buttonText: {
    type: String,
    default: 'Export to CSV',
  },
})

const isExporting = ref(false)
const notification = useNotificationStore()

// Helper function to convert the array of objects to a CSV string
const convertToCSV = (data) => {
  if (!data || data.length === 0) {
    return ''
  }
  const headers = Object.keys(data[0])
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        let value = obj[header]
        // Handle null/undefined values
        if (value == null) {
          return ''
        }
        let strValue = String(value)
        // Escape quotes by doubling them and wrap the whole value in quotes if it contains commas, quotes, or newlines
        if (strValue.includes('"') || strValue.includes(',') || strValue.includes('\n')) {
          strValue = `"${strValue.replace(/"/g, '""')}"`
        }
        return strValue
      })
      .join(','),
  )
  return [headers.join(','), ...rows].join('\r\n')
}

const exportData = () => {
  if (props.data.length === 0) {
    notification.showNotification('There is no data to export.', 'error')
    return
  }

  isExporting.value = true
  try {
    const csvContent = convertToCSV(props.data)

    // Create a Blob (Binary Large Object) from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create a temporary link element to trigger the download
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', props.fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    notification.showNotification('Data exported successfully!')
  } catch (error) {
    console.error('Export failed:', error)
    notification.showNotification('An error occurred during the export.', 'error')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
/* Scoped styles if needed, for now re-using global button styles */
</style>
