import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'
import { createTable } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    // v2: introduce sync_ops table for change-log and sync
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'sync_ops',
          columns: [
            { name: 'pharmacy_id', type: 'string', isIndexed: true },
            { name: 'device_id', type: 'string', isIndexed: true },
            { name: 'type', type: 'string' },
            { name: 'entity', type: 'string' },
            { name: 'entity_id', type: 'string', isIndexed: true },
            { name: 'payload', type: 'string' },
            { name: 'direction', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
})
