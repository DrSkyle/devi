package services

import (
	"devi/core/internal/models"
	"devi/core/internal/repositories"
	"github.com/google/uuid"
)

type ComplianceService struct {
	Repo *repositories.ComplianceRepository
}

func NewComplianceService(repo *repositories.ComplianceRepository) *ComplianceService {
	return &ComplianceService{Repo: repo}
}

func (s *ComplianceService) GetPendingDDALogs(pharmacyID uuid.UUID) ([]*models.DDALog, error) {
	return s.Repo.GetPendingDDALogs(pharmacyID)
}

func (s *ComplianceService) GetApprovedDDALogs(pharmacyID uuid.UUID) ([]*models.DDALog, error) {
	return s.Repo.GetApprovedDDALogs(pharmacyID)
}

func (s *ComplianceService) GetRejectedDDALogs(pharmacyID uuid.UUID) ([]*models.DDALog, error) {
	return s.Repo.GetRejectedDDALogs(pharmacyID)
}

func (s *ComplianceService) ApproveDDA(pharmacyID, logID uuid.UUID) error {
	return s.Repo.ApproveDDA(pharmacyID, logID)
}

func (s *ComplianceService) RejectDDA(pharmacyID, logID uuid.UUID) error {
	return s.Repo.RejectDDA(pharmacyID, logID)
}
