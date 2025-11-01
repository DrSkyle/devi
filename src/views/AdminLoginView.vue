<template>
  <div class="login-container">
    <div class="card login-card">
      <div class="card-header">
        <h1 class="title">Admin Login</h1>
        <p class="subtitle">Log in to manage your pharmacy.</p>
      </div>
      <form @submit.prevent="logIn">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input id="email" type="email" placeholder="you@example.com" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" v-model="password" required />
        </div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>
      <div class="card-footer">
        <p>Are you a staff member? <RouterLink to="/login">Use Pharmacy Code</RouterLink></p>
        <p>Don't have an account? <RouterLink to="/signup">Create Pharmacy</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { db } from '../db'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const router = useRouter()
const notification = useNotificationStore()

const logIn = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = 'Invalid email or password.'
  } else {
    // You can add logic here to sync data after login if needed
    notification.showNotification('Admin login successful!', 'success')
    router.push('/')
  }
  isLoading.value = false
}
</script>

<style scoped>
/* Styles remain the same */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  background-color: rgba(45, 55, 72, 0.8);
  backdrop-filter: blur(10px);
}
.card-header {
  margin-bottom: 2.5rem;
}
.title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
}
.form-group {
  text-align: left;
  margin-bottom: 1.5rem;
}
.error-message {
  color: var(--color-danger);
  margin-bottom: 1.5rem;
}
.card-footer {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.card-footer a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
.card-footer a:hover {
  text-decoration: underline;
}
</style>
