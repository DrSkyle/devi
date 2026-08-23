// src/shared/utils/index.ts

/**
 * Formats a number (in cents) to a currency string.
 * e.g., 1500 -> "Rs. 15.00"
 */
export function formatCurrency(valueInCents: number): string {
  const amount = valueInCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NPR',
  }).format(amount)
}

/**
 * Formats a Date object to a human-readable string.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}
