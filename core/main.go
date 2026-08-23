package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"devi/core/api/handlers"
	"devi/core/api/middleware"
	"devi/core/api/services"
	"devi/core/internal/repositories"
	coreServices "devi/core/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"

	"github.com/gofiber/contrib/otelfiber/v2"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

type AppState struct {
	DB   *pgxpool.Pool
	NATS *nats.Conn
	JS   nats.JetStreamContext
}

func initTracer() func(context.Context) error {
	ctx := context.Background()
	res, err := resource.New(ctx, resource.WithAttributes(semconv.ServiceName("devi-core-api")))
	if err != nil {
		log.Fatal(err)
	}
	traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithInsecure(), otlptracegrpc.WithEndpoint("localhost:4317"))
	if err != nil {
		log.Fatal(err)
	}
	bsp := sdktrace.NewBatchSpanProcessor(traceExporter)
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(bsp),
	)
	otel.SetTracerProvider(tracerProvider)
	return tracerProvider.Shutdown
}

func main() {
	ctx := context.Background()

	// --- 1. Initialize Infrastructure ---

	// PostgreSQL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/devi?sslmode=disable"
	}
	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer dbPool.Close()
	log.Println("Database connection established.")

	// NATS
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Printf("Warning: Unable to connect to NATS (%v). Operating without event bus.\n", err)
	} else {
		defer nc.Close()
	}

	var js nats.JetStreamContext
	if nc != nil {
		js, err = nc.JetStream()
		if err != nil {
			log.Fatalf("Unable to initialize JetStream: %v\n", err)
		}
	}

	// --- 2. Initialize Clean Architecture Layers ---

	// Repositories
	inventoryRepo := repositories.NewInventoryRepository(dbPool)
	saleRepo := repositories.NewSaleRepository(dbPool)
	complianceRepo := repositories.NewComplianceRepository(dbPool)
	analyticsRepo := repositories.NewAnalyticsRepository(dbPool)

	// Services (The "Brain")
	inventoryService := coreServices.NewInventoryService(inventoryRepo)
	posService := coreServices.NewPOSService(saleRepo, inventoryService)
	complianceService := coreServices.NewComplianceService(complianceRepo)

	// Publishers (Real-time)
	publisher := services.NewCentrifugoPublisher()

	// Start Server
	app := fiber.New(fiber.Config{
		AppName:      "DEVI Core API v1.0",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	shutdown := initTracer()
	defer shutdown(context.Background())

	app.Use(otelfiber.Middleware())
	app.Use(cors.New())

	// Ensure pharmacies schema is fully loaded (local-first compatibility)
	log.Println("Verifying database schema...")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS pharmacy_code VARCHAR(100) UNIQUE;")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS province VARCHAR(100);")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS district VARCHAR(100);")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS city VARCHAR(100);")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS tole VARCHAR(100);")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;")
	_, _ = dbPool.Exec(ctx, "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;")

	state := &AppState{DB: dbPool, NATS: nc, JS: js}
	setupRoutes(app, state, posService, complianceService, analyticsRepo, inventoryRepo, complianceRepo, publisher)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Printf("Starting DEVI Core API on port %s", port)
	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func setupRoutes(app *fiber.App, state *AppState, posService *coreServices.POSService, complianceService *coreServices.ComplianceService, analyticsRepo *repositories.AnalyticsRepository, inventoryRepo *repositories.InventoryRepository, complianceRepo *repositories.ComplianceRepository, publisher services.Publisher) {
	api := app.Group("/api/v1")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Initialize Handlers
	posHandler := handlers.NewPOSHandler(state.DB, publisher)
	inventoryHandler := handlers.NewInventoryHandler(state.DB)
	invoiceHandler := handlers.NewInvoiceHandler(state.DB, state.JS)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsRepo)
	authHandler := handlers.NewAuthHandler(state.DB)

	// Auth
	zitadelDomain := os.Getenv("ZITADEL_DOMAIN")
	if zitadelDomain == "" {
		zitadelDomain = "http://localhost:8080"
	}
	middleware.InitAuth(zitadelDomain)

	// Public Routes
	api.Get("/catalog/search", inventoryHandler.SearchMasterCatalog)
	api.Post("/auth/signup", authHandler.Signup)
	api.Get("/auth/staff-list", authHandler.StaffList)
	api.Post("/auth/login", authHandler.Login)

	// Protected Routes
	protected := api.Group("/", middleware.AuthMiddleware())

	// Auth Protected
	protected.Get("/auth/me", authHandler.Me)
	protected.Post("/auth/staff", middleware.RoleMiddleware("OWNER"), authHandler.AddStaff)

	// Inventory
	inventory := protected.Group("/inventory")
	inventory.Post("/", middleware.RoleMiddleware("OWNER", "PHARMACIST"), inventoryHandler.AddInventory)
	inventory.Post("/upload-invoice", middleware.RoleMiddleware("OWNER"), invoiceHandler.UploadInvoice)

	// POS
	pos := protected.Group("/pos")
	pos.Post("/sale", middleware.RoleMiddleware("CASHIER", "PHARMACIST"), posHandler.ProcessSale)

	// Analytics
	analytics := protected.Group("/analytics")
	analytics.Get("/dashboard", analyticsHandler.GetDashboardStats)

	// Compliance
	compliance := protected.Group("/compliance")
	complianceHandler := handlers.NewComplianceHandler(complianceRepo)
	compliance.Get("/dda-logs", complianceHandler.GetPendingDDALogs)
	compliance.Post("/dda-logs/:id/approve", complianceHandler.ApproveDDARequest)
}
