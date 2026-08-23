package repositories

import (
	"context"
	"devi/core/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ComplianceRepository struct {
	Pool *pgxpool.Pool
}

func NewComplianceRepository(pool *pgxpool.Pool) *ComplianceRepository {
	return &ComplianceRepository{Pool: pool}
}

func (c *ComplianceRepository) GetPendingDDALogs(pharmacyID uuid.UUID) ([]*models.DDALog, error) {
	rows, err := c.Pool.Query(context.Background(), `SELECT id, cashier_id, created_at, status FROM dda_audit_logs WHERE pharmacy_id = $1 AND status = 'PENDING' ORDER BY created_at DESC`, pharmacyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.DDALog
	for rows.Next() {
		log := &models.DDALog{}
		if err := rows.Scan(&log.ID, &log.CashierID, &log.CreatedAt, &log.Status); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (c *ComplianceRepository) GetApprovedDDALogs(pharmacyID uuid.UUID) ([]*models.DDALog, error) {
	rows, err := c.Pool.Query(context.Background(), `SELECT id, cashier_id, created_at, status FROM dda_audit_logs WHERE pharmacy_id = $1 AND status = 'APPROVED' ORDER BY created_at DESC`, pharmacyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.DDALog
	for rows.Next() {
		log := &models.DDALog{}
		if err := rows.Scan(&log.ID, &log.CashierID, &log.CreatedAt, &log.Status); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (c *ComplianceRepository) GetRejectedDDALogs(pharmacyID uuid.UUID) ([]*models.DDALog, error) {
	rows, err := c.Pool.Query(context.Background(), `SELECT id, cashier_id, created_at, status FROM dda_audit_logs WHERE pharmacy_id = $1 AND status = 'REJECTED' ORDER BY created_at DESC`, pharmacyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.DDALog
	for rows.Next() {
		log := &models.DDALog{}
		if err := rows.Scan(&log.ID, &log.CashierID, &log.CreatedAt, &log.Status); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (c *ComplianceRepository) ApproveDDA(pharmacyID, logID uuid.UUID) error {
	_, err := c.Pool.Exec(context.Background(), `UPDATE dda_audit_logs SET status = 'APPROVED' WHERE pharmacy_id = $1 AND id = $2`, pharmacyID, logID)
	return err
}

func (c *ComplianceRepository) RejectDDA(pharmacyID, logID uuid.UUID) error {
	_, err := c.Pool.Exec(context.Background(), `UPDATE dda_audit_logs SET status = 'REJECTED' WHERE pharmacy_id = $1 AND id = $2`, pharmacyID, logID)
	return err
}
