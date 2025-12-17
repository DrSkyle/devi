import { test, expect } from '@playwright/test'

test.describe('Prescription Management', () => {
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

    // Mock Supabase DB for Prescriptions
    await page.route('**/rest/v1/prescriptions*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, body: JSON.stringify([{ id: 'new-prescription-id' }]) })
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 200, body: JSON.stringify([{ id: 'prescription-1' }]) })
      } else {
        const url = route.request().url()
        if (url.includes('customer_id=eq.customer-2')) {
          await route.fulfill({ status: 200, body: JSON.stringify([]) })
          return
        }

        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'prescription-1',
              _id: 'prescription-1',
              pharmacy_id: 1,
              customer_id: 'customer-1',
              doctor_name: 'Dr. Smith',
              patient_name: 'John Doe',
              notes: 'Take twice daily',
              created_at: new Date().toISOString(),
              items: [
                {
                  name: 'Paracetamol',
                  dosage: '500mg',
                  frequency: 'BD',
                  duration: '5 days',
                  quantity: 10,
                },
              ],
              status: 'pending',
            },
          ]),
        })
      }
    })

    // Login Programmatically
    await page.goto('/login')

    await page.evaluate(async () => {
      // @ts-ignore
      const supabase = window.supabase

      if (supabase) {
        const { error } = await supabase.auth.setSession({
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjQxMDI0NDQ4MDB9.c2lnbmF0dXJl',
          refresh_token: 'fake-refresh-token',
        })
      }

      sessionStorage.setItem('activeStaffId', 'test-user-id')
      sessionStorage.setItem('isStaffSession', 'false') // Admin session

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
            record.name = 'Test Pharmacy'
            record.role = 'admin'
            record.pharmacyName = 'Test Pharmacy'
            record.address = '123 Test St'
            record.phone = '9876543210'
          })

          // Customers
          const customersCollection = db.get('customers')
          await customersCollection.create((record) => {
            record._raw.id = 'customer-1'
            record.pharmacyId = 1
            record.name = encrypt('John Doe')
            record.phone = encrypt('9800000000')
            // record.userId = 'test-user-id' // Not in schema usually, but maybe in model
          })

          await customersCollection.create((record) => {
            record._raw.id = 'customer-2'
            record.pharmacyId = 1
            record.name = encrypt('Jane Doe')
            record.phone = encrypt('9811111111')
          })

          // Inventory
          const inventoryCollection = db.get('inventory')
          await inventoryCollection.create((record) => {
            record._raw.id = 'item-1'
            record.pharmacyId = 1
            record.name = encrypt('Paracetamol')
            record.stock = 100
            record.quantity = 100
            record.sellingPrice = 10
            record.purchasePrice = 5
            record.expiryDate = '2025-12-31'
          })

          // Prescriptions
          const prescriptionsCollection = db.get('prescriptions')
          await prescriptionsCollection.create((record) => {
            record._raw.id = 'prescription-1'
            record.pharmacyId = 1
            record.customerId = 'customer-1'
            record.doctorName = 'Dr. Smith'
            record.patientName = 'John Doe'
            // record.notes = 'Take twice daily' // If model has it
            record.createdAt = new Date().getTime()
            record.status = 'pending'
            record.items = JSON.stringify([
              {
                name: encrypt('Paracetamol'),
                dosage: '500mg',
                frequency: 'BD',
                duration: '5 days',
              },
            ])
          })
        })
      }
    })

    await page.goto('/')
  })

  test('List Prescriptions', async ({ page }) => {
    await page.goto('/prescriptions')
    await expect(page.getByRole('heading', { name: 'Prescription Hub' })).toBeVisible()

    // Verify Seeded Prescription
    await expect(page.getByText('Dr. Smith')).toBeVisible()
    await expect(page.getByText('John Doe')).toBeVisible()
  })

  test('Add Prescription', async ({ page }) => {
    await page.goto('/prescriptions')

    // Click New Prescription button
    await page.getByRole('button', { name: 'New Prescription' }).click()

    // Verify navigation to Composer
    await expect(page.getByRole('heading', { name: 'Prescription Composer' })).toBeVisible()

    // Step 1: Select Patient
    await page.getByPlaceholder('Search by name or phone...').fill('Jane')
    await expect(page.getByText('Jane Doe')).toBeVisible()
    await page.getByText('Jane Doe').click()

    // Step 2: Compose
    await expect(page.getByRole('heading', { name: 'Step 2: Compose Prescription' })).toBeVisible()

    // Fill Doctor
    await page.fill('input[id="doctorName"]', 'Dr. Strange')

    // Add Medicine
    await page.getByPlaceholder('Search medicine...').click()
    await page.getByPlaceholder('Search medicine...').pressSequentially('Para', { delay: 200 })
    await page.waitForTimeout(2000) // Wait for debounce and render
    await expect(page.getByRole('listbox')).toBeVisible()
    await expect(page.getByRole('listbox').getByText('Paracetamol')).toBeVisible()
    await page.getByRole('listbox').getByText('Paracetamol').click()

    // Save
    await page.getByRole('button', { name: 'Finalize & Save' }).click()

    // Verify Success
    await expect(page.getByText('Prescription saved successfully!')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Prescription Hub' })).toBeVisible()
  })
})
