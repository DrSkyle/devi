import { test, expect } from '@playwright/test'

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase Auth & Data
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

    // Mock Supabase DB calls to prevent actual network requests
    await page.route('**/rest/v1/inventory*', async (route) => {
      if (
        route.request().method() === 'POST' ||
        route.request().method() === 'PATCH' ||
        route.request().method() === 'DELETE'
      ) {
        await route.fulfill({ status: 201, body: JSON.stringify({}) })
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) })
      }
    })

    // Login Flow (Simplified)
    await page.goto('/login')
    await page.evaluate(() => {
      sessionStorage.setItem('activeStaffId', 'staff-123')
      sessionStorage.setItem('isStaffSession', 'true')
      sessionStorage.setItem('activeStaffRole', 'admin')
    })

    // Seed WatermelonDB with Profile and Pharmacy
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      if (!db) return

      await db.write(async () => {
        // Profiles
        const profilesCollection = db.get('profiles')
        await profilesCollection.create((record) => {
          record.pharmacyId = 1
          record.name = 'Test Pharmacy'
          record.role = 'admin'
          record.pharmacyName = 'Test Pharmacy'
        })

        // Pharmacies (if table exists, otherwise skip or check schema)
        // Assuming 'pharmacies' table exists based on previous context
        /*
        const pharmaciesCollection = db.get('pharmacies')
        await pharmaciesCollection.create(record => {
           record._raw.id = 1
           record.name = 'Test Pharmacy'
           record.code = 'PHARM-001'
        })
        */

        // Staff
        const staffCollection = db.get('staff')
        await staffCollection.create((record) => {
          record._raw.id = 'staff-123'
          record.pharmacyId = 1
          record.name = 'Test Staff'
          record.role = 'admin'
          record.pinHash = 'hash'
        })
      })
    })

    await page.goto('/')
  })

  test('List Inventory', async ({ page }) => {
    // Seed Inventory Data
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encryptData = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      if (!db || !encryptData) return

      await db.write(async () => {
        const inventoryCollection = db.get('inventory')
        await inventoryCollection.create((record) => {
          record._raw.id = '123e4567-e89b-12d3-a456-426614174000'
          record.pharmacyId = 1
          record.name = encryptData('Paracetamol 500mg')
          record.brandName = encryptData('Cetamol')
          record.stock = 100
          record.quantity = 100
          record.sellingPrice = 10
          record.purchasePrice = 5 // Added missing field if needed
          record.expiryDate = '2025-12-31'
          // record.deleted = 0 // WatermelonDB handles deleted via _status usually
          // record.syncStatus = 'synced'
        })
      })
    })

    await page.goto('/inventory')
    await expect(page.getByText('Paracetamol 500mg')).toBeVisible()
    await expect(page.getByText('Cetamol', { exact: true })).toBeVisible()
    await expect(page.getByText('100', { exact: true })).toBeVisible()
  })

  test('Add Inventory', async ({ page }) => {
    await page.goto('/add-inventory')
    await expect(page.getByText('Add New Stock')).toBeVisible()

    await page.fill('input[placeholder="e.g. Paracetamol"]', 'Ibuprofen')
    await page.fill('input[placeholder="e.g. Niko Plus"]', 'Advil')
    await page.fill('input[placeholder="e.g. 500mg"]', '400mg')

    // Select Form (Dropdown)
    await page.getByText('Select Form').click()
    await page.getByLabel('Tablet').click()

    await page.fill('input[placeholder="e.g. Antibiotic"]', 'Painkiller')

    // Pricing & Stock
    await page.locator('input[role="spinbutton"]').nth(0).fill('50') // Quantity
    await page.locator('input[role="spinbutton"]').nth(1).fill('5') // Purchase Price
    await page.locator('input[role="spinbutton"]').nth(2).fill('8') // Selling Price

    await page.fill('input[placeholder="Batch #123"]', 'BATCH-001')

    // Date Picker - Debug Structure
    // Log the HTML of the field container to see what's rendered
    const fieldHtml = await page.locator('.field', { hasText: 'Expiry Date' }).innerHTML()
    console.log('Expiry Date Field HTML:', fieldHtml)

    // Try to find input based on what we might expect (generic input in that field)
    // Use evaluate to find ANY input in that field and set it
    await page.evaluate(() => {
      // Find the field by text content (rough approximation for evaluate)
      const fields = Array.from(document.querySelectorAll('.field'))
      const expiryField = fields.find((f) => f.textContent?.includes('Expiry Date'))
      if (expiryField) {
        const input = expiryField.querySelector('input')
        if (input) {
          input.value = '2026-01-01'
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.dispatchEvent(new Event('blur', { bubbles: true }))
        } else {
          console.error('Input not found inside Expiry Date field')
        }
      } else {
        console.error('Expiry Date field not found')
      }
    })

    // Wait a bit for model update
    await page.waitForTimeout(500)

    await page.click('button[type="submit"]')

    // Check for success or error
    try {
      await expect(page).toHaveURL(/\/inventory/, { timeout: 5000 })
    } catch (e) {
      // If redirection fails, check for error toast
      const toast = page.locator('.p-toast-message-content')
      if (await toast.isVisible()) {
        const errorText = await toast.innerText()
        console.log('Form submission failed with toast:', errorText)
        throw new Error(`Form submission failed: ${errorText}`)
      }
      throw e
    }

    await expect(page.getByText("New batch for 'Ibuprofen' added")).toBeVisible()
  })

  test('Edit Inventory', async ({ page }) => {
    // Capture console logs
    page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`))

    // Seed Item to Edit
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encryptData = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      if (!db || !encryptData) return

      await db.write(async () => {
        const inventoryCollection = db.get('inventory')
        await inventoryCollection.create((record) => {
          record._raw.id = '123e4567-e89b-12d3-a456-426614174001'
          record.pharmacyId = 1
          record.name = encryptData('Old Name')
          record.brandName = encryptData('Old Brand')
          record.stock = 50
          record.quantity = 50
          record.sellingPrice = 20
          record.purchasePrice = 10
          record.expiryDate = '2025-12-31'
          record.batchNo = 'BATCH-OLD'
        })
      })
    })

    await page.goto('/inventory')
    await expect(page.getByText('Old Name')).toBeVisible()

    // Click Edit button for the specific row
    await page.locator('tr', { hasText: 'Old Name' }).locator('.pi-pencil').click()

    // Wait for navigation - Updated to correct route
    await expect(page).toHaveURL(/\/inventory\/edit\/123e4567-e89b-12d3-a456-426614174001/)

    // Wait for spinner to disappear
    await expect(page.locator('.pi-spinner')).toBeHidden()

    // Wait for form to load
    await expect(page.locator('input[placeholder="e.g. Paracetamol"]')).toHaveValue('Old Name')

    await page.fill('input[placeholder="e.g. Paracetamol"]', 'New Name')
    await page.click('button[aria-label="Save Changes"]')

    await expect(page).toHaveURL(/\/inventory/)
    await expect(page.getByText("'New Name' has been updated!")).toBeVisible()
  })

  test('Delete Inventory', async ({ page }) => {
    // Seed Item to Delete
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encryptData = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      if (!db || !encryptData) return

      await db.write(async () => {
        const inventoryCollection = db.get('inventory')
        await inventoryCollection.create((record) => {
          record._raw.id = '123e4567-e89b-12d3-a456-426614174002'
          record.pharmacyId = 1
          record.name = encryptData('Delete Me')
          record.brandName = encryptData('Brand X')
          record.stock = 10
          record.quantity = 10
          record.sellingPrice = 100
          record.purchasePrice = 50
          record.expiryDate = '2025-12-31'
        })
      })
    })

    await page.goto('/inventory')
    await expect(page.getByText('Delete Me')).toBeVisible()

    // Click Delete (Trash icon) for the specific row
    await page.locator('tr', { hasText: 'Delete Me' }).locator('.pi-trash').click()

    // Confirm Dialog
    await expect(page.getByText('Are you sure you want to delete Delete Me?')).toBeVisible()
    await page.click('button[aria-label="Yes"]')

    // Wait for dialog to close
    await expect(page.locator('.p-confirmdialog')).toBeHidden()

    // Verify item is removed from list
    await expect(page.locator('tr', { hasText: 'Delete Me' })).toBeHidden()
  })

  test('Inventory Alerts', async ({ page }) => {
    // Seed Data for Alerts
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      if (!db || !encrypt) return

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const future = new Date()
      future.setFullYear(future.getFullYear() + 5)

      await db.write(async () => {
        const inventoryCollection = db.get('inventory')

        await inventoryCollection.create((record) => {
          record._raw.id = 'alert-1'
          record.pharmacyId = 1
          record.name = encrypt('Low Stock Item')
          record.brandName = encrypt('Generic Low')
          record.stock = 5
          record.quantity = 5
          record.expiryDate = future.toISOString()
          record.batchNo = 'LOW-001'
          record.supplierId = '1'
        })

        await inventoryCollection.create((record) => {
          record._raw.id = 'alert-2'
          record.pharmacyId = 1
          record.name = encrypt('Expiring Item')
          record.brandName = encrypt('Generic Expiring')
          record.stock = 100
          record.quantity = 100
          record.expiryDate = tomorrow.toISOString()
          record.batchNo = 'EXP-001'
          record.supplierId = '1'
        })
      })
    })

    await page.goto('http://localhost:5173/inventory-alerts')

    // Check Low Stock
    await expect(page.getByText('Low Stock Item')).toBeVisible()
    await expect(page.getByText('5', { exact: true })).toBeVisible() // Quantity

    // Check Expiring
    await expect(page.getByText('Expiring Item')).toBeVisible()
    await expect(page.getByText('Batch: EXP-001')).toBeVisible()
  })

  test('Medicine Finder', async ({ page }) => {
    // Seed Data for Search
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      if (!db || !encrypt) return

      await db.write(async () => {
        const inventoryCollection = db.get('inventory')
        await inventoryCollection.create((record) => {
          record._raw.id = 'find-1'
          record.pharmacyId = 1
          record.name = encrypt('Amoxicillin')
          record.brandName = encrypt('Mox')
          record.stock = 50
          record.quantity = 50
          record.expiryDate = '2030-01-01'
          record.batchNo = 'FIND-001'
          record.supplierId = '1'
          record.shelfLocation = encrypt('A1')
        })
      })
    })

    await page.goto('http://localhost:5173/medicine-finder')

    // Search
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('Amoxicillin')

    // Wait for debounce (500ms) + search
    await page.waitForTimeout(1000)

    // Verify Result
    await expect(page.getByRole('heading', { name: 'Amoxicillin' })).toBeVisible()
    await expect(page.getByText('Mox', { exact: true })).toBeVisible()
    await expect(page.getByText('Qty: 50')).toBeVisible()
    await expect(page.getByText('A1')).toBeVisible()
  })
})
