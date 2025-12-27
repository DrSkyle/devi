import { v4 as uuidv4 } from 'uuid'
import * as Y from 'yjs'
// @ts-ignore
import { WebrtcProvider } from 'y-webrtc'
// @ts-ignore
import { IndexeddbPersistence } from 'y-indexeddb'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { encryptData, decryptData } from '@/utils/cipher'

// Network Events Interface
type NetworkEventCallback = (payload: any) => void

class NetworkService {
  private doc: Y.Doc
  private provider: WebrtcProvider
  private persistence: IndexeddbPersistence
  private awareness: any
  private callbacks: Map<string, NetworkEventCallback> = new Map()

  // Track connected peers
  private peers: Map<number, any> = new Map()

  constructor() {
     console.log('📡 Initializing Devi Real P2P Network...')

     // 1. Setup YJS Doc
     this.doc = new Y.Doc()

     // 2. Setup Persistence (Offline First)
     this.persistence = new IndexeddbPersistence('devi-network-v1', this.doc)

     // 3. Setup WebRTC Provider
     this.provider = new WebrtcProvider('devi-global-network-v1', this.doc, {
         signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
         password: null
     })

     this.awareness = this.provider.awareness

     this.initialize()
  }

  private initialize() {
     // A. Set Local Awareness State
     const initialState = {
         user: {
             name: 'My Pharmacy',
             id: uuidv4().slice(0, 8),
             color: '#' + Math.floor(Math.random()*16777215).toString(16)
         },
         location: { lat: 27.7172, lng: 85.3240 }
     }

     this.awareness.setLocalState(initialState)

     if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition((pos) => {
             this.awareness.setLocalState({
                 ...this.awareness.getLocalState(),
                 location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
             })
         }, (err) => {
             console.warn('Geolocation access denied, using default location.')
         })
     }

     // B. Listen for Peers Joining/Leaving
     this.awareness.on('change', () => {
         const states = this.awareness.getStates()
         this.peers.clear()
         states.forEach((state: any, clientId: number) => {
             if (clientId !== this.awareness.clientID && state.user) {
                 this.peers.set(clientId, state)

                 // Handle Events
                 this.handlePeerUpdate(state, clientId)
             }
         })
     })

     this.doc.on('update', (_update: Uint8Array, origin: any) => {
         if (origin !== this) {
             // Incoming update from network
         }
     })
  }

  // --- DEVICE PAIRING / HANDSHAKE ---
  private activeInviteCode: string | null = null
  private onHandshakeSuccess: ((data: any) => void) | null = null

  startHosting(inviteCode: string) {
      this.activeInviteCode = inviteCode
      this.awareness.setLocalState({
          ...this.awareness.getLocalState(),
          isHost: true,
          hostId: this.doc.clientID
      })
  }

  joinAsGuest(inviteCode: string, onSuccess: (data: any) => void) {
      this.activeInviteCode = inviteCode
      this.onHandshakeSuccess = onSuccess
      this.awareness.setLocalState({
          ...this.awareness.getLocalState(),
          isGuest: true,
          lookingForHost: true,
          inviteCode: inviteCode
      })
  }

  // Configuration for Host Mode
  private hostConfig: any = null

  setHostConfig(config: any) {
      this.hostConfig = config
  }

  private handleHandshake(remoteState: any, clientId: number) {
      const myState = this.awareness.getLocalState()

      // CASE 1: Host Logic
      if (this.activeInviteCode && myState.isHost && remoteState.isGuest && remoteState.inviteCode === this.activeInviteCode) {
         if (!this.hostConfig) return

         this.awareness.setLocalState({
             ...myState,
             handshakeResponse: {
                 targetClientId: clientId,
                 success: true,
                 pharmacyId: this.hostConfig.pharmacyId,
                 pharmacyName: this.hostConfig.pharmacyName,
                 pharmacyCode: this.hostConfig.pharmacyCode
             }
         })

         setTimeout(() => {
             const s = this.awareness.getLocalState()
             delete s.handshakeResponse
             this.awareness.setLocalState(s)
         }, 5000)
      }

      // CASE 2: Guest Logic
      if (this.onHandshakeSuccess && myState.isGuest && remoteState.handshakeResponse) {
          if (remoteState.handshakeResponse.targetClientId === this.doc.clientID) {
              this.onHandshakeSuccess(remoteState.handshakeResponse)
              this.activeInviteCode = null
              this.onHandshakeSuccess = null
              const s = this.awareness.getLocalState()
              delete s.isGuest
              delete s.inviteCode
              this.awareness.setLocalState(s)
          }
      }
  }

  // --- DECOL-NET: DECENTRALIZED SEARCH ---

  async searchNetwork(query: string, myPharmacyId: number, lat: number, lng: number): Promise<any> {
     console.log(`📡 Network Search: ${query}`)
     const demandId = uuidv4()
     const results: any[] = []

     // 1. Broadcast Demand
     this.awareness.setLocalState({
         ...this.awareness.getLocalState(),
         searchDemand: {
             id: demandId,
             query: encryptData(query),
             timestamp: Date.now(),
             requesterId: this.doc.clientID
         }
     })

     // 2. Listen for Offers
     return new Promise((resolve) => {
         const resultCollector = () => {
             const states = this.awareness.getStates()
             states.forEach((state: any) => {
                 if (state.searchOffer && state.searchOffer.targetDemandId === demandId) {
                     if (!results.some(r => r.pharmacy_id === state.user.id)) {
                         results.push({
                             id: state.searchOffer.itemId,
                             name: state.searchOffer.name,
                             brand_name: state.searchOffer.brand,
                             quantity: state.searchOffer.qty,
                             pharmacy_name: state.user.name,
                             pharmacy_id: state.user.id,
                             price: state.searchOffer.price,
                             city: state.user.city || 'Devi Network',
                             dist: '0.5km'
                         })
                     }
                 }
             })
         }

         this.awareness.on('change', resultCollector)

         setTimeout(() => {
             const s = this.awareness.getLocalState()
             delete s.searchDemand
             this.awareness.setLocalState(s)
             this.awareness.off('change', resultCollector)
             resolve({ city_results: results, district_results: [] })
         }, 2500)
     })
  }



  private async processIncomingDemand(demand: any, requesterClientId: number, requesterUser: any) {
      if (requesterClientId === this.doc.clientID) return

      let query = demand.query
      try {
         const d = decryptData(demand.query)
         if (d) query = d
      } catch {}

      if (!query) return

      const inventory = database.collections.get('inventory')
      try {
         const allItems = await inventory.query().fetch()
         // Note: Insolvent search for V1 due to encryption
         const matches = allItems.filter((item: any) => {
             const name = decryptData(item.name).toLowerCase()
             const brand = decryptData(item.brandName).toLowerCase()
             const q = query.toLowerCase()
             return (name.includes(q) || brand.includes(q)) && item.quantity > 0
         })

         if (matches.length > 0) {
             const bestMatch = matches[0]
             console.log(`💡 Stock Found for "${query}". Replying...`)

             this.awareness.setLocalState({
                 ...this.awareness.getLocalState(),
                 searchOffer: {
                     targetDemandId: demand.id,
                     itemId: bestMatch.id,
                     name: demand.query,
                     brand: bestMatch.brandName,
                     qty: bestMatch.quantity,
                     price: bestMatch.sellingPrice
                 }
             })

             setTimeout(() => {
                 const s = this.awareness.getLocalState()
                 delete s.searchOffer
                 this.awareness.setLocalState(s)
             }, 3000)
         }
      } catch (e) {
          console.error("Error processing demand", e)
      }
  }

  // --- PULSE SYNC (WALK-BY) ---

   async sendToAdmin(packet: any): Promise<boolean> {
       console.log('📡 Sending Pulse to Admin...')
       if (this.peers.size === 0) {
           console.warn('❌ No peers connected.')
           return false
       }

       // Broadcast Pulse via Awareness
       this.awareness.setLocalState({
           ...this.awareness.getLocalState(),
           outgoingPulse: packet
       })

       // Clear it after 2s
       setTimeout(() => {
           const s = this.awareness.getLocalState()
           delete s.outgoingPulse
           this.awareness.setLocalState(s)
       }, 2000)

       return true
   }

   on(event: string, cb: NetworkEventCallback) {
       this.callbacks.set(event, cb)
   }

   off(event: string) {
       this.callbacks.delete(event)
   }

   private async handlePeerUpdate(remoteState: any, clientId: number) {
       this.handleHandshake(remoteState, clientId)

       if (remoteState.searchDemand) {
           await this.processIncomingDemand(remoteState.searchDemand, clientId, remoteState.user)
       }

       if (remoteState.outgoingPulse) {
           // Received a pulse from a peer
           const cb = this.callbacks.get('pulse_received')
           if (cb) {
              console.log('📥 Received Pulse Packet from', clientId)
              cb(remoteState.outgoingPulse)
           }
       }
   }

  async requestTransfer(inventoryId: string, fromId: number, toId: number, qty: number, priority: string) {
       console.log(`📨 Sending Transfer Request to ${fromId}...`)
       // In V2: Send P2P message. For now, just log.
       return true
  }

  async getNearbyPharmacies(lat: number, long: number, radiusKm: number) {
      return Array.from(this.peers.values()).map(p => ({
          name: p.user.name,
          distance: '0.1km',
          stock: true,
          price: 0
      }))
  }

  cleanup() {
      this.provider.destroy()
  }
}

export const networkService = new NetworkService()
