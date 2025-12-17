import { test, expect } from '@playwright/test'

test.describe('Settings & Staff Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase Auth
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'owner@example.com',
        }),
      })
    })

    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'owner@example.com',
          },
        }),
      })
    })

    // Mock Supabase DB for Staff
    await page.route('**/rest/v1/staff*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, body: JSON.stringify([{ id: 'new-staff-id' }]) })
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 200, body: JSON.stringify([{ id: 'staff-123' }]) })
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) })
      }
    })

    // Mock App Meta for Settings
    await page.route('**/rest/v1/app_meta*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ key: 'khataSettings', value: { smsEnabled: true } }),
      })
    })

    // Login Programmatically
    await page.goto('/login')

    await page.evaluate(async () => {
      // @ts-ignore
      const supabase = window.supabase
      // @ts-ignore

      if (supabase) {
        const { error } = await supabase.auth.setSession({
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjQxMDI0NDQ4MDB9.c2lnbmF0dXJl',
          refresh_token: 'fake-refresh-token',
        })
        if (error) console.log('PAGE LOG: SetSession Error:', error)
      }

      sessionStorage.setItem('activeStaffId', 'test-user-id')
      sessionStorage.setItem('isStaffSession', 'false') // Admin session
      sessionStorage.setItem('activeStaffRole', 'admin')

      // Seed WatermelonDB
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x

      if (db && encrypt) {
        await db.write(async () => {
          // Profiles
          const profilesCollection = db.get('profiles')
          await profilesCollection.create((record) => {
            record._raw.id = 'test-user-id'
            record.pharmacyId = 1
            record.name = 'Test Pharmacy' // Profile name
            record.role = 'admin'
            record.status = 'active'
            // record.pharmacyName = 'Test Pharmacy' // Not in schema, derived from pharmacy
          })

          // Pharmacies
          const pharmaciesCollection = db.get('pharmacies')
          await pharmaciesCollection.create((record) => {
            record._raw.id = 1
            record.name = 'Test Pharmacy'
            record.pharmacyCode = 'PHARM-001'
            record.address = '123 Test St'
            record.phone = '9876543210'
            record.panNumber = '123456789'
            record.vatNumber = '987654321'
            record.province = 'Bagmati'
            record.district = 'Kathmandu'
            record.city = 'Kathmandu'
            record.tole = 'Thamel'
            record.ownerId = 'test-user-id'
          })

          // Staff
          const staffCollection = db.get('staff')
          await staffCollection.create((record) => {
            record._raw.id = 'staff-123'
            record.pharmacyId = 1
            record.name = 'Existing Staff'
            record.role = 'cashier'
            record.employeeId = 'EMP001'
            record.pinHash = 'hash'
            record.isActive = true
          })
        })
      }
    })

    await page.goto('/')
  })

  test('General Settings', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await expect(page.getByText('Khata SMS Reminders')).toBeVisible()
    await expect(page.getByText('Theme Preferences')).toBeVisible()
    await expect(page.getByText('Data Management')).toBeVisible()
  })

  test('My Pharmacy Details', async ({ page }) => {
    await page.goto('/my-pharmacy')
    await expect(page.getByRole('heading', { name: 'My Pharmacy' })).toBeVisible()

    // Verify Details
    // Use specific locators to avoid strict mode violations
    const detailsForm = page.locator('form').first()
    await expect(detailsForm.getByText('Test Pharmacy', { exact: true })).toBeVisible()
    await expect(detailsForm.getByText('PHARM-001')).toBeVisible()
    await expect(detailsForm.getByText('123456789')).toBeVisible() // PAN
  })

  test('Staff Management - Add Staff', async ({ page }) => {
    await page.goto('/my-pharmacy')

    // Open Add Staff Modal
    await page.getByRole('button', { name: 'Add Staff' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Add New Staff Member')).toBeVisible()

    // Fill Form
    await page.fill('input[id="staffName"]', 'New Staff')
    // Select Role - PrimeVue Select
    await page.click('#staffRole')
    await page.getByRole('option', { name: 'Pharmacist' }).click()

    await page.fill('input[id="staffId"]', 'EMP002')
    await page.fill('input[id="staffPin"]', '1234')

    // Save
    await page.getByRole('button', { name: 'Save Staff' }).click()

    // Verify Success
    await expect(page.getByText('Staff member added!')).toBeVisible()
    await expect(page.getByText('New Staff', { exact: true })).toBeVisible()
  })

  test('Staff Management - Deactivate Staff', async ({ page }) => {
    await page.goto('/my-pharmacy')

    // Find Existing Staff - Target the inner glass panel (card) specifically
    // The outer container is also .glass-panel, so we look for a glass-panel inside a glass-panel
    const staffCard = page
      .locator('.glass-panel .glass-panel')
      .filter({ hasText: 'Existing Staff' })
    await expect(staffCard).toBeVisible()

    // Click Deactivate (Ban icon) using aria-label
    page.on('dialog', (dialog) => dialog.accept())

    await staffCard.getByRole('button', { name: 'Deactivate' }).click()

    // Verify Success
    await expect(page.getByText('Staff member deactivated.')).toBeVisible()
  })
})
