<template>
  <aside class="app-sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-placeholder"></span>
        <div class="logo-text-container">
          <span class="brand-name">D.E.V.I</span>
          <span v-if="profile.name" class="pharmacy-name">{{ profile.name }}</span>
        </div>
      </div>
    </div>

    <nav class="navigation">
      <RouterLink to="/">Dashboard</RouterLink>
      <RouterLink to="/medicine-finder">Finder</RouterLink>

      <h4 class="nav-heading">Sales</h4>
      <RouterLink to="/record-sale">Record Sale</RouterLink>
      <RouterLink to="/my-transactions">My Recent Sales</RouterLink>

      <RouterLink v-if="staffStore.activeUserRole !== 'cashier'" to="/prescriptions"
        >Prescriptions</RouterLink
      >

      <RouterLink v-if="staffStore.activeUserRole === 'admin'" to="/sales-history"
        >Sales History</RouterLink
      >

      <RouterLink v-if="staffStore.activeUserRole !== 'cashier'" to="/process-return"
        >Process Return</RouterLink
      >

      <h4 class="nav-heading">Customers</h4>
      <RouterLink to="/customers">All Customers (Khata)</RouterLink>

      <h4 class="nav-heading">Inventory</h4>
      <RouterLink to="/inventory">Inventory</RouterLink>
      <RouterLink to="/transfers">Manage Transfers</RouterLink>

      <RouterLink v-if="staffStore.activeUserRole !== 'cashier'" to="/suppliers"
        >Suppliers</RouterLink
      >

      <template v-if="staffStore.activeUserRole === 'admin'">
        <h4 class="nav-heading">Reporting</h4>
        <RouterLink to="/reports">Financial Reports</RouterLink>
        <RouterLink to="/analytics">Analytics Dashboard</RouterLink>
        <RouterLink to="/forecasting">AI Forecasting</RouterLink>

        <RouterLink to="/end-of-day-report">End-of-Day Report</RouterLink>
        <RouterLink to="/audit-log">Activity Log</RouterLink>
        <RouterLink v-if="staffStore.activeUserRole === 'admin'" to="/dda-log"
          >DDA Logbook</RouterLink
        >
      </template>
    </nav>

    <div class="sidebar-footer">
      <button @click="switchLanguage" class="footer-link language-switcher">
        {{ locale === 'en' ? 'नेपालीमा बदल्नुहोस्' : 'Switch to English' }}
      </button>
      <RouterLink to="/my-pharmacy" class="footer-link">My Pharmacy</RouterLink>
      <RouterLink v-if="staffStore.activeUserRole === 'admin'" to="/settings" class="footer-link"
        >Settings</RouterLink
      >
      <button @click="logOut" class="logout-button">Log Out</button>
    </div>
  </aside>
</template>

<script setup>
import { getAuth, signOut } from 'firebase/auth'
import { useRouter, RouterLink } from 'vue-router'
import { clearLocalData } from '../db'
import { useProfileStore } from '@/stores/profile.js'
import { usePromptStore } from '@/stores/prompt.js'
import { useStaffStore } from '@/stores/staff.js'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/supabase'

const router = useRouter()
const profile = useProfileStore()
const prompt = usePromptStore()
const staffStore = useStaffStore()
const { locale } = useI18n()

const switchLanguage = () => {
  const newLocale = locale.value === 'en' ? 'ne' : 'en'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

const logOut = async () => {
  try {
    await prompt.show({
      type: 'confirm',
      title: 'Confirm Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
    })

    sessionStorage.clear()
    await supabase.auth.signOut()
    await clearLocalData()
    router.push('/login')
  } catch (error) {
    if (error !== 'cancelled' && error.message !== 'cancelled') {
      console.error('Logout failed:', error)
    }
  }
}
</script>

<style scoped>
/* Styles remain the same */
.app-sidebar {
  background-color: var(--color-surface);
  width: 250px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  border-right: 1px solid var(--color-border);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
}
.sidebar-header {
  margin-bottom: 2.5rem;
  padding-left: 1rem;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.logo-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: var(--color-primary);
}
.logo-text-container {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}
.pharmacy-name {
  font-size: 0.8rem;
  color: var(--color-text-light);
}
.navigation {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}
.nav-heading {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 1rem 0.5rem;
  margin-top: 1rem;
}
.nav-heading:first-of-type {
  margin-top: 0;
}
.navigation a {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  transition:
    background-color 0.2s,
    color 0.2s;
  font-size: 1rem;
}
.navigation a:hover {
  background-color: var(--color-surface-mute);
  color: var(--color-soft-cream);
}
.navigation a.router-link-exact-active {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
  font-weight: 600;
}
.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
  padding-top: 1rem;
}
.footer-link,
.logout-button {
  background-color: var(--color-surface-mute);
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  color: var(--color-text-light);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  transition:
    background-color 0.2s,
    color 0.2s;
}
.footer-link:hover {
  background-color: var(--color-slate-gray);
  color: var(--color-soft-cream);
  border-color: var(--color-slate-gray);
}
.logout-button:hover {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
  border-color: var(--color-danger);
}
</style>
