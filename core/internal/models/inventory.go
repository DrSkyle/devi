package models

import (
	"github.com/google/uuid"
	"time"
)

// InventoryItem represents a stock item in a pharmacy.
type InventoryItem struct {
	ID           uuid.UUID `json:"id"`
	PharmacyID   uuid.UUID `json:"pharmacy_id"`
	Name         string    `json:"name"`
	GenericName  string    `json:"generic_name"`
	PriceCents   int64     `json:"price_cents"` // In cents
	Stock        int       `json:"stock"`
	IsControlled bool      `json:"is_controlled"` // For DDA
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
