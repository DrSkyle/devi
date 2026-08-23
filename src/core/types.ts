// Core shared types for the modern frontend

export interface Pharmacy {
  id: string
  name: string
  licenseNumber: string
  address: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'pharmacist' | 'cashier'
  pharmacyId: string
}

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
