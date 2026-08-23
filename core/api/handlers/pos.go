package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type POSHandler struct {
	DB        *pgxpool.Pool
	Publisher interface{}
}

func NewPOSHandler(db *pgxpool.Pool, publisher interface{}) *POSHandler {
	return &POSHandler{DB: db, Publisher: publisher}
}

func (h *POSHandler) ProcessSale(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Sale processed"})
}
