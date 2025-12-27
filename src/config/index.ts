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

  // API Endpoints
  api: {
    workerUrl: import.meta.env.VITE_WORKER_URL || 'http://localhost:8787',
  },

  // Database
  db: {
    name: 'devi_db',
  },
}
