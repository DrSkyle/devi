export class BiometricService {
  static async isAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) return false

    // Check if platform authenticator (FaceID/TouchID) is available
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch (e) {
      return false
    }
  }

  static async createCredential(userId: string, challenge: string): Promise<boolean> {
    if (!(await this.isAvailable())) return false

    try {
      // We are creating a "dummy" credential just to verify the user can use FaceID.
      // In a real backend scenario, we would send the attestation to the server.
      // Here, we just want to ensure the user performs the biometric gesture.
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
        rp: {
          name: 'D.E.V.I POS',
          id: window.location.hostname, // Must match current domain
        },
        user: {
          id: Uint8Array.from(userId, (c) => c.charCodeAt(0)),
          name: userId,
          displayName: userId,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      }

      const credential = await navigator.credentials.create({ publicKey })
      return !!credential
    } catch (e) {
      console.error('Biometric registration failed:', e)
      return false
    }
  }

  static async verifyUser(challenge: string = 'verify-user'): Promise<boolean> {
    if (!(await this.isAvailable())) return false

    try {
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
        timeout: 60000,
        userVerification: 'required',
        // We allow any credential from this RP
      }

      const assertion = await navigator.credentials.get({ publicKey })
      return !!assertion
    } catch (e) {
      console.error('Biometric verification failed:', e)
      return false
    }
  }
}
