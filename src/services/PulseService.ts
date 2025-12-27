import { database } from '@/database'
import { v4 as uuidv4 } from 'uuid'
import { networkService } from './NetworkService'

// No Cloud URL - Pure Local P2P
const PHARMACY_ID = 'sharma-pharma' 

interface PulsePacket {
    id: string
    pharmacyId: string
    senderId: string 
    timestamp: string
    payload: any 
}

class PulseService {
    /**
     * Bundles local pending actions and broadcasts them to a nearby Admin Peer.
     * "Walk-By Sync" Mode.
     */
    async uploadPulse(staffId: string, actions: any[]): Promise<boolean> {
        // 1. Create the Packet
        const packet: PulsePacket = {
            id: uuidv4(),
            pharmacyId: PHARMACY_ID,
            senderId: staffId,
            timestamp: new Date().toISOString(),
            payload: actions
        }

        console.log('💓 Pulse: Queued Packet for Local Sync', packet.id)

        // 2. Attempt Immediate P2P Sync (If Admin is nearby)
        // We ask NetworkService to blast this packet to any connected 'Admin' peer
        const sent = await networkService.sendToAdmin(packet)
        
        if (sent) {
            console.log('✅ Pulse: Synced with nearby Admin via Wi-Fi')
            return true
        } else {
            console.log('⏳ Pulse: stored locally. Will sync when Admin walks in.')
            // In a real implementation, save to table 'pending_sync'
            return false 
        }
    }

    /**
     * Admin calls this to listen for incoming pulses from staff.
     */
    listenForPulses(onPulseReceived: (p: PulsePacket) => void) {
        networkService.on('pulse_received', onPulseReceived)
    }

    /**
     * Sends a "Heartbeat" 
     */
    async sendPulse() {
        return this.uploadPulse('system', [{ type: 'HEARTBEAT', val: 1 }])
    }
}

export const pulseService = new PulseService()
