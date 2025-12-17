import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'

export default class Transaction extends Model {
  static table = 'transactions'

  @field('customer_id') customerId
  @field('amount') amount
  @field('type') type
  @field('remarks') remarks
  @field('pharmacy_id') pharmacyId
  @field('sale_id') saleId
  @field('user_id') userId
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt

  @relation('customers', 'customer_id') customer
  @relation('sales', 'sale_id') sale
}
