import { Centrifuge } from 'centrifuge'
import { useNotificationStore } from '@/stores/notification'
import { useStaffStore } from '@/stores/staff'
import { useProfileStore } from '@/stores/profile'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

class DDAService {
  constructor() {
    this.centrifuge = null
    this.subscription = null
  }

  connect() {
    const profile = useProfileStore()
    const staff = useStaffStore()
    
    // Only Pharmacists or Owners should receive the push notifications for approvals
    if (staff.activeUserRole !== 'PHARMACIST' && staff.activeUserRole !== 'OWNER') {
      return
    }

    if (!profile.pharmacyId) return

    // In a real app, you would fetch a JWT connection token from your backend.
    // Here we use the raw API endpoint with the unsecure token for demo/local infrastructure
    this.centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket')

    this.centrifuge.on('connected', (ctx) => {
      console.log('Centrifugo connected', ctx)
    })

    const channel = `dda_approvals:${profile.pharmacyId}`
    this.subscription = this.centrifuge.newSubscription(channel)

    this.subscription.on('publication', async (ctx) => {
      const payload = ctx.data
      if (payload.type === 'dda_approval_required') {
        const notification = useNotificationStore()
        
        try { await Haptics.impact({ style: ImpactStyle.Heavy }) } catch(e) {}
        
        notification.showNotification(`URGENT: DDA Approval Required for Sale #${payload.sale_id.split('-')[0]}`, 'warning')
        
        // This could trigger a global modal, or append to a Pinia store list of pending approvals
        this.triggerApprovalModal(payload)
      }
    })

    this.subscription.subscribe()
    this.centrifuge.connect()
  }

  triggerApprovalModal(payload) {
    // Dispatch to a Pinia store which triggers a global SimpleWebAuthn modal
    const event = new CustomEvent('dda-approval-requested', { detail: payload })
    window.dispatchEvent(event)
  }

  disconnect() {
    if (this.centrifuge) {
      this.centrifuge.disconnect()
    }
  }
}

export const ddaService = new DDAService()
