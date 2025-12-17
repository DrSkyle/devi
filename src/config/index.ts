export const config = {
  // Application details
  appName: 'Devi Pharmacy Manager',
  version: '1.0.0',

  // Feature Flags
  features: {
    cloudRelay: import.meta.env.VITE_ENABLE_CLOUD_RELAY === 'true',
    meshSync: import.meta.env.VITE_ENABLE_MESH_SYNC === 'true',
    adminCloudSync: false, // Future use
    defaultPharmacyId: 'sharma-pharma', // Fallback for dev/demo
  },


  // Mesh Network Control
  mesh: {
    signalingUrls: [
      'ws://localhost:4444', // Local fallback for offline dev/LAN
      'wss://signaling.yjs.dev', // Public Demo Server 1
      'wss://y-webrtc-signaling-eu.herokuapp.com', // Public Demo Server 2
      'wss://y-webrtc-signaling-us.herokuapp.com' // Public Demo Server 3
    ]
  },

  // API Endpoints
  api: {
    workerUrl: import.meta.env.VITE_WORKER_URL || 'http://localhost:8787',
  },

  // Database
  db: {
    name: 'devi_db',
  },
}
