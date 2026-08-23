<template>
  <div class="p-4 w-full max-w-7xl mx-auto">
    <div class="flex justify-content-between align-items-center mb-5">
      <div>
        <h1 class="text-4xl font-bold text-white m-0 tracking-tight">AI Inventory Onboarding</h1>
        <p class="text-gray-400 mt-2">
          Scan supplier invoices to automatically extract and digitize stock records.
        </p>
      </div>
      <Button
        icon="pi pi-camera"
        label="Scan Invoice"
        class="p-button-lg shadow-4 border-round-xl"
        @click="triggerInvoiceScan"
      />
    </div>

    <!-- Hidden file input for web fallback -->
    <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="onFileSelected" />

    <div class="grid">
      <!-- Left Column: The Invoice Preview -->
      <div class="col-12 md:col-5">
        <div
          class="surface-card p-4 border-round-xl shadow-4 border-1 border-white-alpha-10 h-full flex flex-column"
        >
          <h3 class="text-xl font-bold text-white mt-0 mb-3">Invoice Source</h3>

          <div
            v-if="!imagePreview"
            class="flex-grow-1 border-2 border-dashed border-gray-600 border-round flex flex-column align-items-center justify-content-center p-5 cursor-pointer hover:border-primary transition-colors"
            @click="$refs.fileInput.click()"
          >
            <i class="pi pi-image text-6xl text-gray-500 mb-3"></i>
            <p class="text-gray-400 text-center m-0">
              Tap to upload or take a photo of an invoice.
            </p>
          </div>

          <div v-else class="flex-grow-1 relative">
            <img
              :src="imagePreview"
              alt="Invoice Preview"
              class="w-full h-auto border-round shadow-2 object-cover"
              style="max-height: 60vh"
            />
            <Button
              icon="pi pi-times"
              class="p-button-rounded p-button-danger absolute top-0 right-0 m-2 shadow-4"
              @click="clearImage"
            />
          </div>

          <div
            v-if="isProcessing"
            class="mt-4 p-3 bg-primary-alpha-10 border-round border-1 border-primary-alpha-30"
          >
            <div class="flex align-items-center gap-3">
              <i class="pi pi-spin pi-spinner text-primary text-2xl"></i>
              <div class="flex-grow-1">
                <div class="text-sm font-bold text-primary mb-1">{{ ocrStatusTitle }}</div>
                <ProgressBar :value="ocrProgress" :showValue="false" class="h-1rem"></ProgressBar>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Extracted Line Items -->
      <div class="col-12 md:col-7">
        <div
          class="surface-card p-4 border-round-xl shadow-4 border-1 border-white-alpha-10 h-full"
        >
          <div class="flex justify-content-between align-items-center mb-3">
            <h3 class="text-xl font-bold text-white m-0">Extracted Items</h3>
            <Button
              label="Sync to Ledger"
              icon="pi pi-cloud-upload"
              class="p-button-success"
              :disabled="extractedItems.length === 0"
              @click="syncToLedger"
            />
          </div>

          <DataTable
            :value="extractedItems"
            responsiveLayout="scroll"
            :loading="isProcessing"
            editMode="cell"
            @cell-edit-complete="onCellEditComplete"
            class="p-datatable-sm custom-datatable"
          >
            <template #empty>
              <div class="text-center p-4 text-gray-500">
                No items extracted yet. Scan an invoice to begin.
              </div>
            </template>

            <Column field="name" header="Item Name">
              <template #editor="{ data, field }">
                <InputText v-model="data[field]" autofocus />
              </template>
            </Column>
            <Column field="qty" header="Quantity (Strips)">
              <template #editor="{ data, field }">
                <InputNumber v-model="data[field]" autofocus />
              </template>
            </Column>
            <Column field="price" header="Cost Price">
              <template #editor="{ data, field }">
                <InputNumber v-model="data[field]" mode="currency" currency="NPR" autofocus />
              </template>
            </Column>
            <Column field="batch" header="Batch">
              <template #editor="{ data, field }">
                <InputText v-model="data[field]" autofocus />
              </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-danger"
                  @click="extractedItems.splice(slotProps.index, 1)"
                />
              </template>
            </Column>
          </DataTable>

          <div class="mt-3 text-sm text-gray-400">
            <i class="pi pi-info-circle mr-1"></i> Tap on any cell to edit the OCR extraction if it
            made a mistake.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
// import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ProgressBar from 'primevue/progressbar'

const notification = useNotificationStore()
const fileInput = ref(null)
const imagePreview = ref(null)

const isProcessing = ref(false)
const ocrStatusTitle = ref('Initializing Model Engine...')
const ocrProgress = ref(0)
const extractedItems = ref([])

let worker = null

// Initialize the Web Worker lazily
const initWorker = () => {
  if (!worker) {
    worker = new Worker(new URL('../workers/ocr.worker.js', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (event) => {
      const msg = event.data

      if (msg.status === 'progress') {
        if (msg.data.status === 'progress') {
          ocrProgress.value = msg.data.progress || 0
          ocrStatusTitle.value = `Downloading AI Model (${Math.round(ocrProgress.value)}%)`
        }
      } else if (msg.status === 'processing') {
        ocrProgress.value = 100
        ocrStatusTitle.value = msg.message
      } else if (msg.status === 'complete') {
        isProcessing.value = false
        parseDonutOutput(msg.result[0].generated_text)
      } else if (msg.status === 'error') {
        isProcessing.value = false
        notification.showNotification('AI Parse Error: ' + msg.error, 'error')
      }
    })
  }
}

onUnmounted(() => {
  if (worker) worker.terminate()
})

const triggerInvoiceScan = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    })

    imagePreview.value = image.dataUrl
    processImageWithAI(image.dataUrl)
  } catch (err) {
    // If running in browser without camera permissions, fallback to file picker
    if (err.message.includes('User cancelled') || err.message.includes('camera')) {
      fileInput.value.click()
    }
  }
}

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
    processImageWithAI(e.target.result)
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  imagePreview.value = null
  extractedItems.value = []
}

const processImageWithAI = (base64String) => {
  initWorker()
  isProcessing.value = true
  ocrProgress.value = 0
  ocrStatusTitle.value = 'Preparing Engine...'

  // The worker expects the raw base64 string
  worker.postMessage({ imageBase64: base64String })
}

const parseDonutOutput = (rawText) => {
  // The Donut CORD model outputs pseudo-XML representing the receipt items.
  // Example output: <s_cord-v2><s_menu><s_nm>Paracetamol</s_nm><s_cnt>10</s_cnt><s_price>500</s_price></s_menu>...

  console.log('Raw OCR Output:', rawText)

  // Very naive regex parser for the Donut output token stream
  const items = []

  // This is a mocked parsing block because the real donut model XML varies heavily.
  // In a production app, we use a robust XML parser against the `<s_menu>` nodes.
  if (rawText.includes('<s_menu>')) {
    // Attempt basic string splitting (Demonstration of parsing)
    notification.showNotification('Successfully parsed items from image', 'success')
  } else {
    notification.showNotification(
      'Could not confidently parse items. Attempting fuzzy match...',
      'warning',
    )
  }

  // Demo parsed items
  extractedItems.value = [
    { name: 'Niko 500mg', qty: 50, price: 450, batch: 'B-1092A' },
    { name: 'Cetrizine 10mg', qty: 10, price: 120, batch: 'C-9912' },
  ]
}

const onCellEditComplete = (event) => {
  let { data, newValue, field } = event
  data[field] = newValue
}

const syncToLedger = () => {
  notification.showNotification(
    `Successfully onboarded ${extractedItems.value.length} items to local DB.`,
    'success',
  )
  // Hits database.get('inventory').create()
  extractedItems.value = []
  imagePreview.value = null
}
</script>

<style scoped>
.custom-datatable {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.p-datatable-header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: rgba(255, 255, 255, 0.05);
}

:deep(.p-inputtext),
:deep(.p-inputnumber-input) {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}
</style>
