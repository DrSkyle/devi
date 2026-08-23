package handlers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
)

type InvoiceHandler struct {
	DB *pgxpool.Pool
	JS nats.JetStreamContext
}

func NewInvoiceHandler(db *pgxpool.Pool, js nats.JetStreamContext) *InvoiceHandler {
	return &InvoiceHandler{DB: db, JS: js}
}

// UploadInvoice handles the Drag & Drop of Excel/PDF supplier invoices
func (h *InvoiceHandler) UploadInvoice(c *fiber.Ctx) error {
	pharmacyID, ok := c.Locals("pharmacy_id").(string)
	if !ok || pharmacyID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "pharmacy context missing"})
	}

	// 1. Parse Multipart Form
	fileHeader, err := c.FormFile("invoice")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invoice file is required"})
	}

	// 2. Validate Extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".pdf" && ext != ".xls" && ext != ".xlsx" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "only PDF or Excel files are supported"})
	}

	// 3. Save File Temporarily
	tempFile, err := os.CreateTemp("", fmt.Sprintf("invoice-*%s", ext))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to process file"})
	}
	defer os.Remove(tempFile.Name())

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to open file"})
	}
	defer file.Close()

	if _, err := io.Copy(tempFile, file); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save file"})
	}

	// 4. Send to the asynchronous AI / OCR Pipeline
	// In production, this file path is passed to PaddleOCR via a background job (Asynq)
	// We will enqueue it to the Redis queue here so the API doesn't block.
	jobID, err := h.enqueueOCRJob(pharmacyID, tempFile.Name())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to queue invoice for processing"})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"status": "processing",
		"job_id": jobID,
		"message": "Invoice is being parsed by the AI. Inventory will update shortly.",
	})
}

func (h *InvoiceHandler) enqueueOCRJob(pharmacyID, filePath string) (string, error) {
	jobID := "job_" + filepath.Base(filePath)
	
	if h.JS != nil {
		_, err := h.JS.Publish("ocr.process", []byte(fmt.Sprintf(`{"pharmacy_id": "%s", "file_path": "%s", "job_id": "%s"}`, pharmacyID, filePath, jobID)))
		if err != nil {
			return "", err
		}
	}
	
	return jobID, nil
}
