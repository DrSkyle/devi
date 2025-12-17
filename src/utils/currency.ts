import currency from 'currency.js'

// Standard configuration for NPR (Nepalese Rupee)
const NPR_OPTS = {
  symbol: 'Rs. ',
  precision: 2,
  separator: ',',
  decimal: '.',
}

export const formatCurrency = (value: number | string) => {
  return currency(value, NPR_OPTS).format()
}

export const addMoney = (a: number | string, b: number | string) => {
  return currency(a).add(b).value
}

export const subtractMoney = (a: number | string, b: number | string) => {
  return currency(a).subtract(b).value
}

export const multiplyMoney = (a: number | string, b: number | string) => {
  return currency(a).multiply(b).value
}

export const divideMoney = (a: number | string, b: number | string) => {
  return currency(a).divide(b).value
}

// Helper for tax calculations
export const calculateTax = (amount: number, taxRate: number) => {
  return currency(amount).multiply(taxRate).divide(100).value
}
