<template>
  <div class="notifications-container p-4 max-w-4xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-thin text-white mb-2">Notifications</h1>
      <p class="text-gray-400">Broadcast messages and updates.</p>
    </div>

    <!-- Admin: Create Notification -->
    <div v-if="isAdmin" class="glass-panel p-4 mb-6">
      <h2 class="text-xl font-bold text-white mb-3">Post New Message</h2>
      <div class="flex flex-column gap-3">
        <Textarea
          v-model="newMessage"
          rows="3"
          placeholder="Type your message here..."
          class="w-full"
        />
        <div class="flex justify-content-end">
          <Button
            label="Post Message"
            icon="pi pi-send"
            @click="postNotification"
            :loading="isPosting"
            :disabled="!newMessage.trim()"
          />
        </div>
      </div>
    </div>

    <!-- Notification List -->
    <div class="flex flex-column gap-3">
      <div v-if="isLoading" class="text-center py-4">
        <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-6 text-gray-500">
        <i class="pi pi-bell-slash text-4xl mb-3 opacity-50"></i>
        <p>No new notifications.</p>
      </div>

      <div
        v-for="note in notifications"
        :key="note.id"
        class="glass-panel p-4 border-left-3 border-primary flex flex-column gap-2"
      >
        <div class="flex justify-content-between align-items-start">
          <p class="text-white text-lg m-0 line-height-3">{{ note.message }}</p>
          <small class="text-gray-500 whitespace-nowrap ml-3">
            {{ formatDate(note.created_at) }}
          </small>
        </div>
        <!-- <div class="text-xs text-gray-400 mt-2">Posted by Admin</div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useNotificationStore } from '@/stores/notification'
import { useStaffStore } from '@/stores/staff'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'

const profileStore = useProfileStore()
const staffStore = useStaffStore()
const toast = useToast()

const notifications = ref([])
const newMessage = ref('')
const isLoading = ref(false)
const isPosting = ref(false)

const isAdmin = computed(() => staffStore.activeUserRole === 'admin')

const fetchNotifications = async () => {
  isLoading.value = true
  try {
    const records = await database.get('notifications')
       .query(
          Q.where('pharmacy_id', profileStore.pharmacyId),
          Q.where('is_active', true)
          // Q.sortBy('created_at', Q.desc) // WatermelonDB sort syntax might differ slightly or need plugin
       ).fetch()
    
    // Manual sort if needed (WatermelonDB sort is limited without LokiJS adapter sometimes)
    notifications.value = records.sort((a, b) => b.createdAt - a.createdAt).map(n => n._raw)

    // Mark as read when viewing
    const notificationStore = useNotificationStore()
    notificationStore.markAsRead()
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }
  isLoading.value = false
}

const postNotification = async () => {
  if (!newMessage.value.trim()) return

  isPosting.value = true
  try {
     await database.write(async () => {
        await database.get('notifications').create(note => {
           note.pharmacyId = profileStore.pharmacyId
           note.message = newMessage.value
           note.createdBy = staffStore.activeUserId
           note.isActive = true
        })
     })

    toast.add({
      severity: 'success',
      summary: 'Posted',
      detail: 'Message broadcasted.',
      life: 3000,
    })
    newMessage.value = ''
    await fetchNotifications()
  } catch (error) {
    console.error('Error posting notification:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to post message.',
      life: 3000,
    })
  }
  isPosting.value = false
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  if (profileStore.pharmacyId) {
    fetchNotifications()
  }
})
</script>

<style scoped>
/* Glass panel styles are global, but we can override if needed */
</style>
