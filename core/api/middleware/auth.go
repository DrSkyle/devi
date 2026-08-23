package middleware

import (
	"log"
	"strings"


	"github.com/MicahParks/keyfunc/v3"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var jwks keyfunc.Keyfunc

// InitAuth initializes the JWKS fetcher for Zitadel
func InitAuth(zitadelDomain string) {
	jwksURL := zitadelDomain + "/oauth/v2/keys"
	
	// Create a new keyfunc instance
	var err error
	jwks, err = keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		log.Printf("Warning: Failed to create JWKS from Zitadel. Auth will fall back to local dev key. Error: %s", err.Error())
		jwks = nil
	}
}

// AuthMiddleware enforces that a valid JWT token is provided.
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header format",
			})
		}

		tokenString := parts[1]

		var token *jwt.Token
		var err error

		if jwks != nil {
			token, err = jwt.Parse(tokenString, jwks.Keyfunc)
		}

		// Fallback to local dev secret if JWKS is down or token is local
		if err != nil || token == nil || !token.Valid {
			token, err = jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				return []byte("devi-secret-key-for-jwt-testing-12345"), nil
			})
		}

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or expired token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token claims",
			})
		}

		// Extract context variables from claims
		kioskID, _ := claims["kiosk_id"].(string)
		pharmacyID, _ := claims["pharmacy_id"].(string)
		role, _ := claims["role"].(string)

		// Check if it's a hardware-bound Kiosk token
		if kioskID == "" || pharmacyID == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "token is not hardware-bound to a kiosk",
			})
		}

		// Store variables in Fiber context for subsequent handlers
		c.Locals("kiosk_id", kioskID)
		c.Locals("pharmacy_id", pharmacyID)
		c.Locals("role", role)

		return c.Next()
	}
}

// RoleMiddleware enforces that the user has a specific role (e.g., 'PHARMACIST' for approvals).
func RoleMiddleware(requiredRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "role not found in context",
			})
		}

		for _, role := range requiredRoles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "insufficient permissions",
		})
	}
}
