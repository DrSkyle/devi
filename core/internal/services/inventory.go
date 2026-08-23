package services

import (
	"context"
	"devi/core/internal/models"
	"devi/core/internal/repositories"

	"github.com/google/uuid"
)

type InventoryService struct {
	Repo *repositories.InventoryRepository
}

func NewInventoryService(repo *repositories.InventoryRepository) *InventoryService {
	return &InventoryService{Repo: repo}
}

func (s *InventoryService) ValidateSaleItem(ctx context.Context, inventoryID, pharmacyID uuid.UUID, quantity int) error {
	item, err := s.Repo.FindByID(inventoryID)
	if err != nil {
		return err
	}
	if item.Stock < quantity {
		return models.ErrInsufficientStock
	}
	return nil
}

func (s *InventoryService) ReleaseStock(ctx context.Context, inventoryID uuid.UUID, quantity int) error {
	// Placeholder: In a real app, this would deduct stock from DB
	return nil
}
