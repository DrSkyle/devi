import { Database, Model, Collection, Query } from '@nozbe/watermelondb'
import { database } from '@/database'

export class BaseRepository<T extends Model> {
  protected collection: Collection<T>

  constructor(tableName: string) {
    this.collection = database.collections.get<T>(tableName)
  }

  async find(id: string): Promise<T> {
    return await this.collection.find(id)
  }

  async create(recordBuilder: (record: T) => void): Promise<T> {
    return await database.write(async () => {
      return await this.collection.create(recordBuilder)
    })
  }

  async update(id: string, recordUpdater: (record: T) => void): Promise<T> {
    const record = await this.find(id)
    return await database.write(async () => {
      await record.update(recordUpdater)
      return record
    })
  }

  async delete(id: string): Promise<void> {
    const record = await this.find(id)
    return await database.write(async () => {
      await record.markAsDeleted() // Syncable delete
    })
  }

  query(...clauses: any[]) {
    return this.collection.query(...clauses)
  }
}
