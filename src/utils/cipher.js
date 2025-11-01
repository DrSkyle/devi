// src/utils/cipher.js
import CryptoJS from 'crypto-js'

// Load the secret key from environment variables - this remains as the default
const defaultSecretKey = import.meta.env.VITE_CRYPTO_SECRET_KEY

if (!defaultSecretKey || defaultSecretKey.length < 32) {
  const errorMessage =
    "CRITICAL SECURITY ERROR: The VITE_CRYPTO_SECRET_KEY is not set or is too short in your .env file. Please ensure it is in the project's ROOT directory and is a long, random string."
  alert(errorMessage)
  throw new Error(errorMessage)
}

/**
 * Encrypts data. Can use a custom key or fall back to the default.
 * @param {*} data The data to encrypt.
 * @param {string} [key] An optional custom key to use for encryption.
 * @returns {string|*} The encrypted string or original data on failure.
 */
export function encryptData(data, key = defaultSecretKey) {
  // <-- MODIFIED
  if (data == null || data === '') return data
  try {
    const dataString = JSON.stringify(data)
    return CryptoJS.AES.encrypt(dataString, key).toString() // <-- MODIFIED
  } catch (e) {
    console.error('Encryption failed:', e)
    return data
  }
}

/**
 * Decrypts data. Can use a custom key or fall back to the default.
 * @param {string} encryptedData The data string to decrypt.
 * @param {string} [key] An optional custom key to use for decryption.
 * @returns {*} The decrypted data or the original string.
 */
export function decryptData(encryptedData, key = defaultSecretKey) {
  // B. Remove the 'U2F' Prefix Check
  if (encryptedData == null || typeof encryptedData !== 'string') {
    return encryptedData
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedString) {
      // If decryption fails, it returns an empty string. Return null to make the failure explicit.
      return null
    }

    return JSON.parse(decryptedString)
  } catch {
    // If JSON.parse fails or another error occurs, return the original data.
    return encryptedData
  }
}
