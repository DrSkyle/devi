/**
 * Inventory Management Math Utilities
 * Implements Economic Order Quantity (EOQ) and Reorder Point (ROP) calculations.
 */

export interface EOQParams {
  annualDemand: number // D: Total units sold per year
  orderingCost: number // S: Cost per order (shipping, handling, admin)
  holdingCost: number // H: Cost to hold one unit for a year
}

export interface ROPParams {
  dailyUsage: number // Average daily sales
  leadTime: number // Days to receive order
  safetyStock: number // Buffer stock
}

/**
 * Calculate Economic Order Quantity (EOQ)
 * Formula: sqrt((2 * D * S) / H)
 */
export const calculateEOQ = ({ annualDemand, orderingCost, holdingCost }: EOQParams): number => {
  if (holdingCost <= 0 || annualDemand <= 0) return 0
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
  return Math.ceil(eoq) // Round up to nearest whole unit
}

/**
 * Calculate Reorder Point (ROP)
 * Formula: (Daily Usage * Lead Time) + Safety Stock
 */
export const calculateROP = ({ dailyUsage, leadTime, safetyStock }: ROPParams): number => {
  return Math.ceil(dailyUsage * leadTime + safetyStock)
}

/**
 * Analyze Inventory Health
 * Returns status based on current stock vs ROP
 */
export const getInventoryStatus = (currentStock: number, rop: number) => {
  if (currentStock === 0) return 'Out of Stock'
  if (currentStock <= rop) return 'Reorder Now'
  if (currentStock <= rop * 1.5) return 'Low Stock'
  return 'Healthy'
}
