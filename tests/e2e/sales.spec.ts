import { test, expect } from '@playwright/test'

test.describe('Sales/POS', () => {
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

    // Variable to store encrypted name, populated after app loads
    let encryptedParacetamol = 'U2FsdGVkX1+Paracetamol' // Default fallback

    // Capture console logs
    page.on('console', (msg) => console.log(`PAGE LOG: ${msg.text()}`))
    page.on('pageerror', (err) => console.log(`PAGE ERROR: ${err.message}`))

    // Mock Supabase DB calls
    await page.route('**/rest/v1/sales*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            _id: 'sale-123',
            bill_number: 'INV-TEST-001',
            created_at: new Date().toISOString(),
          }),
        })
      } else if (route.request().url().includes('bill_number=eq.INV-RET-001')) {
        // Mock finding sale for return
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            _id: 'sale-return-1',
            bill_number: 'INV-RET-001',
            pharmacy_id: 1,
            customer_id: 'cust-1',
            total: 100,
            subtotal: 100,
            items: [
              {
                inventory_id: 'item-1',
                name: encryptedParacetamol, // Use dynamic encrypted value
                quantity: 10,
                price: 10,
                total: 100,
                returnableQuantity: 10,
              },
            ],
            created_at: new Date().toISOString(),
            status: 'paid',
          }),
        })
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) })
      }
    })

    // Mock Supabase RPC for process_return
    await page.route('**/rest/v1/rpc/process_return', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify('return-123'), // Returns the new return ID
      })
    })

    // Mock Supabase Returns fetch for Credit Note
    await page.route('**/rest/v1/returns*', async (route) => {
      if (route.request().url().includes('_id=eq.return-123')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            _id: 'return-123',
            bill_number: 'INV-RET-001',
            created_at: new Date().toISOString(),
            total_value: 20,
            items: [
              {
                name: encryptedParacetamol,
                quantity: 2,
                price: 10,
              },
            ],
          }),
        })
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) })
      }
    })

    // Mock Returns Table Fetch (Placed last to ensure precedence)
    await page.route('**/rest/v1/returns*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 123,
            bill_number: 'INV-RET-001',
            created_at: new Date().toISOString(),
            total_value: 20.0,
            items: [
              {
                name: 'U2FsdGVkX1+Paracetamol',
                quantity: 2,
                price: 10.0,
              },
            ],
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Login Flow (Programmatic)
    await page.goto('/login')

    // Set Supabase Session & Seed Dexie
    await page.evaluate(async () => {
      // @ts-ignore
      const supabase = window.supabase
      // @ts-ignore
      // const db = window.db

      if (supabase) {
        const { error } = await supabase.auth.setSession({
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjQxMDI0NDQ4MDB9.c2lnbmF0dXJl', // Valid base64url JWT
          refresh_token: 'fake-refresh-token',
        })
        if (error) console.log('PAGE LOG: SetSession Error:', error)
      }

      // Set App Session
      sessionStorage.setItem('activeStaffId', 'staff-123')
      sessionStorage.setItem('isStaffSession', 'true')
      sessionStorage.setItem('activeStaffRole', 'admin')

      // Seed WatermelonDB
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x

      if (db) {
        await db.write(async () => {
          // Clear existing data (optional, or just create new)
          // Note: WatermelonDB doesn't have a simple 'clear' for all tables,
          // but for tests we might assume empty or just add.
          // Ideally we should reset, but for now let's just add if not exists or just add.

          // Profiles
          const profilesCollection = db.get('profiles')
          await profilesCollection.create((record) => {
            record.pharmacyId = 1
            record.name = 'Test Pharmacy'
            record.role = 'admin'
            record.pharmacyName = 'Test Pharmacy'
            record.address = '123 Test St'
            record.phone = '9876543210'
            record.status = 'active'
          })

          // Staff
          const staffCollection = db.get('staff')
          await staffCollection.create((record) => {
            record._raw.id = 'staff-123' // Force ID if possible, or let it generate and we rely on other fields
            record.pharmacyId = 1
            record.name = 'Test Staff'
            record.role = 'admin'
            record.pinHash = 'hash'
          })

          // Inventory
          const inventoryCollection = db.get('inventory')
          await inventoryCollection.create((record) => {
            record._raw.id = 'item-1'
            record.pharmacyId = 1
            record.name = encrypt('Paracetamol')
            record.brandName = encrypt('Cetamol')
            record.stock = 100
            record.quantity = 100
            record.sellingPrice = 10
            record.purchasePrice = 5
            record.expiryDate = '2030-01-01'
            record.batchNo = 'BATCH-001'
            record.vatPercent = 0
          })

          // Customers
          const customersCollection = db.get('customers')
          await customersCollection.create((record) => {
            record._raw.id = 'cust-1'
            record.pharmacyId = 1
            record.name = encrypt('John Doe')
            record.phone = encrypt('9800000000')
            record.balance = 0
          })
        })
      }
    })

    // Navigate to Dashboard
    await page.goto('/')

    await page.goto('/')

    // Generate encrypted string using app's key
    encryptedParacetamol = await page.evaluate(() => {
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      return encrypt('Paracetamol')
    })
  })

  test('Record Cash Sale', async ({ page }) => {
    await page.goto('/record-sale')

    // Search and Add Product
    const searchInput = page.locator('input[placeholder*="Scan barcode or search"]')
    await searchInput.fill('Paracetamol')
    await page.waitForTimeout(500) // Debounce
    await page.getByText('Paracetamol').first().click()

    // Verify Cart
    await expect(page.getByText('Cart Items (1)')).toBeVisible()
    // Check price in cart item
    await expect(page.locator('.cart-item').getByText('Rs. 10.00')).toBeVisible()

    // Process Sale
    await page.click('button[aria-label="Process Sale"]')

    // Payment Modal
    await expect(page.getByText('Confirm Payment')).toBeVisible()
    // Check total in modal
    await expect(page.locator('.text-4xl').getByText('Rs. 10.00')).toBeVisible()

    // Cash Payment (Default)
    // Amount Received (Auto-filled or enter)
    await page
      .locator('.field', { hasText: 'Amount Received' })
      .locator('input[role="spinbutton"]')
      .fill('10')

    await page.click('button[aria-label="Print & Save"]')

    // Verify Receipt Navigation
    await expect(page).toHaveURL(/\/receipt\//)
    await expect(page.getByText('VAT INVOICE')).toBeVisible()
    await expect(page.getByText('Paracetamol')).toBeVisible()
    await expect(page.getByText('Grand Total')).toBeVisible()
    // Check Grand Total value in receipt
    await expect(page.locator('.text-xl.font-bold').getByText('Rs. 10.00')).toBeVisible()
  })

  test('Record Credit Sale', async ({ page }) => {
    await page.goto('/record-sale')

    // Select Customer
    // Select Customer
    await page.getByText('Select Customer (Optional)').click()
    await page.getByText('John Doe').click()

    // Add Product
    const searchInput = page.locator('input[placeholder*="Scan barcode or search"]')
    await searchInput.fill('Paracetamol')
    await page.waitForTimeout(500)
    await page.getByText('Paracetamol').first().click()

    // Process Sale
    await page.click('button[aria-label="Process Sale"]')

    // Select Credit
    await page.getByText('Credit').click()

    await page.click('button[aria-label="Print & Save"]')

    // Verify Receipt
    await expect(page).toHaveURL(/\/receipt\//)
    await expect(page.getByText('CREDIT INVOICE')).toBeVisible()
    await expect(page.getByText('Bill To:')).toBeVisible()
    await expect(page.getByText('John Doe')).toBeVisible()
  })

  test('Process Return', async ({ page }) => {
    // Seed Sale for Return
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x
      if (!db) return

      await db.write(async () => {
        const salesCollection = db.get('sales')
        await salesCollection.create((record) => {
          record._raw.id = 'sale-return-1'
          record.billNumber = 'INV-RET-001'
          record.pharmacyId = 1
          record.customerId = 'cust-1'
          record.total = 100
          record.subtotal = 100
          record.items = JSON.stringify([
            {
              inventory_id: 'item-1',
              name: encrypt('Paracetamol'),
              quantity: 10,
              price: 10,
              total: 100,
              returnableQuantity: 10,
            },
          ])
          record.createdAt = new Date().getTime() // WatermelonDB uses numbers for dates usually, or depends on schema
          record.status = 'paid'
        })
      })
    })

    await page.goto('/process-return')

    // Search Bill
    await page.fill('input[placeholder="e.g., 101"]', 'INV-RET-001')
    await page.click('button[aria-label="Find Bill"]')

    // Verify Sale Details
    await expect(page.getByText('Bill #INV-RET-001')).toBeVisible()
    await expect(page.getByText('Paracetamol')).toBeVisible()

    // Enter Return Quantity
    // Find input inside the row for Paracetamol
    const row = page.locator('tr', { hasText: 'Paracetamol' })
    const input = row.locator('input[role="spinbutton"]')
    await input.fill('2')
    await input.press('Tab') // Trigger change event

    // Wait for reactivity
    await page.waitForTimeout(500)

    // Verify Refund Amount (Summary or Row)
    // Use specific locator to avoid ambiguity if multiple exist, though error was 'not found'
    await expect(page.locator('.text-red-400').getByText('Rs. 20.00')).toBeVisible()

    // Process Return
    await page.click('button[aria-label="Process Return"]')

    // Verify Credit Note Navigation
    await expect(page).toHaveURL(/\/credit-note\//)
    await expect(page.getByRole('heading', { name: 'CREDIT NOTE' })).toBeVisible()
    await expect(page.getByText('Ref. Bill No: INV-RET-001')).toBeVisible()
    await expect(page.getByText('Rs. 20.00')).toBeVisible()
  })
})
