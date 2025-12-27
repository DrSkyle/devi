import { BaseRepository } from './BaseRepository'
import { Customer } from '@/database/models'
import { Q } from '@nozbe/watermelondb'

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers')
  }

  async findByPhone(phone: string) {
    const customers = await this.query(Q.where('phone', phone))
    return customers.length > 0 ? customers[0] : null
  }

  async search(query: string) {
    return this.query(
      Q.or(Q.where('name', Q.like(`%${query}%`)), Q.where('phone', Q.like(`%${query}%`))),
    )
  }
}

export const customerRepository = new CustomerRepository()
