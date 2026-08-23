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
      'wss://devi-signal.onrender.com', // Your Live Signaling Server (Render)
      'wss://signaling.yjs.dev' // Backup public server
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
