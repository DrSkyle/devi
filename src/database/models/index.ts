import { Model } from '@nozbe/watermelondb'
import { field, date, json, text, readonly } from '@nozbe/watermelondb/decorators'

export class Pharmacy extends Model {
  static table = 'pharmacies'

  @text('name') name!: string
  @text('pharmacy_code') pharmacyCode!: string
  @text('address') address!: string
  @text('phone') phone!: string
  @text('pan_number') panNumber!: string
  @text('vat_number') vatNumber!: string
  @text('province') province!: string
  @text('district') district!: string
  @text('city') city!: string
  @text('tole') tole!: string
  @field('latitude') latitude!: number
  @field('longitude') longitude!: number
  @text('owner_id') ownerId!: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}

export class Profile extends Model {
  static table = 'profiles'

  @text('user_id') userId
  @text('name') name
  @text('email') email
  @text('role') role
  @text('status') status
  @text('pharmacy_id') pharmacyId
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class Staff extends Model {
  static table = 'staff'

  @text('pharmacy_id') pharmacyId
  @text('name') name
  @text('role') role
  @text('pin_hash') pinHash
  @text('email') email
  @text('phone') phone
  @text('employee_id') employeeId
  @field('is_active') isActive
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class Customer extends Model {
  static table = 'customers'

  @text('pharmacy_id') pharmacyId
  @text('name') name
  @text('phone') phone
  @text('address') address
  @text('allergies') allergies
  @field('balance') balance
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class Supplier extends Model {
  static table = 'suppliers'

  @text('pharmacy_id') pharmacyId
  @text('name') name
  @text('phone') phone
  @field('balance') balance
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class Inventory extends Model {
  static table = 'inventory'

  @text('pharmacy_id') pharmacyId!: string
  @text('supplier_id') supplierId!: string
  @text('name') name!: string
  @text('brand_name') brandName!: string
  @text('form') form!: string
  @text('category') category!: string
  @text('shelf_location') shelfLocation!: string
  @field('quantity') quantity!: number
  @text('batch_no') batchNo!: string
  @field('purchase_price') purchasePrice!: number
  @field('selling_price') sellingPrice!: number
  @field('vat_percent') vatPercent!: number
  @date('expiry_date') expiryDate!: number
  @field('is_controlled') isControlled!: boolean
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}

export class Sale extends Model {
  static table = 'sales'

  @text('pharmacy_id') pharmacyId!: string
  @text('customer_id') customerId!: string
  @text('staff_name') staffName!: string
  @text('bill_number') billNumber!: string
  @json('items', (raw: any) => {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch (e) {
        console.warn('Failed to parse Sale items:', raw)
        return []
      }
    }
    return raw || []
  })
  items!: any[]
  @field('subtotal') subtotal!: number
  @field('discount') discount!: number
  @field('tax_total') taxTotal!: number
  @field('total') total!: number
  @text('status') status!: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}

export class Notification extends Model {
  static table = 'notifications'

  @text('pharmacy_id') pharmacyId
  @text('message') message
  @text('created_by') createdBy
  @field('is_active') isActive
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class UnmetDemand extends Model {
  static table = 'unmet_demand'

  @text('pharmacy_id') pharmacyId
  @text('query') query
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class DdaLog extends Model {
  static table = 'dda_logs'

  @text('pharmacy_id') pharmacyId
  @text('medicine_name') medicineName
  @field('quantity_dispensed') quantityDispensed
  @text('patient_name') patientName
  @text('doctor_name') doctorName
  @text('staff_name') staffName
  @text('sale_id') saleId
  @text('previous_hash') previousHash
  @text('current_hash') currentHash
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export class AppMeta extends Model {
  static table = 'app_meta'

  @text('key') key
  @json('value', (raw) => {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch (e) {
        console.warn('Failed to parse AppMeta value:', raw)
        return {}
      }
    }
    return raw || {}
  })
  value
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}

export { default as Transaction } from '@/models/Transaction'
export { default as Prescription } from '@/models/Prescription'
export { default as Return } from '@/models/Return'
export { default as Shift } from '@/models/Shift'

// Change-log / sync operation model
export class SyncOp extends Model {
  static table = 'sync_ops'

  @text('pharmacy_id') pharmacyId!: string
  @text('device_id') deviceId!: string
  @text('type') type!: string
  @text('entity') entity!: string
  @text('entity_id') entityId!: string
  @text('payload') payload!: string
  @text('direction') direction!: string
  @text('status') status!: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}

export class Task extends Model {
  static table = 'tasks'

  @text('pharmacy_id') pharmacyId!: string
  @text('title') title!: string
  @text('description') description!: string
  @text('status') status!: string
  @text('priority') priority!: string
  @text('assigned_to') assignedTo!: string
  @date('due_date') dueDate!: number
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
