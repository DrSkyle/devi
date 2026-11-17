package repositories

import (
	"context"
	"devi/core/internal/models"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ddaLogSelect joins the audit entry to the staff member it belongs to. A
// pending entry has no pharmacist yet, so the cashier who raised it is shown.
const ddaLogSelect = `
	SELECT d.id, COALESCE(ph.name, c.name, 'Unknown'), d.created_at, d.status
	FROM dda_audit_logs d
	LEFT JOIN staff_profiles c ON c.id = d.cashier_id
	LEFT JOIN staff_profiles ph ON ph.id = d.pharmacist_id
`

type ComplianceRepository struct {
	Pool *pgxpool.Pool
}

func NewComplianceRepository(pool *pgxpool.Pool) *ComplianceRepository {
	return &ComplianceRepository{Pool: pool}
}

// ListDDALogs returns the pharmacy's audit trail, newest first.
func (c *ComplianceRepository) ListDDALogs(ctx context.Context, pharmacyID uuid.UUID, limit int) ([]models.DDALogView, error) {
	rows, err := c.Pool.Query(ctx, ddaLogSelect+`
		WHERE d.pharmacy_id = $1
		ORDER BY d.created_at DESC
		LIMIT $2`, pharmacyID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := make([]models.DDALogView, 0, limit)
	for rows.Next() {
		var log models.DDALogView
		if err := rows.Scan(&log.ID, &log.StaffName, &log.Timestamp, &log.Status); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, rows.Err()
}

// DDAStats counts the pending queue and today's decisions for a pharmacy.
func (c *ComplianceRepository) DDAStats(ctx context.Context, pharmacyID uuid.UUID) (models.DDAStats, error) {
	var stats models.DDAStats
	err := c.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status = 'PENDING'),
			COUNT(*) FILTER (WHERE status = 'APPROVED' AND approved_at >= date_trunc('day', now())),
			COUNT(*) FILTER (WHERE status = 'REJECTED' AND approved_at >= date_trunc('day', now()))
		FROM dda_audit_logs
		WHERE pharmacy_id = $1`, pharmacyID).Scan(&stats.Pending, &stats.ApprovedToday, &stats.RejectedToday)
	if err != nil {
		return models.DDAStats{}, err
	}
	return stats, nil
}

// DecideDDALog moves a PENDING entry to APPROVED or REJECTED, recording who
// decided it and when. Only the pharmacy that owns the entry may decide it.
func (c *ComplianceRepository) DecideDDALog(ctx context.Context, pharmacyID, logID, pharmacistID uuid.UUID, status models.DDALogStatus) (*models.DDALogView, error) {
	var log models.DDALogView
	err := c.Pool.QueryRow(ctx, `
		WITH decided AS (
			UPDATE dda_audit_logs
			SET status = $3, pharmacist_id = $4, approved_at = now(), updated_at = now()
			WHERE id = $2 AND pharmacy_id = $1 AND status = 'PENDING'
			RETURNING id, cashier_id, created_at, status
		)
		SELECT decided.id, COALESCE(ph.name, c.name, 'Unknown'), decided.created_at, decided.status
		FROM decided
		LEFT JOIN staff_profiles c ON c.id = decided.cashier_id
		LEFT JOIN staff_profiles ph ON ph.id = $4`, pharmacyID, logID, status, pharmacistID).
		Scan(&log.ID, &log.StaffName, &log.Timestamp, &log.Status)
	if err == nil {
		return &log, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// The update matched nothing: either the entry belongs to another pharmacy
	// or it has already been decided. Report which, so the caller can 404 vs 409.
	var current models.DDALogStatus
	err = c.Pool.QueryRow(ctx, `
		SELECT status FROM dda_audit_logs WHERE id = $1 AND pharmacy_id = $2`,
		logID, pharmacyID).Scan(&current)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, models.ErrDDANotFound
	}
	if err != nil {
		return nil, err
	}
	return nil, models.ErrDDAAlreadyDecided
}
