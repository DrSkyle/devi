package services

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ItemDetail represents the necessary details for a sale transaction
type ItemDetail struct {
	ID           string    `db:"id"`
	BatchNumber  string    `db:"batch_number"`
	ExpiryDate   time.Time `db:"expiry_date"`
	TotalTablets int       `db:"total_tablets"`
	PharmacyID   string    `db:"pharmacy_id"`
}

// InventoryService wraps inventory-related business logic
type InventoryService struct {
	DB *pgxpool.Pool
}

func NewInventoryService(db *pgxpool.Pool) *InventoryService {
	return &InventoryService{DB: db}
}

// GetItemDetails fetches the critical details of an inventory item for verification.
func (s *InventoryService) GetItemDetails(ctx context.Context, inventoryID string) (*ItemDetail, error) {
	var item ItemDetail
	err := s.DB.QueryRow(ctx, `
		SELECT id, batch_number, expiry_date, total_tablets, pharmacy_id 
		FROM inventory 
		WHERE id = $1`, inventoryID).Scan(
		&item.ID, &item.BatchNumber, &item.ExpiryDate, &item.TotalTablets, &item.PharmacyID,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("inventory item %s not found", inventoryID)
		}
		return nil, fmt.Errorf("failed to get item details: %w", err)
	}
	return &item, nil
}

// ValidateSaleItem checks if a sale is possible: stock sufficiency and non-expired batch.
// It returns an error if the sale cannot proceed.
func (s *InventoryService) ValidateSaleItem(ctx context.Context, inventoryID string, quantity int) error {
	item, err := s.GetItemDetails(ctx, inventoryID)
	if err != nil {
		return err
	}

	if item.TotalTablets < quantity {
		return fmt.Errorf("insufficient stock for item %s: available %d, requested %d", inventoryID, item.TotalTablets, quantity)
	}

	if time.Now().After(item.ExpiryDate) {
		return fmt.Errorf("item %s (batch %s) is expired", inventoryID, item.BatchNumber)
	}

	return nil
}
