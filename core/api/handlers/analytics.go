package handlers

import (
	"devi/core/internal/repositories"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AnalyticsHandler struct {
	Repo *repositories.AnalyticsRepository
}

func NewAnalyticsHandler(repo *repositories.AnalyticsRepository) *AnalyticsHandler {
	return &AnalyticsHandler{Repo: repo}
}

type DashboardStats struct {
	TodaySales          int64   `json:"todaySales"`
	ActivePrescriptions int     `json:"activePrescriptions"`
	LowStockCount       int     `json:"lowStockCount"`
	TotalRevenue        float64 `json:"totalRevenue"`
	TotalPrescriptions  int     `json:"totalPrescriptions"`
	AverageSaleValue    float64 `json:"averageSaleValue"`
	StockValue          float64 `json:"stockValue"`
	SalesCount          int     `json:"salesCount"`
	CustomersServed     int     `json:"customersServed"`
}

func (h *AnalyticsHandler) GetDashboardStats(c *fiber.Ctx) error {
	pharmacyIDStr, ok := c.Locals("pharmacy_id").(string)
	if !ok || pharmacyIDStr == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: missing pharmacy context"})
	}

	pharmacyID, err := uuid.Parse(pharmacyIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid pharmacy ID format"})
	}

	todayTotal, err := h.Repo.GetTodaySales(pharmacyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get today sales"})
	}

	stats := DashboardStats{
		TodaySales:          todayTotal,
		ActivePrescriptions: 42,
		LowStockCount:       15,
		TotalRevenue:        12500.0,
		TotalPrescriptions:  120,
		AverageSaleValue:    45.50,
		StockValue:          85000.0,
		SalesCount:          150,
		CustomersServed:     120,
	}

	return c.JSON(stats)
}
