<template>
  <div class="modal-overlay">
    <div class="modal-content card">
      <h2>Set Your Pharmacy Code</h2>
      <p>
        To enable your staff to log in, you must create a unique, memorable code for your pharmacy.
        This can only be done once.
      </p>
      <form @submit.prevent="savePharmacyCode">
        <div class="form-group">
          <label for="pharmacyCode">New Pharmacy Code</label>
          <input
            id="pharmacyCode"
            type="text"
            v-model="pharmacyCodeInput"
            required
            placeholder="e.g., amritmeds (no spaces)"
          />
          <p class="input-help">
            This is what your staff will use to log in. It cannot be changed.
          </p>
        </div>
        <p v-if="errorMessage" class="error-message" v-html="errorMessage"></p>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : 'Save and Continue' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getFirestore, doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'
import { db } from '../db'

const emit = defineEmits(['code-set'])
const profileStore = useProfileStore()
const notification = useNotificationStore()

const pharmacyCodeInput = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const savePharmacyCode = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const firestore = getFirestore()
    const formattedCode = pharmacyCodeInput.value.toLowerCase().trim()

    if (!formattedCode || formattedCode.length < 3) {
      throw new Error('Pharmacy Code must be at least 3 characters long.')
    }

    const q = query(collection(firestore, 'pharmacies'), where('pharmacyCode', '==', formattedCode))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // --- SUGGESTION LOGIC ---
      const suggestion1 = `${formattedCode}${Math.floor(Math.random() * 90 + 10)}`
      const suggestion2 = `${formattedCode}_pharma`
      throw new Error(
        `Code "${formattedCode}" is taken.<br/>Try: <strong>${suggestion1}</strong> or <strong>${suggestion2}</strong>`,
      )
    }

    const privateDocRef = doc(
      firestore,
      'users',
      profileStore.userId,
      'profiles',
      profileStore.userId,
    )
    const publicDocRef = doc(firestore, 'pharmacies', profileStore.pharmacyId)

    await Promise.all([
      updateDoc(privateDocRef, { pharmacyCode: formattedCode }),
      updateDoc(publicDocRef, { pharmacyCode: formattedCode }),
      db.profiles.update(profileStore.userId, { pharmacyCode: formattedCode }),
    ])

    profileStore.setProfile({ ...profileStore.$state, pharmacyCode: formattedCode })

    notification.showNotification('Pharmacy Code has been set!', 'success')
    emit('code-set')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Styles remain the same */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 10, 20, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}
.modal-content {
  width: 100%;
  max-width: 500px;
  margin: 1rem;
}
.input-help {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: 0.5rem;
}
.error-message {
  color: var(--color-danger);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
</style>
