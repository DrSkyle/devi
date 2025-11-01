<template>
  <div class="audit-log-container">
    <header class="view-header">
      <h1 class="title">Activity Log</h1>
      <p class="subtitle">A complete history of all actions performed in the app.</p>
    </header>

    <div class="actions-bar">
      <DataExporter
        :data="formattedLogs"
        :file-name="`activity_log_${new Date().toISOString().split('T')[0]}.csv`"
        button-text="Export Log to CSV"
      />
    </div>

    <div class="card">
      <div v-if="logs.length > 0" class="log-list">
        <div v-for="log in logs" :key="log._id" class="log-item">
          <div class="log-header">
            <span class="log-action">{{ formatAction(log.action) }}</span>
            <span class="log-timestamp">{{ formatDate(log.timestamp) }}</span>
          </div>
          <div class="log-details">
            <p><strong>User:</strong> {{ log.userName || 'System' }}</p>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No activity has been recorded yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import DataExporter from '@/components/DataExporter.vue'
import { useProfileStore } from '@/stores/profile'

const logs = ref([])
const profileStore = useProfileStore()

const fetchLogs = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: fetchedLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
  const { data: allProfiles } = await supabase.from('profiles').select('user_id, name')

  if (fetchedLogs) {
    const userMap = new Map((allProfiles || []).map((p) => [p.user_id, p.name]))
    logs.value = fetchedLogs.map((log) => ({
      ...log,
      userName: userMap.get(log.user_id) || log.details?.email || 'Unknown User',
    }))
  }
}

onActivated(fetchLogs)

const formatDate = (dateString) => {
  // This function remains the same
  return new Date(dateString).toLocaleString('en-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
const formatAction = (action) => {
  // This function remains the same
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

const formattedLogs = computed(() => {
  // This computed property remains the same
  return logs.value.map((log) => ({
    Timestamp: formatDate(log.timestamp),
    User: log.userName,
    Action: formatAction(log.action),
    Details: JSON.stringify(log.details),
  }))
})
</script>

<style scoped>
.actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}
.card {
  padding: 0;
  margin-top: 1rem;
}
.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.log-item {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}
.log-item:last-child {
  border-bottom: none;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.log-action {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-soft-cream);
}
.log-timestamp {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.log-details p {
  margin: 0.25rem 0;
  color: var(--color-light-slate);
}
.log-details strong {
  color: var(--color-text-light);
}
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-light);
}
</style>
