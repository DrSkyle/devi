import { supabase } from './supabase'
import { db } from './db'
import { useSyncStore } from '@/stores/sync'

export function startSyncService() {
  const syncStore = useSyncStore()

  const handleOnlineStatus = () => {
    syncStore.setIsOnline(navigator.onLine)
  }

  // Listen for network changes
  window.addEventListener('online', handleOnlineStatus)
  window.addEventListener('offline', handleOnlineStatus)

  // Initial check
  handleOnlineStatus()

  // Set up real-time listeners for all tables
  const tables = [
    'customers',
    'inventory',
    'sales',
    'suppliers',
    'payments',
    'prescriptions',
    'transfers',
    'audit_logs',
    'returns',
    'shifts',
    'staff',
    'profiles',
    'pharmacies',
  ]

  tables.forEach((tableName) => {
    supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        syncStore.setStatus('syncing')
        console.log(`Real-time change in ${tableName}:`, payload)
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          db[tableName]
            .put({ ...payload.new, syncStatus: 'synced' })
            .catch((err) => console.error(`Dexie put error in ${tableName}:`, err))
        } else if (payload.eventType === 'DELETE') {
          db[tableName]
            .delete(payload.old._id)
            .catch((err) => console.error(`Dexie delete error in ${tableName}:`, err))
        }
        // Set back to synced after processing
        setTimeout(() => syncStore.setStatus('synced'), 500)
      })
      .subscribe((status, err) => {
        if (err) console.error(`Error subscribing to ${tableName}:`, err)
      })
  })
}
