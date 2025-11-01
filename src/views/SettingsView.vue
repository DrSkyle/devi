<template>
  <div class="settings-container">
    <header class="view-header">
      <h1 class="title">Settings</h1>
      <p class="subtitle">Manage application preferences and features.</p>
    </header>

    <div class="card">
      <h2 class="section-title">Shift Management Mode</h2>
      <p class="section-subtitle">
        Choose how your staff manage their shifts and cash. This setting applies to all staff.
      </p>
      <div class="form-group">
        <label for="shiftMode">Select Shift Mode</label>
        <select id="shiftMode" v-model="settings.shiftMode">
          <option value="strict">Strict Reconciliation (Requires cash counting)</option>
          <option value="simple">Simple Tracking (Tracks time and sales only)</option>
        </select>
      </div>
      <div class="mode-explanation">
        <p v-if="settings.shiftMode === 'strict'">
          <strong>Strict Mode:</strong> Staff must enter their starting cash and count their final
          cash at the end of a shift. Use this if each cashier manages their own drawer.
        </p>
        <p v-if="settings.shiftMode === 'simple'">
          <strong>Simple Mode:</strong> Cash counting is disabled. The system only tracks shift
          duration and total sales value for each staff member. Use this for shared cash drawers.
        </p>
      </div>
    </div>

    <div class="card">
      <h2 class="section-title">Khata SMS Reminders</h2>
      <p class="section-subtitle">
        Automatically send payment reminders to customers with outstanding balances. This requires
        integration with an SMS service.
      </p>

      <div class="form-group toggle-group">
        <label for="sms-enabled">Enable Automated Reminders</label>
        <label class="switch">
          <input type="checkbox" id="sms-enabled" v-model="settings.smsEnabled" />
          <span class="slider round"></span>
        </label>
      </div>

      <div v-if="settings.smsEnabled">
        <div class="form-group">
          <label for="sms-message">Reminder Message Template</label>
          <textarea
            id="sms-message"
            v-model="settings.smsTemplate"
            rows="4"
            placeholder="e.g., Namaste [CustomerName], a friendly reminder that your outstanding balance at [PharmacyName] is Rs. [Balance]. Thank you!"
          ></textarea>
          <div class="template-tags">
            Use tags: <strong>[CustomerName]</strong>, <strong>[Balance]</strong>,
            <strong>[PharmacyName]</strong>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveSettings" class="button">Save Settings</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { useNotificationStore } from '@/stores/notification'

const notification = useNotificationStore()
const settings = reactive({
  shiftMode: 'strict',
  smsEnabled: false,
  smsTemplate: `Namaste [CustomerName], a friendly reminder that your outstanding balance at [PharmacyName] is Rs. [Balance]. Thank you!`,
})

onMounted(async () => {
  const { data: khataSettings } = await supabase
    .from('app_meta')
    .select('value')
    .eq('key', 'khataSettings')
    .single()
  if (khataSettings) Object.assign(settings, khataSettings.value)

  const { data: shiftSettings } = await supabase
    .from('app_meta')
    .select('value')
    .eq('key', 'shiftSettings')
    .single()
  if (shiftSettings) settings.shiftMode = shiftSettings.value.shiftMode || 'strict'
})

const saveSettings = async () => {
  try {
    const { error: khataError } = await supabase.from('app_meta').upsert({
      key: 'khataSettings',
      value: { smsEnabled: settings.smsEnabled, smsTemplate: settings.smsTemplate },
    })
    if (khataError) throw khataError

    const { error: shiftError } = await supabase.from('app_meta').upsert({
      key: 'shiftSettings',
      value: { shiftMode: settings.shiftMode },
    })
    if (shiftError) throw shiftError

    notification.showNotification('Settings saved successfully!')
  } catch (error) {
    notification.showNotification('Failed to save settings.', 'error')
  }
}
</script>

<style scoped>
/* New styles for this page */
.mode-explanation {
  background-color: var(--color-surface-mute);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.mode-explanation strong {
  color: var(--color-primary);
}

/* All other styles are the same */
.settings-container {
  max-width: 700px;
  margin: 0 auto;
}
.card {
  margin-bottom: 2rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.section-subtitle {
  color: var(--color-text-light);
  margin-bottom: 2rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.toggle-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-surface-mute);
  padding: 1rem;
  border-radius: 8px;
}
.toggle-group label {
  font-weight: 600;
  margin: 0;
}
.template-tags {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-top: 0.5rem;
}
.form-actions {
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}
.form-actions button {
  width: auto;
}
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-slate-gray);
  transition: 0.4s;
}
.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
}
input:checked + .slider {
  background-color: var(--color-primary);
}
input:focus + .slider {
  box-shadow: 0 0 1px var(--color-primary);
}
input:checked + .slider:before {
  transform: translateX(26px);
}
.slider.round {
  border-radius: 34px;
}
.slider.round:before {
  border-radius: 50%;
}
</style>
