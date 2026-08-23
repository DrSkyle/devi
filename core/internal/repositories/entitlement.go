package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EntitlementRepository handles feature flags and plan limits
type EntitlementRepository struct {
	Pool *pgxpool.Pool
}

func NewEntitlementRepository(pool *pgxpool.Pool) *EntitlementRepository {
	return &EntitlementRepository{Pool: pool}
}

// GetPharmacyPlan fetches the active plan for a pharmacy
func (r *EntitlementRepository) GetPharmacyPlan(ctx context.Context, pharmacyID uuid.UUID) (string, error) {
	var plan string
	err := r.Pool.QueryRow(ctx, `SELECT plan FROM pharmacy_plans WHERE pharmacy_id = $1`, pharmacyID).Scan(&plan)
	if err != nil {
		return "", fmt.Errorf("failed to get plan: %w", err)
	}
	return plan, nil
}

// SetPharmacyPlan updates a pharmacy's plan
func (r *EntitlementRepository) SetPharmacyPlan(ctx context.Context, pharmacyID uuid.UUID, plan string) error {
	_, err := r.Pool.Exec(ctx, `INSERT INTO pharmacy_plans (pharmacy_id, plan) VALUES ($1, $2) ON CONFLICT (pharmacy_id) DO UPDATE SET plan = $2`, pharmacyID, plan)
	if err != nil {
		return fmt.Errorf("failed to set plan: %w", err)
	}
	return nil
}
