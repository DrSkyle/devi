<template>
  <div class="ledger-container">
    <div v-if="ledgerItems.length > 0" class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th class="text-right">Debit (-)</th>
            <th class="text-right">Credit (+)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in ledgerItems" :key="item.id">
            <td data-label="Date">{{ formatDate(item.date) }}</td>
            <td data-label="Description">{{ item.description }}</td>
            <td data-label="Debit (-)" class="text-right debit">
              {{ item.type === 'sale' ? `Rs. ${item.amount.toFixed(2)}` : '' }}
            </td>
            <td data-label="Credit (+)" class="text-right credit">
              {{ item.type === 'payment' ? `Rs. ${item.amount.toFixed(2)}` : '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">
      <p>No credit or payment history found.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sales: { type: Array, required: true },
  payments: { type: Array, required: true },
})

const ledgerItems = computed(() => {
  const items = [
    ...props.sales.map((s) => ({
      id: `sale-${s._id}`,
      // *** THE FIX: Changed 'createdAt' to 'created_at' to match the database ***
      date: s.created_at,
      description: `Credit Sale (Bill #${s.bill_number})`, // Also fixed billNumber
      amount: s.total,
      type: 'sale',
    })),
    ...props.payments.map((p) => ({
      id: `payment-${p._id}`,
      // *** THE FIX: Changed 'createdAt' to 'created_at' to match the database ***
      date: p.created_at,
      description: 'Payment Received',
      amount: p.amount,
      type: 'payment',
    })),
  ]
  // Ensure we filter out any items that might have an invalid date
  return items.filter((item) => item.date).sort((a, b) => new Date(b.date) - new Date(a.date))
})

const formatDate = (dateString) => {
  if (!dateString) return 'Invalid Date'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
thead {
  background-color: var(--color-surface-mute);
}
.text-right {
  text-align: right;
}
.debit {
  color: var(--color-danger);
}
.credit {
  color: var(--color-peacock-teal);
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
}

@media (max-width: 640px) {
  thead {
    display: none;
  }
  tr {
    display: block;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 1rem;
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-surface-mute);
  }
  tr td:last-child {
    border-bottom: none;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-light);
  }
}
</style>
