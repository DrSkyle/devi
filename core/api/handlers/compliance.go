package handlers

import (
	"devi/core/internal/repositories"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ComplianceHandler struct {
	Repo *repositories.ComplianceRepository
}

func NewComplianceHandler(repo *repositories.ComplianceRepository) *ComplianceHandler {
	return &ComplianceHandler{Repo: repo}
}

func (h *ComplianceHandler) GetPendingDDALogs(c *fiber.Ctx) error {
	pharmacyIDStr, ok := c.Locals("pharmacy_id").(string)
	if !ok || pharmacyIDStr == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: missing pharmacy context"})
	}

	pharmacyID, err := uuid.Parse(pharmacyIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid pharmacy ID format"})
	}

	logs, err := h.Repo.GetPendingDDALogs(pharmacyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get pending DDA logs"})
	}

	return c.JSON(logs)
}

func (h *ComplianceHandler) GetApprovedDDALogs(c *fiber.Ctx) error {
	pharmacyIDStr, ok := c.Locals("pharmacy_id").(string)
	if !ok || pharmacyIDStr == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: missing pharmacy context"})
	}

	pharmacyID, err := uuid.Parse(pharmacyIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid pharmacy ID format"})
	}

	logs, err := h.Repo.GetApprovedDDALogs(pharmacyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get approved DDA logs"})
	}

	return c.JSON(logs)
}

func (h *ComplianceHandler) GetRejectedDDALogs(c *fiber.Ctx) error {
	pharmacyIDStr, ok := c.Locals("pharmacy_id").(string)
	if !ok || pharmacyIDStr == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: missing pharmacy context"})
	}

	pharmacyID, err := uuid.Parse(pharmacyIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid pharmacy ID format"})
	}

	logs, err := h.Repo.GetRejectedDDALogs(pharmacyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get rejected DDA logs"})
	}

	return c.JSON(logs)
}

func (h *ComplianceHandler) ApproveDDARequest(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "DDA Approved"})
}

func (h *ComplianceHandler) RejectDDARequest(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "DDA Rejected"})
}
