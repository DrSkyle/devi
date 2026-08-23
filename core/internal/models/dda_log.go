package models

import (
	"github.com/google/uuid"
	"time"
)

// DDALog represents a Drug and Drug Administration audit log entry.
type DDALog struct {
	ID           uuid.UUID    `json:"id"`
	PharmacyID   uuid.UUID    `json:"pharmacy_id"`
	CashierID    uuid.UUID    `json:"cashier_id"`
	PharmacistID *uuid.UUID   `json:"pharmacist_id,omitempty"`
	SaleID       uuid.UUID    `json:"sale_id"`
	Status       DDALogStatus `json:"status"`
	Reason       string       `json:"reason,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type DDALogStatus string

const (
	DDALogStatusPending  DDALogStatus = "PENDING"
	DDALogStatusApproved DDALogStatus = "APPROVED"
	DDALogStatusRejected DDALogStatus = "REJECTED"
)
