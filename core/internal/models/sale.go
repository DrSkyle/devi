package models

import (
	"github.com/google/uuid"
	"time"
)

// SaleItem represents an item within a point-of-sale transaction.
type SaleItem struct {
	ID          uuid.UUID `json:"id"`
	SaleID      uuid.UUID `json:"sale_id"`
	InventoryID uuid.UUID `json:"inventory_id"`
	Quantity    int       `json:"quantity"`
	UnitPrice   int64     `json:"unit_price"`  // In cents
	TotalPrice  int64     `json:"total_price"` // In cents
}

// Sale represents a complete point-of-sale transaction.
type Sale struct {
	ID            uuid.UUID  `json:"id"`
	PharmacyID    uuid.UUID  `json:"pharmacy_id"`
	CustomerID    *uuid.UUID `json:"customer_id,omitempty"`
	StaffID       uuid.UUID  `json:"staff_id"`
	KioskID       uuid.UUID  `json:"kiosk_id"`
	Total         int64      `json:"total"` // In cents
	Items         []SaleItem `json:"items"`
	PaymentMethod string     `json:"payment_method"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
