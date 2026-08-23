package repositories

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsRepository struct {
	Pool *pgxpool.Pool
}

func NewAnalyticsRepository(pool *pgxpool.Pool) *AnalyticsRepository {
	return &AnalyticsRepository{Pool: pool}
}

func (r *AnalyticsRepository) GetTodaySales(pharmacyID uuid.UUID) (int64, error) {
	var total int64
	err := r.Pool.QueryRow(context.Background(), `SELECT COALESCE(SUM(total), 0) FROM sales WHERE pharmacy_id = $1 AND DATE(created_at) = CURRENT_DATE`, pharmacyID).Scan(&total)
	if err != nil {
		return 0, err
	}
	return total, nil
}
