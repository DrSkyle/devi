import { z } from 'zod'

// Centralized Zod schemas for DDD validation

export const saleItemSchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().positive(),
  isDDA: z.boolean().default(false),
})

export const processSaleSchema = z.object({
  pharmacyId: z.string().uuid(),
  kioskId: z.string().uuid(),
  staffId: z.string().uuid(),
  totalAmount: z.number().int().positive(),
  paymentMethod: z.enum(['CASH', 'CREDIT', 'FONEPAY', 'ESEWA']),
  items: z.array(saleItemSchema).min(1),
})

export const addInventorySchema = z.object({
  masterId: z.string().uuid(),
  batchNumber: z.string().min(1),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  totalTablets: z.number().int().positive(),
  tabletsPerStrip: z.number().int().positive(),
  stripsPerBox: z.number().int().positive(),
  costPrice: z.number().int().positive(),
  sellingPrice: z.number().int().positive(),
})
