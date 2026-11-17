package models

import "errors"

var (
	ErrInsufficientStock = errors.New("insufficient stock for item")
	ErrItemExpired       = errors.New("item has expired")
	ErrItemNotFound      = errors.New("item not found in inventory")
	ErrPharmacyMismatch  = errors.New("item does not belong to this pharmacy")

	// ErrDDANotFound is returned when a DDA log does not exist for the pharmacy.
	ErrDDANotFound = errors.New("dda log not found")
	// ErrDDAAlreadyDecided is returned when a DDA log is no longer pending.
	ErrDDAAlreadyDecided = errors.New("dda log has already been approved or rejected")
)
