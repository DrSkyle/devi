import { test, expect } from '@playwright/test'

test.describe('Customer Management', () => {
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

    // Mock Supabase DB calls
    await page.route('**/rest/v1/customers*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            _id: 'cust-new',
            name: 'U2FsdGVkX1+NewCustomer', // Encrypted "New Customer"
            phone: 'U2FsdGVkX1+9800000000', // Encrypted "9800000000"
            created_at: new Date().toISOString(),
          }),
        })
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            _id: 'cust-1',
            name: 'U2FsdGVkX1+UpdatedCustomer', // Encrypted "Updated Customer"
            phone: 'U2FsdGVkX1+9800000000',
            updated_at: new Date().toISOString(),
          }),
        })
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 })
      } else {
        await route.continue()
      }
    })

    // Login Flow (Programmatic)
    await page.goto('/login')

    // Seed WatermelonDB
    await page.evaluate(async () => {
      // @ts-ignore
      const supabase = window.supabase
      // @ts-ignore
      const db = window.database
      // @ts-ignore
      const encrypt = typeof window.encryptData === 'function' ? window.encryptData : (x) => x

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
      if (db && encrypt) {
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

          // Staff
          const staffCollection = db.get('staff')
          await staffCollection.create((record) => {
            record._raw.id = 'staff-123'
            record.pharmacyId = 1
            record.name = 'Test Staff'
            record.role = 'admin'
            record.pinHash = 'hash'
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
  })

  test('List Customers', async ({ page }) => {
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: 'Customer Hub' })).toBeVisible()
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('9800000000')).toBeVisible()
  })

  test('Add Customer', async ({ page }) => {
    await page.goto('/customers')
    await page.getByRole('button', { name: 'New Customer' }).click()

    // Target the dialog title specifically
    await expect(page.locator('.p-dialog-title').filter({ hasText: 'New Customer' })).toBeVisible()

    // Fill form - finding input by nearby label
    await page.locator('.field', { hasText: 'Full Name' }).locator('input').fill('New Customer')
    await page.locator('.field', { hasText: 'Phone Number' }).locator('input').fill('9811111111')

    await page.getByRole('button', { name: 'Save Customer' }).click()

    await expect(page.getByText('Customer added successfully')).toBeVisible()
  })

  test('Edit Customer', async ({ page }) => {
    await page.goto('/customers')

    // Click on John Doe to go to details
    await page.getByText('John Doe').click()

    await expect(page).toHaveURL(/\/customers\/cust-1/)

    // Click Edit Button in Detail View
    await page.getByRole('button', { name: 'Edit Customer' }).click()

    // Target the dialog title specifically
    await expect(page.locator('.p-dialog-title').filter({ hasText: 'Edit Customer' })).toBeVisible()

    // Fill form - finding input by nearby label "Customer Name"
    // Since PrimeVue inputs might not have implicit labels, we use a locator strategy
    // Find the field div containing the label, then find the input within it
    await page
      .locator('.field', { hasText: 'Customer Name' })
      .locator('input')
      .fill('Updated Customer')

    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Customer details updated')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Updated Customer' })).toBeVisible()
  })

  test('Delete Customer', async ({ page }) => {
    await page.goto('/customers')
    await page.getByText('John Doe').click()

    // Click Delete Button
    await page.getByRole('button', { name: 'Delete Customer' }).click()

    // Confirm Dialog
    await page.getByRole('button', { name: 'Yes' }).click()

    await expect(page).toHaveURL(/\/customers$/)
    await expect(page.getByText('Customer deleted')).toBeVisible()
  })
})
