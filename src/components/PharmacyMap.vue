<template>
  <Card class="map-container surface-card shadow-2 border-round-xl">
    <template #title>
      <div class="flex align-items-center gap-2">
        <i class="pi pi-map text-primary text-xl"></i>
        <span>Pharmacies Nearby (Devi Circle)</span>
      </div>
    </template>
    <template #content>
      <div ref="mapElement" class="map-element w-full border-round" style="height: 350px"></div>
      <div v-if="!centerCoordinates && !isLoading" class="text-center p-3 text-600 font-italic">
        Your pharmacy location not set. Cannot display map.
      </div>
      <div
        v-else-if="nearbyPharmacies.length === 0 && !isLoading && centerCoordinates"
        class="text-center p-3 text-600 font-italic"
      >
        No other pharmacies found within {{ circleRadiusKm }}km.
      </div>
      <div v-if="isLoading" class="text-center p-3 text-600 font-italic">
        <i class="pi pi-spin pi-spinner mr-2"></i> Loading map data...
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet' // Import Leaflet library
import 'leaflet/dist/leaflet.css' // Import Leaflet's CSS
import { networkService } from '@/services/NetworkService'
import { useProfileStore } from '@/stores/profile' // Your Pinia store for profile data
import Card from 'primevue/card'

const profileStore = useProfileStore()
const mapElement = ref(null) // Template ref for the map div
let mapInstance = null // Holds the Leaflet map object
let markersLayer = null // Holds the layer group for markers

const centerCoordinates = ref(null) // [latitude, longitude] for the current pharmacy
const nearbyPharmacies = ref([]) // Array to store fetched nearby pharmacies
const isLoading = ref(true) // Loading state flag
const circleRadiusKm = ref(5) // Radius for the "Devi Circle" in kilometers

// --- Function to fetch map data (own location + nearby pharmacies) ---
const fetchMapData = async () => {
  isLoading.value = true
  nearbyPharmacies.value = []
  centerCoordinates.value = null

  const currentPharmacyId = parseInt(profileStore.pharmacyId, 10)
  // Use latitude/longitude directly from the profile store (assuming it's populated correctly)
  const currentLat = profileStore.latitude
  const currentLon = profileStore.longitude

  // Mock location if missing (for dev/demo)
  if (currentLat == null || currentLon == null) {
      console.warn('Location missing, defaulting to Kathmandu center')
      centerCoordinates.value = [27.7172, 85.3240] 
  } else {
      centerCoordinates.value = [currentLat, currentLon]
  }

  try {
    // Call the Network Service (P2P Discovery)
    const peers = await networkService.getNearbyPharmacies(
        centerCoordinates.value[0], 
        centerCoordinates.value[1], 
        circleRadiusKm.value
    )

    nearbyPharmacies.value = peers || []
    initOrUpdateMap()
    
  } catch (error) {
    console.error('Error fetching nearby pharmacies:', error)
  } finally {
    isLoading.value = false
  }
}

// --- Function to initialize or update the Leaflet map ---
const initOrUpdateMap = () => {
  // Ensure the map container element exists and we have center coordinates
  if (!mapElement.value || !centerCoordinates.value) return

  // --- Initialize Map ---
  if (!mapInstance) {
    mapInstance = L.map(mapElement.value).setView(centerCoordinates.value, 13) // Zoom level 13 (adjust as needed)

    // Add the base map tiles (OpenStreetMap is free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance)

    // Create a layer group to hold markers for easy clearing
    markersLayer = L.layerGroup().addTo(mapInstance)

    // --- Add Marker for Current Pharmacy ---
    // Custom icon (optional, otherwise uses default blue marker)
    const selfIcon = L.icon({
      iconUrl:
        'data:image/svg+xml;base64,' +
        btoa(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
        ), // Simple orange marker SVG
      iconSize: [36, 36],
      iconAnchor: [18, 36], // Point of the icon which corresponds to marker's location
      popupAnchor: [0, -38], // Point from which the popup should open relative to the iconAnchor
    })

    L.marker(centerCoordinates.value, { icon: selfIcon })
      .addTo(markersLayer) // Add to the layer group
      .bindPopup(`<b>Your Pharmacy</b><br>${profileStore.name}`)
      .openPopup() // Open popup by default
  } else {
    // --- Update Existing Map ---
    mapInstance.setView(centerCoordinates.value, 13) // Re-center the map
    markersLayer.clearLayers() // Clear old markers

    // Re-add self marker (important after clearing layers)
    L.marker(centerCoordinates.value, {
      /* icon: selfIcon */
    }) // Use default or selfIcon again
      .addTo(markersLayer)
      .bindPopup(`<b>Your Pharmacy</b><br>${profileStore.name}`)
    // Optionally re-open popup: .openPopup();
  }

  // --- Add Markers for Nearby Pharmacies ---
  nearbyPharmacies.value.forEach((pharmacy) => {
    // The RPC function `find_nearby_pharmacies` needs to return latitude and longitude
    // Let's assume it returns `latitude` and `longitude` fields directly
    if (pharmacy.latitude != null && pharmacy.longitude != null) {
      const distanceKm = (pharmacy.distance_meters / 1000).toFixed(1)
      L.marker([pharmacy.latitude, pharmacy.longitude]) // Default blue icon
        .addTo(markersLayer) // Add to the layer group
        .bindPopup(`<b>${pharmacy.name}</b><br>${pharmacy.city || ''}<br>~${distanceKm} km away`)
    } else {
      console.warn(`Pharmacy ${pharmacy.name} (ID: ${pharmacy.id}) is missing coordinates.`)
    }
  })
}

// --- Lifecycle Hooks ---
onMounted(() => {
  // Wait a tick ensures the mapElement ref is available in the DOM
  // then fetch data which will initialize the map
  if (profileStore.pharmacyId && profileStore.latitude && profileStore.longitude) {
    fetchMapData()
  } else {
    isLoading.value = false // Cannot load if profile data is missing
    console.warn('Cannot fetch map data: Pharmacy ID or location missing in profile store.')
  }
})

onBeforeUnmount(() => {
  // Clean up the map instance when the component is destroyed
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

// --- Watcher ---
// Re-fetch map data if the pharmacy ID or location changes (e.g., after profile setup/update)
watch(
  () => [profileStore.pharmacyId, profileStore.latitude, profileStore.longitude],
  ([newId, newLat, newLon], [oldId, oldLat, oldLon]) => {
    // Fetch only if relevant data exists and has actually changed
    if (
      newId &&
      newLat != null &&
      newLon != null &&
      (newId !== oldId || newLat !== oldLat || newLon !== oldLon)
    ) {
      console.log('Profile data changed, refreshing map data...')
      fetchMapData()
    } else if (!newId || newLat == null || newLon == null) {
      // Handle case where profile data becomes invalid
      centerCoordinates.value = null
      nearbyPharmacies.value = []
      if (mapInstance) markersLayer?.clearLayers() // Clear map if profile is invalid
      isLoading.value = false
    }
  },
  { immediate: false }, // Don't run immediately, let onMounted handle initial load
)
</script>

<style scoped>
/* Leaflet Popup Styling (Optional - Customize default popups) */
:deep(.leaflet-popup-content-wrapper) {
  background-color: var(--surface-card) !important;
  color: var(--text-color) !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
}
:deep(.leaflet-popup-content) {
  margin: 10px 15px !important;
  font-size: 0.9rem !important;
  line-height: 1.4 !important;
}
:deep(.leaflet-popup-tip) {
  background-color: var(--surface-card) !important;
}
:deep(.leaflet-popup-close-button) {
  color: var(--text-color-secondary) !important;
  padding: 6px 6px 0 0 !important;
}
:deep(.leaflet-popup-close-button:hover) {
  color: var(--primary-color) !important;
}
</style>
