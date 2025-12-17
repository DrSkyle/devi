import { test, expect } from '@playwright/test'

test.describe('Offline Capability & Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the database or ensure initial state if possible
    // For now, we assume the app is seeded or we treat it as a fresh install

    // Go to login page
    await page.goto('/login')

    // Provision device first if needed (Online First Run)
    // We might need a helper to seed local storage for "Already Provisioned" state
    // to test pure offline mode.
  })

  test('should allow login when offline if previously synced', async ({ page, context }) => {
    // 1. Seed LocalStorage to simulate "Already Provisioned" device
    await page.addInitScript(() => {
      localStorage.setItem('lastPharmacyCode', 'test-pharmacy')
      localStorage.setItem('lastEmployeeId', 'EMP001')
      // We might need to seed IndexedDB (WatermelonDB) here too,
      // which is complex.
      // Alternatively, we run a "Setup" flow online, then go offline.
    })

    // Reload to pick up Storage
    await page.reload()

    // 2. Go Offline
    await context.setOffline(true)

    // 3. Attempt Login
    await expect(page.getByText('Who are you?')).toBeVisible() // Should skip Pharmacy Code step

    // Fill ID (if not auto-filled)
    const idInput = page.getByPlaceholder('ID')
    await idInput.fill('EMP001')
    await page.getByText('Identify').click()

    // Enter PIN
    await expect(page.getByText('Hello, EMP001')).toBeVisible()
    await page.getByText('1').click()
    await page.getByText('2').click()
    await page.getByText('3').click()
    await page.getByText('4').click()

    // Click OK (Checkmark)
    await page.locator('.glass-numpad-success').click()

    // 4. Assert Success (Dashboard visible)
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
})
