package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthHandler struct {
	DB *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{DB: db}
}

type SignupRequest struct {
	Name          string  `json:"name"`
	PharmacyCode  string  `json:"pharmacy_code"`
	LicenseNumber string  `json:"license_number"`
	OwnerPhone    string  `json:"owner_phone"`
	PanNumber     string  `json:"pan_number"`
	VatNumber     string  `json:"vat_number"`
	Province      string  `json:"province"`
	District      string  `json:"district"`
	City          string  `json:"city"`
	Tole          string  `json:"tole"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	OwnerName     string  `json:"owner_name"`
	OwnerPIN      string  `json:"owner_pin"`
}

func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Name == "" || req.PharmacyCode == "" || req.LicenseNumber == "" || req.OwnerPhone == "" || req.OwnerName == "" || req.OwnerPIN == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing required registration fields"})
	}

	// Hash the owner PIN
	hasher := sha256.New()
	hasher.Write([]byte(req.OwnerPIN))
	hashedPIN := hex.EncodeToString(hasher.Sum(nil))

	tx, err := h.DB.Begin(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to start database transaction"})
	}
	defer tx.Rollback(c.Context())

	// Check if pharmacy code already exists
	var codeExists bool
	err = tx.QueryRow(c.Context(), "SELECT EXISTS(SELECT 1 FROM pharmacies WHERE pharmacy_code = $1)", req.PharmacyCode).Scan(&codeExists)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database query error"})
	}
	if codeExists {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Pharmacy Code is already registered"})
	}

	// Insert Pharmacy
	var pharmacyID string
	err = tx.QueryRow(c.Context(), `
		INSERT INTO pharmacies (name, license_number, owner_phone, pharmacy_code, pan_number, vat_number, province, district, city, tole, latitude, longitude)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`, req.Name, req.LicenseNumber, req.OwnerPhone, req.PharmacyCode, req.PanNumber, req.VatNumber, req.Province, req.District, req.City, req.Tole, req.Latitude, req.Longitude).Scan(&pharmacyID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to insert pharmacy: " + err.Error()})
	}

	// Create Owner Staff Profile
	var staffID string
	err = tx.QueryRow(c.Context(), `
		INSERT INTO staff_profiles (pharmacy_id, name, role, hashed_pin, phone_number, is_active)
		VALUES ($1, $2, 'OWNER', $3, $4, true)
		RETURNING id
	`, pharmacyID, req.OwnerName, hashedPIN, req.OwnerPhone).Scan(&staffID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to insert owner staff profile"})
	}

	// Commit Transaction
	if err = tx.Commit(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	// Generate Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":         staffID,
		"name":        req.OwnerName,
		"role":        "OWNER",
		"kiosk_id":    "kiosk-local-dev-id",
		"pharmacy_id": pharmacyID,
		"exp":         time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte("devi-secret-key-for-jwt-testing-12345"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to sign token"})
	}

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":           staffID,
			"name":         req.OwnerName,
			"role":         "OWNER",
			"pharmacyId":   pharmacyID,
			"pharmacyName": req.Name,
		},
	})
}

func (h *AuthHandler) StaffList(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "pharmacy code is required"})
	}

	// Fetch pharmacy name & ID
	var pharmacyID, pharmacyName string
	err := h.DB.QueryRow(c.Context(), "SELECT id, name FROM pharmacies WHERE pharmacy_code = $1 AND is_active = true", code).Scan(&pharmacyID, &pharmacyName)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "pharmacy not found or inactive"})
	}

	// Fetch staff members
	rows, err := h.DB.Query(c.Context(), `
		SELECT id, name, role FROM staff_profiles
		WHERE pharmacy_id = $1 AND is_active = true
	`, pharmacyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to retrieve staff"})
	}
	defer rows.Close()

	type StaffItem struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Role string `json:"role"`
	}

	staffList := make([]StaffItem, 0)
	for rows.Next() {
		var item StaffItem
		if err := rows.Scan(&item.ID, &item.Name, &item.Role); err == nil {
			staffList = append(staffList, item)
		}
	}

	return c.JSON(fiber.Map{
		"pharmacyId":   pharmacyID,
		"pharmacyName": pharmacyName,
		"staff":        staffList,
	})
}

type LoginRequest struct {
	PharmacyCode string `json:"pharmacy_code"`
	StaffID      string `json:"staff_id"`
	PIN          string `json:"pin"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.PharmacyCode == "" || req.StaffID == "" || req.PIN == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing login credentials"})
	}

	// Verify PIN
	hasher := sha256.New()
	hasher.Write([]byte(req.PIN))
	hashedPIN := hex.EncodeToString(hasher.Sum(nil))

	var userID, userName, userRole, pharmacyID, pharmacyName string
	err := h.DB.QueryRow(c.Context(), `
		SELECT s.id, s.name, s.role, s.pharmacy_id, p.name
		FROM staff_profiles s
		JOIN pharmacies p ON s.pharmacy_id = p.id
		WHERE s.id = $1 AND p.pharmacy_code = $2 AND s.hashed_pin = $3 AND s.is_active = true
	`, req.StaffID, req.PharmacyCode, hashedPIN).Scan(&userID, &userName, &userRole, &pharmacyID, &pharmacyName)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid PIN or credentials"})
	}

	// Generate Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":         userID,
		"name":        userName,
		"role":        userRole,
		"kiosk_id":    "kiosk-local-dev-id",
		"pharmacy_id": pharmacyID,
		"exp":         time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte("devi-secret-key-for-jwt-testing-12345"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to sign token"})
	}

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":           userID,
			"name":         userName,
			"role":         userRole,
			"pharmacyId":   pharmacyID,
			"pharmacyName": pharmacyName,
		},
	})
}

type AddStaffRequest struct {
	Name        string `json:"name"`
	Role        string `json:"role"`
	PIN         string `json:"pin"`
	PhoneNumber string `json:"phone_number"`
}

func (h *AuthHandler) AddStaff(c *fiber.Ctx) error {
	pharmacyID := c.Locals("pharmacy_id")
	if pharmacyID == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "missing pharmacy registration"})
	}

	var req AddStaffRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Name == "" || req.Role == "" || req.PIN == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing staff name, role, or PIN"})
	}

	if req.Role != "PHARMACIST" && req.Role != "CASHIER" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "role must be PHARMACIST or CASHIER"})
	}

	// Hash the PIN
	hasher := sha256.New()
	hasher.Write([]byte(req.PIN))
	hashedPIN := hex.EncodeToString(hasher.Sum(nil))

	var staffID string
	err := h.DB.QueryRow(c.Context(), `
		INSERT INTO staff_profiles (pharmacy_id, name, role, hashed_pin, phone_number, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id
	`, pharmacyID, req.Name, req.Role, hashedPIN, req.PhoneNumber).Scan(&staffID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to register staff profile: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Staff member registered successfully",
		"id":      staffID,
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("sub")
	role := c.Locals("role")
	pharmacyID := c.Locals("pharmacy_id")

	// Get user & pharmacy info
	var name, pName string
	err := h.DB.QueryRow(c.Context(), `
		SELECT s.name, p.name FROM staff_profiles s
		JOIN pharmacies p ON s.pharmacy_id = p.id
		WHERE s.id = $1 AND s.is_active = true
	`, userID).Scan(&name, &pName)

	if err != nil {
		// Fallback for local testing if not in DB
		return c.JSON(fiber.Map{
			"id":           userID,
			"name":         "Authenticated Staff",
			"role":         role,
			"pharmacyId":   pharmacyID,
			"pharmacyName": "Dev Pharmacy",
		})
	}

	return c.JSON(fiber.Map{
		"id":           userID,
		"name":         name,
		"role":         role,
		"pharmacyId":   pharmacyID,
		"pharmacyName": pName,
	})
}
