<template>
  <div
    class="credit-note-container p-4 max-w-30rem mx-auto min-h-screen flex flex-column justify-content-center"
  >
    <div v-if="returnData && profile" class="glass-panel p-0 overflow-hidden relative">
      <!-- Print-only white background -->
      <div
        class="print-bg bg-white hidden print:block absolute top-0 left-0 w-full h-full z-0"
      ></div>

      <div class="p-4 relative z-1">
        <header
          class="text-center border-bottom-1 border-dashed border-white-alpha-20 pb-3 mb-3 print:border-black"
        >
          <h1 class="text-xl font-bold text-white mb-2 tracking-widest print:text-black">
            CREDIT NOTE
          </h1>
          <h2 class="text-lg font-bold text-primary mb-1 print:text-black">{{ profile.name }}</h2>
          <p v-if="profile.city" class="text-sm text-gray-400 m-0 print:text-black">
            {{ profile.tole ? profile.tole + ',' : '' }} {{ profile.city }}
          </p>
          <p v-if="profile.pan_number" class="text-sm text-gray-400 m-0 print:text-black">
            PAN: {{ profile.pan_number }}
          </p>
        </header>

        <div class="flex justify-content-between text-sm mb-3 text-gray-300 print:text-black">
          <div>
            <div class="font-bold">Credit Note No:</div>
            <div class="text-xs">{{ returnData.id }}</div>
          </div>
          <div class="text-right">
            <div class="font-bold">Date:</div>
            <div>{{ new Date(returnData.created_at).toLocaleString() }}</div>
          </div>
        </div>

        <div class="text-sm mb-3 text-gray-300 print:text-black">
          <span class="font-bold">Ref. Bill No:</span> {{ returnData.bill_number }}
        </div>

        <table class="w-full text-sm mb-3 border-collapse">
          <thead>
            <tr class="border-bottom-1 border-white-alpha-20 print:border-black">
              <th class="text-left py-2 text-gray-400 print:text-black">Item</th>
              <th class="text-right py-2 text-gray-400 print:text-black">Qty</th>
              <th class="text-right py-2 text-gray-400 print:text-black">Rate</th>
              <th class="text-right py-2 text-gray-400 print:text-black">Amt</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in returnData.items"
              :key="index"
              class="text-gray-200 print:text-black"
            >
              <td class="py-2">{{ decryptData(item.name) }}</td>
              <td class="text-right py-2">{{ item.quantity }}</td>
              <td class="text-right py-2">{{ item.price.toFixed(2) }}</td>
              <td class="text-right py-2">{{ (item.quantity * item.price).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="border-top-1 border-dashed border-white-alpha-20 pt-3 mt-3 print:border-black">
          <div class="flex justify-content-between align-items-center">
            <span class="font-bold text-white print:text-black">Total Return Value</span>
            <span class="text-xl font-bold text-primary print:text-black"
              >Rs. {{ returnData.total_return_value.toFixed(2) }}</span
            >
          </div>
        </div>

        <footer class="text-center mt-4 text-xs text-gray-500 print:text-black">
          <p>Goods returned have been processed.</p>
        </footer>
      </div>
    </div>

    <div v-else class="flex align-items-center justify-content-center h-20rem">
      <ProgressSpinner />
    </div>

    <!-- Actions -->
    <div v-if="returnData" class="flex gap-3 mt-4 print:hidden">
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        class="p-button-outlined flex-1"
        @click="router.push('/process-return')"
      />
      <Button label="Print" icon="pi pi-print" class="flex-1" @click="printReceipt" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfileStore } from '@/features/profile/store'
import { decryptData } from '@/utils/cipher'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const profile = useProfileStore()
const returnId = route.params.id // UUID is a string

const returnData = ref(null)

onMounted(async () => {
  const { data, error } = await supabase.from('returns').select('*').eq('id', returnId).single()
  if (error) {
    console.error('CreditNoteView Error:', error)
    return
  }
  returnData.value = data
})

const printReceipt = () => window.print()
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .credit-note-container,
  .credit-note-container * {
    visibility: visible;
  }
  .credit-note-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    background: white;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start; /* Start from top */
  }
  .glass-panel {
    background: white !important;
    border: none !important;
    box-shadow: none !important;
    color: black !important;
    width: 100%;
    max-width: 100%;
  }
  .print\:hidden {
    display: none !important;
  }
  .print\:block {
    display: block !important;
  }
  .print\:text-black {
    color: black !important;
  }
  .print\:border-black {
    border-color: black !important;
  }
}
</style>
