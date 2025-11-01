import Dexie from 'dexie'

export const db = new Dexie('DeviPharmacyDB_Supabase')

db.version(1).stores({
  customers: '_id, name, phone, user_id',
  inventory: '_id, name, brand_name, user_id',
  sales: '_id, createdAt, user_id',
  suppliers: '_id, name, user_id',
  payments: '_id, customer_id, user_id',
  prescriptions: '_id, patient_name, doctor_name, user_id',
  transfers: '_id, from_pharmacy_id, to_pharmacy_id, user_id',
  audit_logs: '_id, user_id, action, timestamp',
  returns: '_id, original_sale_id, user_id',
  shifts: '_id, staff_id, pharmacy_id',
  app_meta: 'key',
  profiles: 'user_id, pharmacy_id',
})

export async function clearLocalData() {
  await Promise.all(db.tables.map((table) => table.clear()))
  console.log('Local database cleared for user logout.')
}
