package services

import (
	"context"
	"devi/core/internal/models"
	"devi/core/internal/repositories"
	"encoding/json"
	"log"

	"github.com/google/uuid"
)

const (
	// ddaEventsTopic is where real-time DDA decisions are published for Centrifugo.
	ddaEventsTopic = "compliance.dda"
	// dashboardLogLimit caps the audit trail returned to the compliance screen.
	dashboardLogLimit = 200
)

// EventPublisher publishes events to the real-time bus (NATS, bridged to Centrifugo).
type EventPublisher interface {
	Publish(topic string, message []byte) error
}

// ddaEvent is the payload broadcast when a DDA entry changes state.
type ddaEvent struct {
	Event  string              `json:"event"`
	LogID  uuid.UUID           `json:"log_id"`
	Status models.DDALogStatus `json:"status"`
}

// ComplianceService enforces DDA rules on top of the audit log repository.
type ComplianceService struct {
	Repo      *repositories.ComplianceRepository
	Publisher EventPublisher
}

func NewComplianceService(repo *repositories.ComplianceRepository, publisher EventPublisher) *ComplianceService {
	return &ComplianceService{Repo: repo, Publisher: publisher}
}

// Dashboard returns the audit trail and the KPI counts for a pharmacy.
func (s *ComplianceService) Dashboard(ctx context.Context, pharmacyID uuid.UUID) ([]models.DDALogView, models.DDAStats, error) {
	logs, err := s.Repo.ListDDALogs(ctx, pharmacyID, dashboardLogLimit)
	if err != nil {
		return nil, models.DDAStats{}, err
	}
	stats, err := s.Repo.DDAStats(ctx, pharmacyID)
	if err != nil {
		return nil, models.DDAStats{}, err
	}
	return logs, stats, nil
}

// Approve records a pharmacist's approval of a pending DDA entry.
func (s *ComplianceService) Approve(ctx context.Context, pharmacyID, logID, pharmacistID uuid.UUID) (*models.DDALogView, error) {
	return s.decide(ctx, pharmacyID, logID, pharmacistID, models.DDALogStatusApproved)
}

// Reject records a pharmacist's rejection of a pending DDA entry.
func (s *ComplianceService) Reject(ctx context.Context, pharmacyID, logID, pharmacistID uuid.UUID) (*models.DDALogView, error) {
	return s.decide(ctx, pharmacyID, logID, pharmacistID, models.DDALogStatusRejected)
}

func (s *ComplianceService) decide(ctx context.Context, pharmacyID, logID, pharmacistID uuid.UUID, status models.DDALogStatus) (*models.DDALogView, error) {
	logEntry, err := s.Repo.DecideDDALog(ctx, pharmacyID, logID, pharmacistID, status)
	if err != nil {
		return nil, err
	}
	s.publish(*logEntry)
	return logEntry, nil
}

// publish announces the decision. The decision is already committed, so a bus
// outage must not fail the request.
func (s *ComplianceService) publish(entry models.DDALogView) {
	if s.Publisher == nil {
		return
	}
	payload, err := json.Marshal(ddaEvent{Event: "dda.updated", LogID: entry.ID, Status: entry.Status})
	if err != nil {
		log.Printf("dda: encode event for log %s: %v", entry.ID, err)
		return
	}
	if err := s.Publisher.Publish(ddaEventsTopic, payload); err != nil {
		log.Printf("dda: publish event for log %s: %v", entry.ID, err)
	}
}
