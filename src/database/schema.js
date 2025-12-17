import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'pharmacies',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'pharmacy_code', type: 'string', isOptional: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'pan_number', type: 'string', isOptional: true },
        { name: 'vat_number', type: 'string', isOptional: true },
        { name: 'province', type: 'string', isOptional: true },
        { name: 'district', type: 'string', isOptional: true },
        { name: 'city', type: 'string', isOptional: true },
        { name: 'tole', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'owner_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' }, // Timestamps are usually numbers in WatermelonDB
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'profiles',
      columns: [
        { name: 'user_id', type: 'string' }, // Auth ID
        { name: 'name', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'role', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'pharmacy_id', type: 'string', isOptional: true }, // Relation
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'staff',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'pin_hash', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'employee_id', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'customers',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'allergies', type: 'string', isOptional: true },
        { name: 'balance', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'suppliers',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'balance', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'inventory',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'supplier_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'brand_name', type: 'string', isOptional: true },
        { name: 'form', type: 'string', isOptional: true },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'shelf_location', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'batch_no', type: 'string', isOptional: true },
        { name: 'purchase_price', type: 'number' },
        { name: 'selling_price', type: 'number' },
        { name: 'vat_percent', type: 'number' },
        { name: 'expiry_date', type: 'number', isOptional: true }, // Date as timestamp
        { name: 'is_controlled', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sales',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'customer_id', type: 'string', isOptional: true },
        { name: 'staff_name', type: 'string', isOptional: true },
        { name: 'bill_number', type: 'string' },
        { name: 'items', type: 'string' }, // JSON stringified
        { name: 'subtotal', type: 'number' },
        { name: 'discount', type: 'number' },
        { name: 'tax_total', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'shifts',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'staff_id', type: 'string', isOptional: true },
        { name: 'staff_name', type: 'string', isOptional: true },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'opening_float', type: 'number' },
        { name: 'closing_cash', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'start_lat', type: 'number', isOptional: true },
        { name: 'start_long', type: 'number', isOptional: true },
        { name: 'end_lat', type: 'number', isOptional: true },
        { name: 'end_long', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'created_by', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'unmet_demand',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'query', type: 'string' }, // Added query field
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'dda_logs',
      columns: [
        { name: 'pharmacy_id', type: 'string' },
        { name: 'medicine_name', type: 'string' },
        { name: 'quantity_dispensed', type: 'number', isOptional: true }, // inferred from usage
        { name: 'patient_name', type: 'string' },
        { name: 'doctor_name', type: 'string' },
        { name: 'staff_name', type: 'string' },
        { name: 'sale_id', type: 'string', isOptional: true },
        { name: 'previous_hash', type: 'string', isOptional: true },
        { name: 'current_hash', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'app_meta',
      columns: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' }, // JSON stringified
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'sale_id', type: 'string', isIndexed: true },
        { name: 'pharmacy_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' }, // cash, card, qr, credit
        { name: 'remarks', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'prescriptions',
      columns: [
        { name: 'pharmacy_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'doctor_name', type: 'string', isOptional: true },
        { name: 'patient_name', type: 'string' },
        { name: 'items', type: 'string' }, // JSON string
        { name: 'status', type: 'string' }, // pending, completed
        { name: 'user_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'returns',
      columns: [
        { name: 'sale_id', type: 'string', isIndexed: true },
        { name: 'pharmacy_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'items', type: 'string' }, // JSON string of returned items
        { name: 'total_refund', type: 'number' },
        { name: 'reason', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'pharmacy_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // todo, in-progress, done
        { name: 'priority', type: 'string' }, // low, medium, high
        { name: 'assigned_to', type: 'string', isOptional: true }, // staff name or ID
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Change-log / sync operations table powering local mesh and cloud relay
    tableSchema({
      name: 'sync_ops',
      columns: [
        { name: 'pharmacy_id', type: 'string', isIndexed: true },
        { name: 'device_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' }, // e.g. sale.created, inventory.adjusted
        { name: 'entity', type: 'string' }, // e.g. sale, inventory, prescription
        { name: 'entity_id', type: 'string', isIndexed: true },
        { name: 'payload', type: 'string' }, // JSON payload
        { name: 'direction', type: 'string' }, // outbox | inbox
        { name: 'status', type: 'string' }, // pending | applied | failed
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})
