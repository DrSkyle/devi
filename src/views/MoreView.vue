<template>
  <div class="more-container">
    <header class="view-header">
      <h1 class="title">More Options</h1>
      <p class="subtitle">Manage reports, suppliers, and your account.</p>
    </header>

    <div class="menu-list">
      <template v-if="profile.role === 'admin'">
        <RouterLink to="/reports" class="menu-item">
          <span class="icon">📈</span>
          <span class="text">Financial Reports</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/my-transactions" class="menu-item">
          <span class="icon">🕒</span>
          <span class="text">My Recent Transactions</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/end-of-day-report" class="menu-item">
          <span class="icon">☀️</span>
          <span class="text">End-of-Day Report</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/sales-history" class="menu-item">
          <span class="icon">🧾</span>
          <span class="text">Sales History</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/audit-log" class="menu-item">
          <span class="icon">🛡️</span>
          <span class="text">Activity Log</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
      </template>

      <template v-if="profile.role !== 'cashier'">
        <RouterLink to="/process-return" class="menu-item">
          <span class="icon">↩️</span>
          <span class="text">Process a Return</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/suppliers" class="menu-item">
          <span class="icon">🚚</span>
          <span class="text">Suppliers</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/transfers" class="menu-item">
          <span class="icon">🤝</span>
          <span class="text">Stock Transfers</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
        <RouterLink to="/prescriptions" class="menu-item">
          <span class="icon">📄</span>
          <span class="text">Prescriptions</span>
          <span class="arrow">&rarr;</span>
        </RouterLink>
      </template>

      <RouterLink to="/my-pharmacy" class="menu-item">
        <span class="icon">🏢</span>
        <span class="text">My Pharmacy</span>
        <span class="arrow">&rarr;</span>
      </RouterLink>
      <RouterLink to="/medicine-finder" class="menu-item">
        <span class="icon">💊</span>
        <span class="text">Medicine Finder</span>
        <span class="arrow">&rarr;</span>
      </RouterLink>
      <RouterLink v-if="profile.role === 'admin'" to="/settings" class="menu-item">
        <span class="icon">⚙️</span>
        <span class="text">Settings</span>
        <span class="arrow">&rarr;</span>
      </RouterLink>
    </div>

    <div class="footer-actions">
      <button @click="logOut" class="logout-button">Log Out</button>
    </div>
  </div>
</template>

<script setup>
import { supabase } from '@/supabase'
import { useRouter, RouterLink } from 'vue-router'
import { clearLocalData } from '../db'
import { usePromptStore } from '@/stores/prompt.js'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const prompt = usePromptStore()
const profile = useProfileStore()

const logOut = async () => {
  try {
    await prompt.show({
      type: 'confirm',
      title: 'Confirm Log Out',
      message: 'Are you sure you want to log out?',
    })

    await supabase.auth.signOut()
    await clearLocalData()
    window.location.href = '/login'
  } catch (error) {
    if (error !== 'cancelled' && error.message !== 'cancelled') {
      console.error('Logout failed:', error)
    }
  }
}
</script>

<style scoped>
.menu-list {
  margin-top: 2rem;
  background-color: var(--color-surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  text-decoration: none;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item:hover {
  background-color: var(--color-surface-mute);
}
.icon {
  font-size: 1.5rem;
  margin-right: 1.5rem;
}
.text {
  font-weight: 500;
  flex-grow: 1;
}
.arrow {
  font-size: 1.5rem;
  color: var(--color-text-light);
}
.footer-actions {
  margin-top: 2rem;
}
.logout-button {
  background-color: var(--color-surface-mute);
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  font-size: 1rem;
}
.logout-button:hover {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
}
</style>
