<template>
  <div class="settings-container max-w-3xl mx-auto p-4">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
      <p class="text-gray-400">Manage application preferences and features.</p>
    </header>

    <!-- Shift Management Section Removed -->

    <!-- SMS Reminders Section -->
    <div class="glass-panel p-5 mb-6">
      <div class="flex align-items-center justify-content-between mb-4">
        <div class="flex align-items-center gap-3">
          <div class="bg-purple-500 border-round-lg p-2">
            <i class="pi pi-envelope text-white text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-white m-0">Khata SMS Reminders</h2>
            <p class="text-gray-400 text-sm mt-1">Automated payment reminders.</p>
          </div>
        </div>
        <InputSwitch v-model="settings.smsEnabled" />
      </div>

      <div v-if="settings.smsEnabled" class="animation-duration-300 fadein">
        <div class="field mb-4">
          <label for="smsTemplate" class="block text-gray-300 font-medium mb-2"
            >Message Template</label
          >
          <Textarea
            id="smsTemplate"
            v-model="settings.smsTemplate"
            rows="4"
            class="w-full"
            placeholder="Enter your message template..."
          />
          <small class="block mt-2 text-gray-500">
            Available tags: <span class="text-primary">[CustomerName]</span>,
            <span class="text-primary">[Balance]</span>,
            <span class="text-primary">[PharmacyName]</span>
          </small>
        </div>
      </div>
    </div>

    <!-- Theme Preferences Section -->
    <div class="glass-panel p-5 mb-6">
      <div class="flex align-items-center gap-3 mb-4">
        <div class="bg-pink-500 border-round-lg p-2">
          <i class="pi pi-palette text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white m-0">Theme Preferences</h2>
          <p class="text-gray-400 text-sm mt-1">Customize the look and feel.</p>
        </div>
      </div>

      <div class="field mb-4">
        <label class="block text-gray-300 font-medium mb-2">Accent Color</label>
        <div class="flex gap-3 flex-wrap">
          <div
            v-for="color in accentColors"
            :key="color.value"
            class="w-3rem h-3rem border-circle cursor-pointer transition-all hover:scale-110 flex align-items-center justify-content-center flex-shrink-0"
            :style="{
              backgroundColor: color.value,
              boxShadow: settings.accentColor === color.value ? `0 0 15px ${color.value}` : 'none',
              border: settings.accentColor === color.value ? '2px solid white' : 'none',
            }"
            @click="updateAccentColor(color.value)"
          >
            <i
              v-if="settings.accentColor === color.value"
              class="pi pi-check text-white text-xl"
            ></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Backup & Restore Section -->
    <div class="glass-panel p-5 mb-6">
      <div class="flex align-items-center gap-3 mb-4">
        <div class="bg-blue-500 border-round-lg p-2">
          <i class="pi pi-database text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white m-0">Data Management</h2>
          <p class="text-gray-400 text-sm mt-1">Backup and restore your data.</p>
        </div>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="border-1 border-white-alpha-10 border-round p-3 h-full flex flex-column">
            <h3 class="text-lg font-bold text-white mb-2">Backup</h3>
            <p class="text-gray-400 text-sm mb-4 flex-grow-1">
              Download a copy of your inventory and sales data.
            </p>
            <Button
              label="Download Backup"
              icon="pi pi-download"
              class="p-button-outlined w-full"
              @click="downloadBackup"
            />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="border-1 border-white-alpha-10 border-round p-3 h-full flex flex-column">
            <h3 class="text-lg font-bold text-white mb-2">Restore</h3>
            <p class="text-gray-400 text-sm mb-4 flex-grow-1">
              Restore data from a previous backup file.
            </p>
            <Button
              label="Upload Backup"
              icon="pi pi-upload"
              class="p-button-outlined w-full"
              @click="triggerRestore"
            />
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept=".json"
              @change="handleRestore"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-content-end">
      <Button
        label="Save Changes"
        icon="pi pi-check"
        @click="saveSettings"
        :loading="isSaving"
        class="w-full md:w-auto"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useNotificationStore } from '@/stores/notification'

import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const notification = useNotificationStore()
const isSaving = ref(false)
const fileInput = ref(null)

const settings = reactive({
  smsEnabled: false,
  smsTemplate: `Namaste [CustomerName], a friendly reminder that your outstanding balance at [PharmacyName] is Rs. [Balance]. Thank you!`,
  accentColor: '#10b981', // Default Emerald
})

const accentColors = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
]

onMounted(async () => {
  // Load from local DB
  const appMeta = database.get('app_meta')
  const existing = await appMeta.query(Q.where('key', 'khataSettings')).fetch()
  if (existing.length > 0) {
      Object.assign(settings, existing[0].value)
  }

  // Load theme preference if saved (mock implementation for now, could be in local storage or DB)
  const savedColor = localStorage.getItem('accentColor')
  if (savedColor) settings.accentColor = savedColor
  updateAccentColor(settings.accentColor)
})

const updateAccentColor = (color) => {
  settings.accentColor = color
  document.documentElement.style.setProperty('--primary-color', color)
  document.documentElement.style.setProperty('--accent-glow', color)
  // Also update PrimeVue primary color variable if possible, or rely on our overrides using these vars
  localStorage.setItem('accentColor', color)
}

const downloadBackup = async () => {
  try {
    // Fetch all data from WatermelonDB
    const tables = [
      'customers',
      'inventory',
      'sales',
      'suppliers',
      'staff',
      'profiles',
      'pharmacies',
      'unmet_demand',
      'shifts',
      'notifications',
      'dda_logs',
      'app_meta',
    ]

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0', // WatermelonDB version
      tables: {},
    }

    for (const table of tables) {
      const collection = database.get(table)
      const records = await collection.query().fetch()
      backupData.tables[table] = records.map((r) => r._raw)
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devi-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    notification.showNotification('Backup downloaded successfully!')
  } catch (error) {
    console.error('Backup failed:', error)
    notification.showNotification('Failed to create backup.', 'error')
  }
}

const triggerRestore = () => {
  fileInput.value.click()
}

const handleRestore = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)

      if (!data.tables) throw new Error('Invalid backup format')

      await database.write(async () => {
        for (const [tableName, rows] of Object.entries(data.tables)) {
          // Skip if table not in schema (legacy backup support)
          try {
            const collection = database.get(tableName)
            if (!collection) continue

            for (const row of rows) {
              try {
                const existing = await collection.find(row.id)
                await existing.update((rec) => {
                  Object.keys(row).forEach((key) => {
                    if (key !== 'id' && key !== '_status' && key !== '_changed')
                      rec._raw[key] = row[key]
                  })
                })
              } catch {
                await collection.create((rec) => {
                  rec._raw.id = row.id
                  Object.keys(row).forEach((key) => {
                    if (key !== 'id' && key !== '_status' && key !== '_changed')
                      rec._raw[key] = row[key]
                  })
                })
              }
            }
          } catch (err) {
            console.warn(`Skipping table ${tableName}:`, err)
          }
        }
      })

      notification.showNotification('Data restored successfully!')
      // Optional: Reload to reflect changes
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      console.error('Restore failed:', error)
      notification.showNotification('Invalid backup file or restore failed.', 'error')
    }
  }
  reader.readAsText(file)
}

const saveSettings = async () => {
  isSaving.value = true
  try {
  // Save locally to WatermelonDB AppMeta
    await database.write(async () => {
      const appMeta = database.get('app_meta')
      const key = 'khataSettings'
      const value = { smsEnabled: settings.smsEnabled, smsTemplate: settings.smsTemplate }

      const existing = await appMeta.query(Q.where('key', key)).fetch()
      if (existing.length > 0) {
        await existing[0].update((rec) => {
          rec.value = value
        })
      } else {
        await appMeta.create((rec) => {
          rec.key = key
          rec.value = value
        })
      }
    })

    notification.showNotification('Settings saved locally!')
  } catch (error) {
    console.error(error)
    notification.showNotification('Failed to save settings.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* Scoped styles if needed, but global styles should handle most */
</style>
