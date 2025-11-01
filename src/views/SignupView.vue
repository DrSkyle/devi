<template>
  <div class="signup-container">
    <div class="card signup-card">
      <div class="card-header">
        <h1 class="title">D.E.V.I</h1>
        <p class="subtitle"></p>
      </div>

      <form @submit.prevent="signUp">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input id="email" type="email" placeholder="you@example.com" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Choose a secure password"
            v-model="password"
            required
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="card-footer">
        <p>Already have an account? <RouterLink to="/login">Sign In</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const router = useRouter()
const notification = useNotificationStore()

const signUp = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      // Add custom data to the user's session on signup
      data: {
        user_role: 'admin', // Mark them as an admin from the start
      },
    },
  })

  if (error) {
    errorMessage.value = error.message
  } else {
    notification.showNotification('Account created! Please check your email to verify.')
    router.push('/profile-setup')
  }
  isLoading.value = false
}
</script>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}
.signup-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  /* Stained glass effect hint */
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
  margin-bottom: 0.5rem;
}
.subtitle {
  color: var(--color-text-light);
}
.form-group {
  text-align: left;
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-light-slate);
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
.back-link:hover {
  color: var(--color-primary);
}
</style>
