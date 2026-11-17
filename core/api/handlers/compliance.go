package handlers

import (
	"context"
	"devi/core/internal/models"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ComplianceService is the DDA behaviour this API depends on.
type ComplianceService interface {
	Dashboard(ctx context.Context, pharmacyID uuid.UUID) ([]models.DDALogView, models.DDAStats, error)
	Approve(ctx context.Context, pharmacyID, logID, pharmacistID uuid.UUID) (*models.DDALogView, error)
	Reject(ctx context.Context, pharmacyID, logID, pharmacistID uuid.UUID) (*models.DDALogView, error)
}

type ComplianceHandler struct {
	Service ComplianceService
}

func NewComplianceHandler(service ComplianceService) *ComplianceHandler {
	return &ComplianceHandler{Service: service}
}

// GetDDALogs returns the pharmacy's audit trail with the dashboard KPI counts.
func (h *ComplianceHandler) GetDDALogs(c *fiber.Ctx) error {
	pharmacyID, err := pharmacyIDFromContext(c)
	if err != nil {
		return err
	}

	logs, stats, err := h.Service.Dashboard(c.UserContext(), pharmacyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load dda logs"})
	}

	return c.JSON(fiber.Map{
		"logs":          logs,
		"pendingCount":  stats.Pending,
		"approvedToday": stats.ApprovedToday,
		"rejectedToday": stats.RejectedToday,
	})
}

// ApproveDDARequest approves a pending DDA entry as the authenticated pharmacist.
func (h *ComplianceHandler) ApproveDDARequest(c *fiber.Ctx) error {
	return h.decide(c, models.DDALogStatusApproved)
}

// RejectDDARequest rejects a pending DDA entry as the authenticated pharmacist.
func (h *ComplianceHandler) RejectDDARequest(c *fiber.Ctx) error {
	return h.decide(c, models.DDALogStatusRejected)
}

func (h *ComplianceHandler) decide(c *fiber.Ctx, status models.DDALogStatus) error {
	pharmacyID, err := pharmacyIDFromContext(c)
	if err != nil {
		return err
	}

	pharmacistID, err := staffIDFromContext(c)
	if err != nil {
		return err
	}

	logID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid dda log id"})
	}

	var entry *models.DDALogView
	if status == models.DDALogStatusApproved {
		entry, err = h.Service.Approve(c.UserContext(), pharmacyID, logID, pharmacistID)
	} else {
		entry, err = h.Service.Reject(c.UserContext(), pharmacyID, logID, pharmacistID)
	}

	switch {
	case err == nil:
		return c.JSON(fiber.Map{"log": entry})
	case errors.Is(err, models.ErrDDANotFound):
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	case errors.Is(err, models.ErrDDAAlreadyDecided):
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update dda log"})
	}
}

// pharmacyIDFromContext reads the pharmacy the request is scoped to.
func pharmacyIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	raw, ok := c.Locals("pharmacy_id").(string)
	if !ok || raw == "" {
		return uuid.Nil, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing pharmacy context"})
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid pharmacy id"})
	}
	return id, nil
}

// staffIDFromContext reads the authenticated staff member, used as the approver.
func staffIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	raw, ok := c.Locals("staff_id").(string)
	if !ok || raw == "" {
		return uuid.Nil, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing staff context"})
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid staff id"})
	}
	return id, nil
}
