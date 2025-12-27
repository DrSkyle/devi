import { v4 as uuidv4 } from 'uuid'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

export interface StaffUser {
    id: string
    name: string
    role: 'admin' | 'pharmacist' | 'cashier'
    pharmacyId: string
    pin_hash?: string
}

class LocalAuthService {
    private currentUser: StaffUser | null = null

    /**
     * Hashes a PIN using SHA-256 for secure storage.
     * Web Crypto API is available in all modern browsers/WebViews.
     */
    async hashPin(pin: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(pin)
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Initializes the Admin user if no users exist (First Run).
     */
    async initializeAdmin(name: string, pin: string, pharmacyName: string) {
        const staffCollection = database.collections.get('staff')
        const pharmacyCollection = database.collections.get('pharmacies')

        // Check if ANY staff exists
        const staffCount = await staffCollection.query().fetchCount()
        if (staffCount > 0) {
             throw new Error("System already initialized. Admin exists.")
        }

        const pinHash = await this.hashPin(pin)
        const pharmacyId = uuidv4() // Generate unique ID for the local pharmacy

        await database.write(async () => {
            // 1. Create Pharmacy Record
            await pharmacyCollection.create(pharmacy => {
                pharmacy.name = pharmacyName
                pharmacy.license_number = 'PENDING'
                // Add other default fields if schema requires
            })

            // 2. Create Admin Staff
            await staffCollection.create(staff => {
                staff.name = name
                staff.role = 'admin'
                staff.pin_hash = pinHash
                staff.pharmacy_id = pharmacyId
                staff.is_active = true
            })
        })

        // Auto-login after creation
        return this.login(pin)
    }

    /**
     * Verifies a PIN and logs the user in.
     */
    async login(pin: string): Promise<StaffUser | null> {
        const pinHash = await this.hashPin(pin)
        const staffCollection = database.collections.get('staff')

        // Query for active user with matching PIN hash
        const users = await staffCollection.query(
            Q.where('pin_hash', pinHash),
            Q.where('is_active', true)
        ).fetch()

        if (users.length > 0) {
            const user = users[0]
            // Map WatermelonDB model to StaffUser interface
            this.currentUser = {
                id: user.id,
                name: user.name,
                role: user.role as 'admin' | 'pharmacist' | 'cashier',
                pharmacyId: user.pharmacy_id
            }
            console.log(`[Auth] Login Successful: ${this.currentUser.name}`)
            return this.currentUser
        }

        console.warn('[Auth] Login Failed: Invalid PIN')
        return null
    }

    /**
     * Checks if any admin exists in the system (to toggle "Setup Mode" vs "Login Mode").
     */
    async hasAdmin(): Promise<boolean> {
        const staffCollection = database.collections.get('staff')
        const count = await staffCollection.query(Q.where('role', 'admin')).fetchCount()
        return count > 0
    }

    logout() {
        console.log(`[Auth] Logging out: ${this.currentUser?.name}`)
        this.currentUser = null
    }

    getCurrentUser() {
        return this.currentUser
    }

    /**
     * Application Level RLS Replacement.
     * Check if current user has permission for an action.
     */
    can(action: string, resource: string): boolean {
        if (!this.currentUser) return false
        if (this.currentUser.role === 'admin') return true

        if (this.currentUser.role === 'cashier') {
            if (resource === 'sales') return true
            if (resource === 'customers') return true
            if (resource === 'inventory' && action === 'read') return true
            return false
        }
        
        // Pharmacists usually have high access but maybe restricted from system settings?
        if (this.currentUser.role === 'pharmacist') {
             if (resource === 'settings') return false
             return true
        }

        return false
    }
}

export const localAuth = new LocalAuthService()
