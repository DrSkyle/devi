package models

import "errors"

var (
	ErrInsufficientStock = errors.New("insufficient stock for item")
	ErrItemExpired       = errors.New("item has expired")
	ErrItemNotFound      = errors.New("item not found in inventory")
	ErrPharmacyMismatch  = errors.New("item does not belong to this pharmacy")
)
