import { BaseRepository } from './BaseRepository'
import { Inventory } from '@/database/models'
import { Q } from '@nozbe/watermelondb'

export class InventoryRepository extends BaseRepository<Inventory> {
  constructor() {
    super('inventory')
  }

  async findByName(name: string) {
    return await this.collection.query(Q.where('name', name)).fetch()
  }

  async findLowStock(threshold: number = 10) {
    return await this.collection.query(Q.where('quantity', Q.lte(threshold))).fetch()
  }

  async search(query: string) {
    return await this.collection
      .query(
        Q.or(Q.where('name', Q.like(`%${query}%`)), Q.where('brand_name', Q.like(`%${query}%`))),
      )
      .fetch()
  }
}

export const inventoryRepository = new InventoryRepository()
