package services

import (
	"context"
	"devi/core/internal/models"
	"devi/core/internal/repositories"

	"github.com/google/uuid"
)

type POSService struct {
	SaleRepo     *repositories.SaleRepository
	InventorySvc *InventoryService
}

func NewPOSService(saleRepo *repositories.SaleRepository, inventorySvc *InventoryService) *POSService {
	return &POSService{
		SaleRepo:     saleRepo,
		InventorySvc: inventorySvc,
	}
}

func (s *POSService) ProcessSale(ctx context.Context, pharmacyID uuid.UUID, items []models.SaleItem) (*models.Sale, error) {
	// 1. Business Logic: Validate items and check stock
	for _, item := range items {
		if err := s.InventorySvc.ValidateSaleItem(ctx, item.InventoryID, pharmacyID, item.Quantity); err != nil {
			return nil, err
		}
	}

	// 2. Calculate total
	var total int64
	for _, item := range items {
		total += item.TotalPrice
	}

	// 3. Create Sale Record & Deduct Stock (Atomic Transaction)
	sale := &models.Sale{
		PharmacyID: pharmacyID,
		Total:      total,
		Items:      items,
	}

	// In a real app, this would be a DB transaction
	if err := s.SaleRepo.Create(sale); err != nil {
		return nil, err
	}

	// 4. Release stock for each item
	for _, item := range items {
		if err := s.InventorySvc.ReleaseStock(ctx, item.InventoryID, item.Quantity); err != nil {
			// Handle partial failure, log, etc.
			return nil, err
		}
	}

	return sale, nil
}
