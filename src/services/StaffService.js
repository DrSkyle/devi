
export const staffService = {
  /**
   * Checks if remote login is enabled for the current pharmacy.
   * @param {string} ownerId - The ID of the pharmacy owner (current user).
   * @returns {Promise<boolean>}
   */
  async isRemoteLoginEnabled(ownerId) {
    // Cloud Auth disabled for local-first baseline
    return false
  },

  async enableRemoteLogin(ownerId) {
    console.warn('Remote login provisioning disabled in local-first mode.')
  },

  async ensureRemoteLoginEnabled(ownerId) {
    // No-op
  },
}
