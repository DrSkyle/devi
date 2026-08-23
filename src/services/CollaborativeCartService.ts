import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useCartStore } from '@/features/cart/store'

class CollaborativeCartService {
  private doc: Y.Doc
  private provider: WebrtcProvider | null = null
  private yCart: Y.Array<any>
  private isConnected = false
  private cartStore: any

  constructor() {
    this.doc = new Y.Doc()
    this.yCart = this.doc.getArray('cart-items')
    this.cartStore = useCartStore()
  }

  connect(roomName: string = 'devi-pos-cart') {
    if (this.isConnected) return

    console.log(`Connecting to Multiplayer Cart Room: ${roomName}`)
    // Use public signaling servers for demo purposes
    this.provider = new WebrtcProvider(roomName, this.doc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com',
      ],
    })

    this.isConnected = true

    // Sync incoming changes from Yjs to Pinia
    this.yCart.observe(() => {
      if (!this.isConnected) return
      console.log('Remote cart update received')
      const newItems = this.yCart.toArray()

      // Avoid infinite loop if we just updated Yjs ourselves
      // Simple check: if length matches and IDs match, skip?
      // For now, we just overwrite local cart with remote cart if they differ significantly
      // or we can just set it.

      // We need to be careful not to overwrite local work in progress if we are the ones typing.
      // But for a cart, "last write wins" on the array is usually fine.

      // We'll just replace the store items.
      // Note: This might cause UI jumps if not handled carefully.

      // Check if deep equal to avoid unnecessary updates
      if (JSON.stringify(this.cartStore.items) !== JSON.stringify(newItems)) {
        this.cartStore.items = newItems
      }
    })
  }

  disconnect() {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
    }
    this.isConnected = false
    console.log('Disconnected from Multiplayer Cart')
  }

  // Call this when local cart changes to push to Yjs
  updateRemoteCart(items: any[]) {
    if (!this.isConnected) return

    // We replace the entire Yjs array content with the new state
    // This is a naive approach but works for small arrays like a cart.
    // A better approach would be to apply specific deltas (add/remove).

    this.doc.transact(() => {
      this.yCart.delete(0, this.yCart.length)
      this.yCart.insert(0, items)
    })
  }
}

export const collaborativeCart = new CollaborativeCartService()
