package repositories

import (
	"context"
	"devi/core/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InventoryRepository struct {
	Pool *pgxpool.Pool
}

func NewInventoryRepository(pool *pgxpool.Pool) *InventoryRepository {
	return &InventoryRepository{Pool: pool}
}

func (r *InventoryRepository) FindByID(id uuid.UUID) (*models.InventoryItem, error) {
	item := &models.InventoryItem{}
	row := r.Pool.QueryRow(context.Background(), `SELECT id, name, generic_name, price_cents, stock FROM inventory WHERE id = $1`, id)
	if err := row.Scan(&item.ID, &item.Name, &item.GenericName, &item.PriceCents, &item.Stock); err != nil {
		return nil, err
	}
	return item, nil
}

type SaleRepository struct {
	Pool *pgxpool.Pool
}

func NewSaleRepository(pool *pgxpool.Pool) *SaleRepository {
	return &SaleRepository{Pool: pool}
}

func (r *SaleRepository) Create(sale *models.Sale) error {
	_, err := r.Pool.Exec(context.Background(), `INSERT INTO sales (pharmacy_id, total, items) VALUES ($1, $2, $3)`, sale.PharmacyID, sale.Total, sale.Items)
	return err
}
