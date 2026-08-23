package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InventoryHandler struct {
	DB *pgxpool.Pool
}

func NewInventoryHandler(db *pgxpool.Pool) *InventoryHandler {
	return &InventoryHandler{DB: db}
}

func (h *InventoryHandler) AddInventory(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Inventory added"})
}

func (h *InventoryHandler) SearchMasterCatalog(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Catalog searched"})
}
