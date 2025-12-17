
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
// import { pulseService } from '@/services/PulseService' // Circular dependency potential?
// We will import it dynamically or assume it's safe. PulseService imports database, so sync importing PulseService is okay if PulseService doesn't import sync.
import { pulseService } from '@/services/PulseService'

export async function sync() {
    console.log('[Sync] Starting Sync Cycle...')

    // 1. PUSH: Get pending ops
    try {
        const pendingOps = await database.get('sync_ops').query(
            Q.where('status', 'pending')
        ).fetch()

        console.log(`[Sync] Found ${pendingOps.length} pending operations.`)

        if (pendingOps.length > 0) {
            // Serialize ops
            // We need to parse payload because it is stored as string in DB
            const actions = pendingOps.map(op => {
                let parsedPayload = {}
                try {
                     parsedPayload = JSON.parse(op.payload || '{}')
                } catch (e) {
                     console.warn('Failed to parse payload for op', op.id)
                }
                return {
                    id: op.id,
                    type: op.type,
                    entity: op.entity,
                    entity_id: op.entityId,
                    payload: parsedPayload,
                    created_at: op.createdAt
                }
            })

            const success = await pulseService.uploadPulse('system', actions)

            if (success) {
                console.log('[Sync] Pulse Upload Success. Marking ops as synced.')
                await database.write(async () => {
                    for (const op of pendingOps) {
                        await op.update(rec => {
                            rec.status = 'synced'
                        })
                    }
                })
            } else {
                console.log('[Sync] Pulse Upload Queued Locally (No Peer/Cloud).')
            }
        }
    } catch (e) {
        console.error('[Sync] Error during sync push:', e)
    }
}
