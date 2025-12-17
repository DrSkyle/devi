import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { networkService } from '@/services/NetworkService'

class LiquidationService {
  /**
   * Scans for items expiring within the given days threshold.
   */
  async getExpiringItems(daysThreshold: number = 90) {
    const now = Date.now()
    const future = now + daysThreshold * 24 * 60 * 60 * 1000

    // Query local WatermelonDB for expiring items
    const items = await database.get('inventory')
      .query(
        Q.where('expiry_date', Q.between(now, future)),
        Q.where('quantity', Q.gt(0))
      )
      .fetch()

    return items
  }

  /**
   * Calculates the recommended liquidation price (default 50% off).
   */
  getRecommendedPrice(currentPrice: number, discountPercent: number = 50) {
    return Math.floor(currentPrice * ((100 - discountPercent) / 100))
  }

  /**
   * Broadcasts a liquidation offer to the Devi Network.
   */
  async broadcastLiquidation(item: any, discountPercent: number) {
    const offerPrice = this.getRecommendedPrice(item.selling_price, discountPercent)
    
    const payload = {
        itemId: item.id,
        name: item.name,
        brand: item.brand_name,
        expiryDate: item.expiry_date,
        quantity: item.quantity,
        originalPrice: item.selling_price,
        offerPrice: offerPrice,
        discount: discountPercent,
        pharmacyId: 'MY_PHARMACY_ID' // TODO: Get from store
    }

    // Use NetworkService to send the signal
    await networkService.broadcastLiquidation(payload)

    return payload
  }
}

export const liquidationService = new LiquidationService()
