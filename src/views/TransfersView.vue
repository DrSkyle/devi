<template>
  <div class="transfers-container">
    <header class="view-header">
      <h1 class="title">Manage Transfers</h1>
      <p class="subtitle">Review incoming requests and track your outgoing requests.</p>
    </header>

    <div class="card">
      <div class="tabs">
        <button @click="activeTab = 'incoming'" :class="{ active: activeTab === 'incoming' }">
          Incoming Requests
          <span v-if="incomingRequests.length > 0" class="count-badge">{{
            incomingRequests.length
          }}</span>
        </button>
        <button @click="activeTab = 'outgoing'" :class="{ active: activeTab === 'outgoing' }">
          Outgoing Requests
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'incoming'">
          <div v-if="incomingRequests.length > 0" class="requests-list">
            <div v-for="req in incomingRequests" :key="req._id" class="request-item">
              <div class="item-details">
                <span class="medicine-name">{{ req.medicine_name }} (Qty: {{ req.quantity }})</span>
                <span class="pharmacy-name">From: {{ req.to_pharmacy_name }}</span>
                <span class="timestamp">Requested on: {{ formatDate(req.created_at) }}</span>
              </div>
              <div v-if="req.status === 'pending'" class="item-actions">
                <button @click="updateRequestStatus(req, 'rejected')" class="button-secondary">
                  Reject
                </button>
                <button @click="updateRequestStatus(req, 'accepted')" class="button">Accept</button>
              </div>
              <div v-else class="status-badge" :class="req.status">
                {{ req.status }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>You have no pending incoming requests.</p>
          </div>
        </div>

        <div v-if="activeTab === 'outgoing'">
          <div v-if="outgoingRequests.length > 0" class="requests-list">
            <div v-for="req in outgoingRequests" :key="req._id" class="request-item">
              <div class="item-details">
                <span class="medicine-name">{{ req.medicine_name }} (Qty: {{ req.quantity }})</span>
                <span class="pharmacy-name">To: {{ req.from_pharmacy_name }}</span>
                <span class="timestamp">Requested on: {{ formatDate(req.created_at) }}</span>
              </div>
              <div class="status-badge" :class="req.status">
                {{ req.status }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>You have not made any transfer requests.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'

const notification = useNotificationStore()
const profileStore = useProfileStore()
const activeTab = ref('incoming')
const allTransfers = ref([])

const fetchTransfers = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase
    .from('transfers')
    .select('*')
    .or(
      `from_pharmacy_id.eq.${profileStore.pharmacyId},to_pharmacy_id.eq.${profileStore.pharmacyId}`,
    )
  if (data) {
    allTransfers.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}

onActivated(fetchTransfers)

const incomingRequests = computed(() => {
  return allTransfers.value.filter((t) => t.from_pharmacy_id === profileStore.pharmacyId)
})

const outgoingRequests = computed(() => {
  return allTransfers.value.filter((t) => t.to_pharmacy_id === profileStore.pharmacyId)
})

const updateRequestStatus = async (request, newStatus) => {
  try {
    const { error } = await supabase
      .from('transfers')
      .update({ status: newStatus })
      .eq('_id', request._id)
    if (error) throw error

    notification.showNotification(`Request has been ${newStatus}.`)
    await fetchTransfers()
  } catch (error) {
    notification.showNotification('Failed to update request status.', 'error')
  }
}

const formatDate = (dateString) => new Date(dateString).toLocaleString()
</script>

<style scoped>
.card {
  padding: 0;
}
.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}
.tabs button {
  background: none;
  border: none;
  color: var(--color-text-light);
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.tabs button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.count-badge {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
  font-size: 0.8rem;
  padding: 0.1rem 0.5rem;
  border-radius: 99px;
}
.tab-content {
  padding: 1.5rem;
}
.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--color-surface-mute);
  border-radius: 8px;
  margin-bottom: 1rem;
}
.item-details {
  display: flex;
  flex-direction: column;
}
.medicine-name {
  font-weight: 600;
}
.pharmacy-name,
.timestamp {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.item-actions {
  display: flex;
  gap: 1rem;
}
.item-actions button {
  width: auto;
}
.status-badge {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.9rem;
  text-transform: capitalize;
}
.status-badge.pending {
  background-color: var(--color-slate-gray);
  color: var(--color-soft-cream);
}
.status-badge.accepted {
  background-color: var(--color-peacock-teal);
  color: var(--color-midnight-blue);
}
.status-badge.rejected {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
}
</style>
