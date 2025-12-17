<template>
  <div class="customer-ledger">
    <div v-if="isLoading" class="text-center p-4">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <div v-else-if="transactions.length > 0">
      <DataTable
        :value="transactions"
        class="p-datatable-sm glass-datatable"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="10"
        :rowHover="true"
      >
        <Column field="date" header="Date" sortable>
          <template #body="slotProps">
            <span class="text-gray-300">{{ formatDate(slotProps.data.created_at) }}</span>
          </template>
        </Column>

        <Column field="type" header="Type" sortable>
          <template #body="slotProps">
            <Tag
              :value="getTypeLabel(slotProps.data.type)"
              :severity="getTypeSeverity(slotProps.data.type)"
              class="text-xs uppercase"
            />
          </template>
        </Column>

        <Column field="amount" header="Amount" sortable>
          <template #body="slotProps">
            <span class="font-mono font-bold" :class="getAmountClass(slotProps.data.type)">
              Rs. {{ slotProps.data.amount.toFixed(2) }}
            </span>
          </template>
        </Column>

        <Column field="remarks" header="Remarks">
          <template #body="slotProps">
            <span class="text-gray-400 text-sm">{{ slotProps.data.remarks || '-' }}</span>
          </template>
        </Column>

        <Column header="Action">
          <template #body="slotProps">
            <RouterLink
              v-if="slotProps.data.sale_id"
              :to="`/receipt/${slotProps.data.sale_id}?from=customer`"
              class="no-underline"
            >
              <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text p-button-sm text-primary hover:text-white"
                v-tooltip.top="'View Receipt'"
              />
            </RouterLink>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="text-center p-6 text-gray-500">
      <i class="pi pi-inbox text-4xl mb-3 block"></i>
      No transaction history found.
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { RouterLink } from 'vue-router'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const props = defineProps({
  customerId: {
    type: String,
    required: true,
  },
})

const transactions = ref([])
const isLoading = ref(true)

const fetchTransactions = async () => {
  isLoading.value = true
  try {
    // Fetch Transactions
    const txns = await database
      .get('transactions')
      .query(Q.where('customer_id', props.customerId), Q.sortBy('created_at', Q.desc))
      .fetch()

    // Fetch Credit Sales
    const creditSales = await database
      .get('sales')
      .query(
        Q.where('customer_id', props.customerId),
        Q.where('status', 'unpaid'),
        Q.sortBy('created_at', Q.desc),
      )
      .fetch()

    const combined = [
      ...txns.map((t) => ({
        ...t._raw,
        id: t.id,
        date: t.createdAt,
        type: t.type,
        amount: t.amount,
        remarks: t.remarks,
        sale_id: t.saleId,
      })),
      ...creditSales.map((s) => ({
        id: `sale_${s.id}`,
        date: s.createdAt,
        type: 'debit', // Sale on credit
        amount: s.total,
        remarks: `Bill #${s.billNumber}`,
        sale_id: s.id,
      })),
    ]

    // Sort by date desc
    transactions.value = combined.sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    console.error('Error fetching ledger:', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.customerId, fetchTransactions, { immediate: true })

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' })
}

const getTypeLabel = (type) => {
  if (type === 'payment') return 'Payment'
  if (type === 'debit') return 'Credit Sale'
  if (type === 'credit_deposit') return 'Deposit'
  return type
}

const getTypeSeverity = (type) => {
  if (type === 'payment' || type === 'credit_deposit') return 'success'
  if (type === 'debit') return 'danger'
  return 'info'
}

const getAmountClass = (type) => {
  if (type === 'payment' || type === 'credit_deposit') return 'text-green-400'
  if (type === 'debit') return 'text-red-400'
  return 'text-white'
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
</style>
