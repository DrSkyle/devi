import { test, expect } from '@playwright/test'
import fs from 'fs'

const SUPABASE_URL = 'https://dzzbwoqzhjlfqlmqsxuk.supabase.co'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test to ensure clean state
    await page.addInitScript(async () => {
      const databases = await window.indexedDB.databases()
      for (const db of databases) {
        if (db.name) window.indexedDB.deleteDatabase(db.name)
      }
      localStorage.clear()
      sessionStorage.clear()
    })

    page.on('console', (msg) => console.log(`Browser Console: ${msg.text()}`))
    page.on('pageerror', (err) => console.error(`Browser Error: ${err}`))
    page.on('requestfailed', (req) =>
      console.error(`Request Failed: ${req.url()} ${req.failure().errorText}`),
    )

    // Mock User Endpoint (Heartbeat/Session Verification)
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
  })

  test('Signup Flow', async ({ page }) => {
    // Mock Supabase Signup
    await page.route(/.*\/auth\/v1\/signup.*/, async (route) => {
      console.log('Mocking Signup Request')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItc2lkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNzE1NDY1NjAwLCJleHAiOjE5MDAwMDAwMDB9.signature',
          refresh_token: 'fake-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      })
    })

    await page.goto('/signup')

    await page.fill('#email', 'test@example.com')
    await page.fill('#password input', 'password123')
    await page.waitForSelector('button[type="submit"]')
    await page.click('button[type="submit"]')

    // Check for error message
    const errorMessage = page.locator('.text-red-400')
    if (await errorMessage.isVisible()) {
      const text = await errorMessage.textContent()
      console.error(`Signup failed with message: ${text}`)
      throw new Error(`Signup failed with message: ${text}`)
    }

    // Expect redirection to profile setup
    await expect(page).toHaveURL(/\/profile-setup/)
    await expect(page.getByText('Account created!')).toBeVisible()
  })

  test('Staff Login Flow', async ({ page }) => {
    // Mock Find Pharmacy
    await page.route(/.*\/rest\/v1\/pharmacies.*/, async (route) => {
      const url = route.request().url()
      if (url.includes('pharmacy_code')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            name: 'Test Pharmacy',
            owner_id: 'owner-123',
            pharmacy_code: 'testpharm',
          }),
        })
      } else if (url.includes('id=eq.1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            name: 'Test Pharmacy',
            owner_id: 'owner-123',
            pharmacy_code: 'testpharm',
            city: 'Kathmandu',
            tole: 'Thamel',
            phone: '9800000000',
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Mock Staff Login RPC
    await page.route(/.*\/rest\/v1\/rpc\/login_staff_device/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          staff: {
            id: 'staff-123',
            name: 'Test Staff',
            role: 'pharmacist',
            pharmacy_id: 1,
            is_active: true,
            pin_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // SHA256 of 1234
          },
          credentials: {
            email: 'staff@example.com',
            password: 'password123',
          },
        }),
      })
    })

    // Mock Supabase Auth Login
    await page.route(/.*\/auth\/v1\/token.*/, async (route) => {
      console.log('Mocking Auth Token Request')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdGFmZi11c2VyLWlkIiwiZW1haWwiOiJzdGFmZkBleGFtcGxlLmNvbSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImlhdCI6MTcxNTQ2NTYwMCwiZXhwIjoxOTAwMDAwMDAwfQ.signature',
          refresh_token: 'fake-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: 'staff-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'staff@example.com',
            email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Mock Provisioning (Staff List)
    await page.route(/.*\/rest\/v1\/staff.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'staff-123',
            name: 'Test Staff',
            role: 'pharmacist',
            pharmacy_id: 1,
            pin_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
          },
        ]),
      })
    })

    await page.goto('/login')

    // Step 1: Pharmacy Code
    await page.fill('#pharmacyCode', 'testpharm')
    await page.click('button:has-text("Find Pharmacy")')

    // Step 2: Employee ID
    await expect(page.getByText('Test Pharmacy')).toBeVisible()
    await page.fill('input[placeholder="e.g., SARAH"]', 'STAFF1')
    await page.click('button:has-text("Next")')

    // Step 3: PIN
    await expect(page.getByText('Hello, STAFF1')).toBeVisible()
    // Enter PIN 1234
    await page.click('button:has-text("1")')
    await page.click('button:has-text("2")')
    await page.click('button:has-text("3")')
    await page.click('button:has-text("4")')

    // Check for error message
    const errorMessage = page.locator('.text-red-400')
    if (await errorMessage.isVisible()) {
      const text = await errorMessage.textContent()
      console.error(`Login failed with message: ${text}`)
      throw new Error(`Login failed with message: ${text}`)
    }

    // Expect redirection to Home
    try {
      await expect(page).toHaveURL('/')
    } catch (e) {
      console.log('Current URL:', page.url())
      const errorMsg = page.locator('.text-red-400')
      if (await errorMsg.isVisible()) {
        console.log('Error Message on Page:', await errorMsg.textContent())
      }
      fs.writeFileSync('failure.html', await page.content())
      throw e
    }
    await expect(page.getByText('Welcome, Test Staff!')).toBeVisible()
  })
})
