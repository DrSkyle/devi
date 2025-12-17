import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import { schema } from './schema'
import {
  Pharmacy,
  Profile,
  Staff,
  Customer,
  Supplier,
  Inventory,
  Sale,
  Shift,
  Notification,
  AppMeta,
  UnmetDemand,
  DdaLog,
  Transaction,
  Prescription,
  Return,
  Task,
  SyncOp,
} from './models'

import migrations from './migrations'

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  // dbName: 'myapp', // optional db name
  // onQuotaExceededError: (error) => { ... }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Pharmacy,
    Profile,
    Staff,
    Customer,
    Supplier,
    Inventory,
    Sale,
    Shift,
    Notification,
    AppMeta,
    UnmetDemand,
    DdaLog,
    Transaction,
    Prescription,
    Return,
    SyncOp,
    Task,
  ],
})
// Make database globally available for debugging/tests
if (typeof window !== 'undefined') {
  ;(window as any).database = database
}
