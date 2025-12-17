import { networkService } from '@/services/NetworkService'
import { localAuth } from '@/services/LocalAuthService'
import { v4 as uuidv4 } from 'uuid'

class ReferralService {
  /**
   * Generates a 6-character alphanumeric code for the patient to carry.
   */
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I, O, 1, 0 to avoid confusion
    let code = 'DEVI-'
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Creates a structured referral to a target pharmacy.
   */
  async createReferral(targetPharmacyId: string, medicineName: string, patientName: string = 'Guest') {
    const code = this.generateCode()
    
    const currentUser = localAuth.getCurrentUser()
    const sourcePharmacyId = currentUser?.pharmacyId || 'UNKNOWN_PHARMACY'

    const payload = {
        referralId: uuidv4(),
        code,
        sourcePharmacyId, 
        targetPharmacyId,
        medicineName,
        patientName,
        status: 'pending',
        timestamp: Date.now()
    }

    console.log(`🎟️ Generated Referral: ${code} for ${medicineName}`)
    
    // Broadcast via P2P Network (Best Effort)
    // We use a generic broadcast since we don't have direct addressing in the simple awareness model yet
    // In a real app, this would be encrypted and targeted
    // networkService.broadcastLiquidation({...payload, type: 'referral'}) // Reusing broadcast for now
    
    return payload
  }

  /**
   * Called by the RECEIVING pharmacy when they enter the code.
   */
  async redeemReferral(code: string) {
    // In a local-first P2P system, verifying a code issued by another offline peer is hard without a shared key.
    // For V1, we simply validate the format and log it.
    const isValid = code.startsWith('DEVI-') && code.length === 9
    
    if (!isValid) {
        throw new Error('Invalid Referral Code')
    }

    return {
        success: true,
        sourcePharmacyName: 'Unknown (Offline Verification)', 
        pointsEarned: 50,
        message: 'Referral Accepted. Please verify details manually if needed.'
    }
  }
}

export const referralService = new ReferralService()
