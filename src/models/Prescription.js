import { Model } from '@nozbe/watermelondb'
import { text, date, readonly, json, relation } from '@nozbe/watermelondb/decorators'

export default class Prescription extends Model {
  static table = 'prescriptions'

  @text('customer_id') customerId
  @text('patient_name') patientName
  @text('doctor_name') doctorName
  @json('items', (raw) => {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch (e) {
        console.warn('Failed to parse Prescription items:', raw)
        return []
      }
    }
    return raw || []
  })
  items
  @text('status') status
  @text('pharmacy_id') pharmacyId
  @text('user_id') userId
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt

  @relation('customers', 'customer_id') customer
}
