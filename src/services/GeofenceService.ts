import { getDistance } from 'geolib'

export class GeofenceService {
  // Default radius in meters
  static DEFAULT_RADIUS = 100

  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    })
  }

  static isWithinRange(
    userLocation: { latitude: number; longitude: number },
    targetLocation: { latitude: number; longitude: number },
    radius: number = this.DEFAULT_RADIUS,
  ): boolean {
    if (!targetLocation.latitude || !targetLocation.longitude) return true // Bypass if no target set

    const distance = getDistance(userLocation, targetLocation)
    return distance <= radius
  }
}
