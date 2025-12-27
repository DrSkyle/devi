import { Model } from '@nozbe/watermelondb'
import { text, field, date, readonly, json, relation } from '@nozbe/watermelondb/decorators'

export default class Return extends Model {
  static table = 'returns'

  @text('sale_id') saleId
  @text('customer_id') customerId
  @text('pharmacy_id') pharmacyId
  @json('items', (raw) => JSON.parse(raw)) items
  @field('total_refund') totalRefund
  @text('reason') reason
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt

  @relation('sales', 'sale_id') sale
  @relation('customers', 'customer_id') customer
}
