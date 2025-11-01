<template>
  <div class="receipt-container" v-if="returnData && profile">
    <div class="card receipt-paper">
      <header class="receipt-header">
        <h1 class="invoice-title">CREDIT NOTE</h1>
        <h2>{{ profile.name }}</h2>
        <p v-if="profile.city">{{ profile.tole ? profile.tole + ',' : '' }} {{ profile.city }}</p>
        <p v-if="profile.pan_number">PAN: {{ profile.pan_number }}</p>
      </header>
      <div class="bill-details">
        <div><strong>Credit Note No:</strong> {{ returnData._id }}</div>
        <div><strong>Date:</strong> {{ new Date(returnData.created_at).toLocaleString() }}</div>
      </div>
      <div class="bill-details">
        <div><strong>Ref. Bill No:</strong> {{ returnData.bill_number }}</div>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Returned Item(s)</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in returnData.items" :key="index">
            <td>{{ decryptData(item.name) }}</td>
            <td class="text-right">{{ item.quantity }}</td>
            <td class="text-right">{{ item.price.toFixed(2) }}</td>
            <td class="text-right">{{ (item.quantity * item.price).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="summary-section">
        <div class="summary-row total">
          <span>Total Return Value</span>
          <span>Rs. {{ returnData.total_value.toFixed(2) }}</span>
        </div>
      </div>
      <footer class="receipt-footer">
        <p>Goods returned have been processed.</p>
      </footer>
    </div>

    <div class="actions">
      <RouterLink to="/process-return" class="button-secondary">Back to Returns</RouterLink>
      <button @click="printReceipt" class="button">Print Credit Note</button>
    </div>
  </div>
  <div v-else class="loading-state">
    <p>Loading credit note...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile.js'
import { decryptData } from '@/utils/cipher'

const route = useRoute()
const profile = useProfileStore()
const returnId = Number(route.params.id)

const returnData = ref(null)

onMounted(async () => {
  const { data } = await supabase.from('returns').select('*').eq('_id', returnId).single()
  returnData.value = data
})

const printReceipt = () => window.print()
</script>

<style>
/* NEW: Added missing button style */
.button-secondary {
  background-color: var(--color-surface-mute);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
}
.back-link:hover {
  color: var(--color-primary);
}
.button-secondary:hover {
  background-color: var(--color-slate-gray);
}

/* Most styles are reused from ReceiptView.vue */
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
.text-right {
  text-align: right !important;
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
}
.loading-state {
  text-align: center;
  padding: 2rem;
}

/* NEW: Corrected print styles */
@media print {
  body {
    background-color: #fff !important;
  }
  /* These classes are in App.vue, so styles need to be global */
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
  /* Hide everything by default */
  body * {
    visibility: hidden;
  }
  /* Then, only show the receipt paper and its contents */
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
