<template>
  <div
    class="receipt-view-container p-4 max-w-4xl mx-auto min-h-screen flex flex-column align-items-center justify-content-center"
  >
    <div v-if="sale && profile" class="w-full">
      <!-- Actions Bar -->
      <div
        class="flex justify-content-between align-items-center mb-4 no-print w-full max-w-30rem mx-auto"
      >
        <Button
          label="Sales History"
          icon="pi pi-arrow-left"
          class="p-button-text text-gray-400 hover:text-white"
          @click="router.push('/sales-history')"
        />
        <Button
          label="New Sale"
          icon="pi pi-plus"
          class="p-button-outlined p-button-secondary"
          @click="router.push('/record-sale')"
        />
      </div>

      <!-- Receipt Card -->
      <div class="receipt-paper shadow-8 border-round-xl overflow-hidden mx-auto relative">
        <!-- Print Button Overlay -->
        <div class="absolute top-0 right-0 p-3 no-print">
          <Button
            icon="pi pi-print"
            class="p-button-rounded p-button-text p-button-secondary"
            v-tooltip.left="'Print Receipt'"
            @click="printReceipt"
          />
        </div>

        <header class="receipt-header text-center p-5 border-bottom-1 border-gray-200 bg-gray-50">
          <div class="flex align-items-center justify-content-center gap-2 mb-2">
            <i class="pi pi-heart-fill text-primary text-2xl"></i>
            <h2 class="text-2xl font-bold text-gray-900 m-0 uppercase tracking-tight">
              {{ profile.pharmacyName || 'Pharmacy Name' }}
            </h2>
          </div>
          <p class="text-gray-600 text-sm m-0" v-if="profile.address">
            {{ profile.address }}
          </p>
          <p class="text-gray-600 text-sm m-0" v-if="profile.phone">Tel: {{ profile.phone }}</p>
          <p class="text-gray-600 text-sm mt-1 font-medium" v-if="profile.panNumber">
            PAN: {{ profile.panNumber }}
          </p>
          <div
            class="mt-3 inline-block px-3 py-1 border-round text-xs font-bold tracking-wider uppercase"
            :class="
              sale.status === 'paid'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            "
          >
            {{ sale.status === 'paid' ? 'VAT INVOICE' : 'CREDIT INVOICE' }}
          </div>
        </header>

        <div class="p-5">
          <!-- Meta Details -->
          <div class="flex justify-content-between text-sm mb-4 text-gray-600">
            <div>
              <div class="mb-1"><strong>Bill No:</strong> #{{ sale.billNumber }}</div>
              <div><strong>Date:</strong> {{ formatDate(sale.createdAt) }}</div>
            </div>
            <div class="text-right" v-if="customer">
              <div class="mb-1"><strong>Bill To:</strong></div>
              <div class="font-bold text-gray-900">{{ customer.name }}</div>
              <div v-if="customer.phone">{{ customer.phone }}</div>
            </div>
            <div class="text-right" v-else>
              <div class="mb-1"><strong>Bill To:</strong></div>
              <div class="font-bold text-gray-900">Walk-in Customer</div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="w-full mb-4 text-sm border-collapse">
            <thead>
              <tr class="text-gray-500 border-bottom-1 border-gray-200">
                <th class="text-left py-2 font-medium">Item</th>
                <th class="text-right py-2 font-medium">Qty</th>
                <th class="text-right py-2 font-medium">Rate</th>
                <th class="text-right py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in sale.items"
                :key="index"
                class="border-bottom-1 border-gray-100"
              >
                <td class="py-2 text-gray-800">{{ item.name }}</td>
                <td class="py-2 text-right text-gray-600">{{ item.quantity }}</td>
                <td class="py-2 text-right text-gray-600">{{ item.price.toFixed(2) }}</td>
                <td class="py-2 text-right font-medium text-gray-900">
                  {{ (item.quantity * item.price).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Summary -->
          <div class="flex flex-column align-items-end gap-2 text-sm">
            <div class="flex justify-content-between w-15rem text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {{ (sale.subtotal || 0).toFixed(2) }}</span>
            </div>
            <div v-if="sale.discount > 0" class="flex justify-content-between w-15rem text-red-500">
              <span>Discount</span>
              <span>- Rs. {{ (sale.discount || 0).toFixed(2) }}</span>
            </div>
            <div
              class="flex justify-content-between w-15rem text-gray-600 border-top-1 border-gray-200 pt-2"
            >
              <span>Taxable Amount</span>
              <span>Rs. {{ ((sale.subtotal || 0) - (sale.discount || 0)).toFixed(2) }}</span>
            </div>
            <div class="flex justify-content-between w-15rem text-gray-600">
              <span>VAT (13%)</span>
              <span>Rs. {{ (sale.vatAmount || 0).toFixed(2) }}</span>
            </div>
            <div
              class="flex justify-content-between w-15rem text-xl font-bold text-gray-900 mt-2 pt-2 border-top-2 border-gray-900"
            >
              <span>Grand Total</span>
              <span>Rs. {{ sale.total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-6 text-center text-xs text-gray-400">
            <p class="mb-1">Thank you for your visit!</p>
            <p>Generated by Devi Pharmacy OS</p>
          </div>
        </div>
      </div>

      <!-- Bottom Action -->
      <div class="text-center mt-4 no-print">
        <Button
          label="Start New Sale"
          icon="pi pi-refresh"
          class="p-button-lg bg-primary border-none hover:bg-primary-600 shadow-4 font-bold"
          @click="router.push('/record-sale')"
        />
      </div>
    </div>

    <div v-else class="text-center py-8">
      <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
      <p class="text-gray-400">Loading receipt details...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database } from '@/database'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const saleId = route.params.id

const sale = ref(null)
const profile = useProfileStore()
const customer = ref(null)

const processSaleData = async (saleData) => {
  if (!saleData) return

  // Check if it's a WatermelonDB model (has _raw) or plain object
  const isModel = !!saleData._raw

  let items = []
  if (isModel) {
    try {
      items = JSON.parse(saleData.items)
    } catch {
      items = []
    }
  } else {
    items = typeof saleData.items === 'string' ? JSON.parse(saleData.items) : saleData.items
  }

  const formattedSale = {
    ...saleData, // Spread properties (works for plain object, but not for Model getters)
    billNumber: isModel ? saleData.billNumber : saleData.bill_number,
    createdAt: isModel ? saleData.createdAt : saleData.created_at,
    subtotal: isModel
      ? saleData.subtotal
      : saleData.subtotal !== undefined
        ? saleData.subtotal
        : saleData.total,
    vatAmount: isModel ? saleData.taxTotal : saleData.vat_amount || 0,
    discount: isModel ? saleData.discount : saleData.discount || 0,
    items: items.map((item) => ({
      ...item,
      name: decryptData(item.name),
    })),
    total: isModel ? saleData.total : saleData.total,
  }
  sale.value = formattedSale

  const customerIdToFetch = isModel
    ? saleData.customerId
    : saleData.customer_id || saleData.customerId

  if (customerIdToFetch) {
    let fetchedCustomer = null
    try {
      fetchedCustomer = await database.get('customers').find(customerIdToFetch)
    } catch {
      console.warn('Customer not found locally')
    }

    if (fetchedCustomer) {
      // Handle Model vs Object for customer
      const isCustModel = !!fetchedCustomer._raw
      const name = isCustModel ? fetchedCustomer.name : fetchedCustomer.name
      const phone = isCustModel ? fetchedCustomer.phone : fetchedCustomer.phone

      customer.value = {
        ...fetchedCustomer, // Spread if object
        name: decryptData(name),
        phone: decryptData(phone),
      }
    }
  }
}

onMounted(async () => {
  const tempSaleJSON = sessionStorage.getItem('temp_sale_data')
  let fetchedSale = null

  if (tempSaleJSON) {
    const tempSale = JSON.parse(tempSaleJSON)
    if (tempSale.id === saleId || tempSale._id === saleId) {
      fetchedSale = tempSale
    }
    sessionStorage.removeItem('temp_sale_data')
  }

  if (!fetchedSale) {
    try {
      fetchedSale = await database.get('sales').find(saleId)
    } catch {
      console.warn('Sale not found locally')
    }
  }

  await processSaleData(fetchedSale)
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const printReceipt = () => {
  window.print()
}
</script>

<style scoped>
.receipt-paper {
  background: white;
  color: #1f2937; /* gray-800 */
  max-width: 400px;
  width: 100%;
}

@media print {
  .no-print {
    display: none !important;
  }

  body * {
    visibility: hidden;
  }

  .receipt-paper,
  .receipt-paper * {
    visibility: visible;
  }

  .receipt-paper {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  /* Ensure text is black for printing */
  .text-gray-600,
  .text-gray-500,
  .text-gray-400 {
    color: #000 !important;
  }
}
</style>
