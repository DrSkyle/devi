import { describe, it, expect } from 'vitest'
import SHA256 from 'crypto-js/sha256'

describe('PIN Hashing', () => {
  it('should correctly hash a PIN using SHA-256', () => {
    const pin = '1234'
    const expectedHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' // SHA256 of '1234'

    const hashedPin = SHA256(pin).toString()

    expect(hashedPin).toBe(expectedHash)
  })

  it('should produce different hashes for different PINs', () => {
    const hash1 = SHA256('1234').toString()
    const hash2 = SHA256('0000').toString()

    expect(hash1).not.toBe(hash2)
  })
})
