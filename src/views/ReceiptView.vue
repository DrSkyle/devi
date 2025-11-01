<template>
  <div class="receipt-container" v-if="sale && profile">
    <div class="card receipt-paper">
      <header class="receipt-header">
        <h1 class="invoice-title">
          {{ sale.status === 'paid' ? 'VAT INVOICE' : 'CREDIT INVOICE' }}
        </h1>
        <h2>{{ profile.name || 'Pharmacy Name' }}</h2>
        <p v-if="profile.city">{{ profile.tole ? profile.tole + ',' : '' }} {{ profile.city }}</p>
        <p v-if="profile.panNumber">PAN: {{ profile.panNumber }}</p>
      </header>
      <div class="bill-details">
        <div><strong>Bill No:</strong> {{ sale.billNumber }}</div>
        <div><strong>Date:</strong> {{ formatDate(sale.createdAt) }}</div>
      </div>
      <div v-if="customer" class="customer-details">
        <strong>Bill To:</strong> {{ customer.name }}
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in sale.items" :key="index">
            <td>{{ decryptData(item.name) }}</td>
            <td class="text-right">{{ item.quantity }}</td>
            <td class="text-right">{{ item.price.toFixed(2) }}</td>
            <td class="text-right">{{ (item.quantity * item.price).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="summary-section">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>Rs. {{ (sale.subtotal || 0).toFixed(2) }}</span>
        </div>
        <div v-if="sale.discount > 0" class="summary-row">
          <span>Discount</span>
          <span>- Rs. {{ (sale.discount || 0).toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Taxable Amount</span>
          <span>Rs. {{ ((sale.subtotal || 0) - (sale.discount || 0)).toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>VAT Amount</span>
          <span>Rs. {{ (sale.vatAmount || 0).toFixed(2) }}</span>
        </div>
        <div class="summary-row total">
          <span>Grand Total</span>
          <span>Rs. {{ sale.total.toFixed(2) }}</span>
        </div>
        <div class="summary-row status">
          <span>Status</span>
          <span>{{ sale.status === 'paid' ? 'PAID IN CASH' : 'ADDED TO KHATA' }}</span>
        </div>
      </div>
      <footer class="receipt-footer">
        <p>Thank you for your visit!</p>
      </footer>
    </div>

    <div class="actions">
      <RouterLink to="/sales-history" class="button button-secondary"
        >&larr; Sales History</RouterLink
      >
      <RouterLink to="/record-sale" class="button button-secondary">New Sale</RouterLink>
      <button @click="printReceipt" class="button">Print Receipt</button>
    </div>
  </div>
  <div v-else class="loading-state">
    <p>Loading receipt...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { db } from '../db'
import { supabase } from '@/supabase'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const saleId = Number(route.params.id)

const sale = ref(null)
const profile = useProfileStore()
const customer = ref(null)

const processSaleData = async (saleData) => {
  if (!saleData) return

  // *** THIS IS THE FIX ***
  // We are creating a new, clean 'sale' object and mapping the
  // database field `bill_number` to the template variable `billNumber`.
  const formattedSale = {
    ...saleData,
    billNumber: saleData.bill_number, // The key mapping happens here
    createdAt: saleData.created_at,
    subtotal: saleData.subtotal !== undefined ? saleData.subtotal : saleData.total,
    vatAmount: saleData.vat_amount || 0,
    discount: saleData.discount || 0,
  }
  sale.value = formattedSale

  const customerIdToFetch = saleData.customer_id || saleData.customerId
  if (customerIdToFetch) {
    let fetchedCustomer = await db.customers.get(customerIdToFetch)
    if (!fetchedCustomer) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('_id', customerIdToFetch)
        .single()
      fetchedCustomer = data
    }
    if (fetchedCustomer) {
      customer.value = { ...fetchedCustomer, name: decryptData(fetchedCustomer.name) }
    }
  }
}

onMounted(async () => {
  const tempSaleJSON = sessionStorage.getItem('temp_sale_data')
  let fetchedSale = null

  if (tempSaleJSON) {
    const tempSale = JSON.parse(tempSaleJSON)
    if (tempSale._id === saleId) {
      fetchedSale = tempSale
    }
    sessionStorage.removeItem('temp_sale_data')
  }

  if (!fetchedSale) {
    fetchedSale = await db.sales.get(saleId)
    if (!fetchedSale) {
      const { data } = await supabase.from('sales').select('*').eq('_id', saleId).single()
      fetchedSale = data
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

<style>
/* Styles are unchanged */
.button-secondary {
  background-color: var(--color-surface-mute);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
}
.button-secondary:hover {
  background-color: var(--color-slate-gray);
}
.text-right {
  text-align: right !important;
}
.invoice-title {
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 1rem;
}
.receipt-header h2 {
  font-size: 1.5rem;
  margin: 0;
}
.customer-details {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.back-link:hover {
  color: var(--color-primary);
}
.summary-row.status {
  font-weight: bold;
}
.receipt-container {
  max-width: 400px;
  margin: 0 auto;
  font-family: 'Courier New', Courier, monospace;
}
.receipt-paper {
  padding: 1.5rem;
  background-color: #fff;
  color: #000;
}
.receipt-header {
  text-align: center;
  border-bottom: 2px dashed #000;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.receipt-header p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}
.bill-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.items-table th,
.items-table td {
  text-align: left;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
.items-table thead {
  border-bottom: 1px solid #000;
}
.summary-section {
  border-top: 2px dashed #000;
  padding-top: 1rem;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}
.summary-row.total {
  font-weight: bold;
  font-size: 1.1rem;
}
.receipt-footer {
  text-align: center;
  margin-top: 2rem;
}
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}
.loading-state {
  text-align: center;
  padding: 2rem;
}
@media print {
  body {
    background-color: #fff;
  }
  .app-sidebar,
  .bottom-nav,
  .actions,
  .view-header {
    display: none !important;
  }
  .main-content {
    margin: 0 !important;
    padding: 0 !important;
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
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none;
  }
}
</style>
