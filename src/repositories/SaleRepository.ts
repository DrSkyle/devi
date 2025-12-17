import { BaseRepository } from './BaseRepository'
import { Sale, Inventory, Customer } from '@/database/models'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { addMoney } from '@/utils/currency'

export class SaleRepository extends BaseRepository<Sale> {
  constructor() {
    super('sales')
  }

  async findByBillNumber(billNumber: string) {
    const sales = await this.query(Q.where('bill_number', billNumber))
    return sales.length > 0 ? sales[0] : null
  }

  async getRecentSales(limit: number = 50) {
    return this.query(Q.sortBy('created_at', Q.desc), Q.take(limit))
  }

  async getSalesByDateRange(startDate: number, endDate: number) {
    return this.query(
      Q.where('created_at', Q.between(startDate, endDate)),
      Q.sortBy('created_at', Q.desc),
    )
  }

  async createSale(saleData: any, cartItems: any[], customerId: string | null) {
    return await database.write(async () => {
      // 1. Create Sale Record
      const newSale = await this.collection.create((sale: any) => {
        sale.pharmacyId = saleData.pharmacyId
        sale.customerId = saleData.customerId
        sale.staffName = saleData.staffName
        sale.billNumber = saleData.billNumber
        sale.items = saleData.items
        sale.subtotal = saleData.subtotal
        sale.discount = saleData.discount
        sale.taxTotal = saleData.taxTotal
        sale.total = saleData.total
        sale.status = saleData.status
        sale.createdAt = saleData.createdAt
        sale.updatedAt = saleData.createdAt
      })

      // 2. Update Inventory Stock
      const inventoryCollection = database.collections.get<Inventory>('inventory')
      for (const item of cartItems) {
        const inventoryItem = await inventoryCollection.find(item.id)
        await inventoryItem.update((record: any) => {
          record.quantity -= item.qty
        })
      }

      // 3. Update Customer Balance (if Credit)
      if (customerId && saleData.paymentMethod === 'Credit') {
        const customerCollection = database.collections.get<Customer>('customers')
        const customer = await customerCollection.find(customerId)
        await customer.update((record: any) => {
          record.balance = addMoney(record.balance || 0, saleData.total)
        })
      }

      return newSale
    })
  }
}

export const saleRepository = new SaleRepository()
