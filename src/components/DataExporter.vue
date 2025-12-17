<template>
  <Button
    :label="isExporting ? 'Exporting...' : buttonText"
    icon="pi pi-download"
    :loading="isExporting"
    @click="exportData"
    severity="secondary"
    outlined
  />
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  fileName: {
    type: String,
    default: 'export.csv',
  },
  buttonText: {
    type: String,
    default: 'Export to CSV',
  },
})

const isExporting = ref(false)
const toast = useToast()

const convertToCSV = (data) => {
  if (!data || data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        let value = obj[header]
        if (value == null) return ''
        let strValue = String(value)
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
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'There is no data to export.',
      life: 3000,
    })
    return
  }

  isExporting.value = true
  try {
    const csvContent = convertToCSV(props.data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', props.fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Data exported successfully!',
      life: 3000,
    })
  } catch (error) {
    console.error('Export failed:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred during the export.',
      life: 3000,
    })
  } finally {
    isExporting.value = false
  }
}
</script>
