import { test, expect } from '@playwright/test'

test.describe('Dashboard/Home', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`))

    // Mock Supabase Auth
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
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
            email: 'test@example.com',
          },
        }),
      })
    })

    // Login Programmatically
    await page.goto('/login')

    await page.evaluate(async () => {
      // @ts-ignore
      const supabase = window.supabase
      // @ts-ignore
      // Seed WatermelonDB
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x

      if (db) {
        await db.write(async () => {
          // Profiles
          const profilesCollection = db.get('profiles')
          await profilesCollection.create((record) => {
            record.pharmacyId = 1
            record.name = 'Test Pharmacy'
            record.role = 'admin'
            record.pharmacyName = 'Test Pharmacy'
            record.address = '123 Test St'
            record.phone = '9876543210'
          })

          // Inventory for Alerts
          const inventoryCollection = db.get('inventory')
          await inventoryCollection.create((record) => {
            record._raw.id = 'item-1'
            record.pharmacyId = 1
            record.name = encrypt ? encrypt('Low Stock Item') : 'Low Stock Item'
            record.quantity = 5
            // record.minStockLevel = 10 // If model has this field
            record.sellingPrice = 100
            record.expiryDate = '2025-12-31'
          })

          await inventoryCollection.create((record) => {
            record._raw.id = 'item-2'
            record.pharmacyId = 1
            record.name = encrypt ? encrypt('Expiring Item') : 'Expiring Item'
            record.quantity = 50
            // record.minStockLevel = 10
            record.sellingPrice = 200
            record.expiryDate = new Date().toISOString().split('T')[0]
          })

          // Sales for Stats
          const salesCollection = db.get('sales')
          const today = new Date().getTime() // Use timestamp for WatermelonDB date fields

          await salesCollection.create((record) => {
            record._raw.id = 'sale-1'
            record.pharmacyId = 1
            record.total = 500
            record.profit = 100
            record.createdAt = today
            record.status = 'completed'
            record.items = JSON.stringify([])
          })

          await salesCollection.create((record) => {
            record._raw.id = 'sale-2'
            record.pharmacyId = 1
            record.total = 1500
            record.profit = 300
            record.createdAt = today
            record.status = 'completed'
            record.items = JSON.stringify([])
          })
        })
      }
    })

    await page.goto('/')
  })

  test('Dashboard Stats & Elements', async ({ page }) => {
    // Verify Header
    await expect(page.getByText('Test Pharmacy')).toBeVisible()

    // Verify Quick Actions
    await expect(page.getByText('New Sale')).toBeVisible()
    await expect(page.getByText('Add Stock')).toBeVisible()
    await expect(page.getByText('Find Meds')).toBeVisible()

    // Verify Stats
    // Total Orders: 2 sales seeded
    await expect(page.getByText('Total Orders')).toBeVisible()
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible()

    // Revenue: 500 + 1500 = 2000
    await expect(page.getByText("Today's Revenue")).toBeVisible()
    await expect(page.getByText('2,000')).toBeVisible()

    // Customers Served: 2
    await expect(page.getByText('Customers Served')).toBeVisible()

    // Verify Alerts
    // Wait for stats to load
    await page.waitForTimeout(1000)

    // Low Stock: 1 item (item-1)
    // Use getByRole link which contains the text "Low Stock"
    const lowStockLink = page.getByRole('link', { name: /Low Stock/ })
    await expect(lowStockLink).toBeVisible()
    await expect(lowStockLink).toContainText('1')

    // Expiring Soon: 1 item (item-2)
    const expiringLink = page.getByRole('link', { name: /Expiring Soon/ })
    await expect(expiringLink).toBeVisible()
    await expect(expiringLink).toContainText('1')
  })

  test('Navigation from Dashboard', async ({ page }) => {
    // Click New Sale
    await page.getByText('New Sale').click()
    await expect(page).toHaveURL(/\/record-sale/)

    // Go back
    await page.goto('/')

    // Click Add Stock
    await page.getByText('Add Stock').click()
    await expect(page).toHaveURL(/\/add-inventory/)
  })
})
