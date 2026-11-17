package handlers

import (
	"context"
	"devi/core/internal/models"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type fakeComplianceService struct {
	logs         []models.DDALogView
	stats        models.DDAStats
	dashboardErr error
	decisionErr  error

	// Captured arguments of the last decision.
	called       bool
	pharmacyID   uuid.UUID
	logID        uuid.UUID
	pharmacistID uuid.UUID
	approved     bool
}

func (f *fakeComplianceService) Dashboard(_ context.Context, pharmacyID uuid.UUID) ([]models.DDALogView, models.DDAStats, error) {
	f.pharmacyID = pharmacyID
	if f.dashboardErr != nil {
		return nil, models.DDAStats{}, f.dashboardErr
	}
	return f.logs, f.stats, nil
}

func (f *fakeComplianceService) Approve(_ context.Context, pharmacyID, logID, pharmacistID uuid.UUID) (*models.DDALogView, error) {
	f.called, f.approved = true, true
	f.pharmacyID, f.logID, f.pharmacistID = pharmacyID, logID, pharmacistID
	if f.decisionErr != nil {
		return nil, f.decisionErr
	}
	return &models.DDALogView{ID: logID, Status: models.DDALogStatusApproved}, nil
}

func (f *fakeComplianceService) Reject(_ context.Context, pharmacyID, logID, pharmacistID uuid.UUID) (*models.DDALogView, error) {
	f.called, f.approved = true, false
	f.pharmacyID, f.logID, f.pharmacistID = pharmacyID, logID, pharmacistID
	if f.decisionErr != nil {
		return nil, f.decisionErr
	}
	return &models.DDALogView{ID: logID, Status: models.DDALogStatusRejected}, nil
}

var (
	testPharmacyID = uuid.MustParse("11111111-1111-1111-1111-111111111111")
	testStaffID    = uuid.MustParse("22222222-2222-2222-2222-222222222222")
	testLogID      = uuid.MustParse("33333333-3333-3333-3333-333333333333")
)

// newTestApp mounts the handler behind a stub authenticator that injects the
// same locals the auth middleware sets.
func newTestApp(service ComplianceService) *fiber.App {
	app := fiber.New()
	handler := NewComplianceHandler(service)

	withIdentity := func(c *fiber.Ctx) error {
		c.Locals("pharmacy_id", testPharmacyID.String())
		c.Locals("staff_id", testStaffID.String())
		return c.Next()
	}

	app.Get("/compliance/dda-logs", withIdentity, handler.GetDDALogs)
	app.Post("/compliance/dda-logs/:id/approve", withIdentity, handler.ApproveDDARequest)
	app.Post("/compliance/dda-logs/:id/reject", withIdentity, handler.RejectDDARequest)
	return app
}

func do(t *testing.T, app *fiber.App, method, path string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	res, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	return res
}

func decode(t *testing.T, res *http.Response, target any) {
	t.Helper()
	defer res.Body.Close()
	if err := json.NewDecoder(res.Body).Decode(target); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}

// The compliance screen reads logs[].{id,staffName,timestamp,status} and the
// three KPI counts, so the payload shape is part of the contract.
func TestGetDDALogs_ReturnsDashboardPayload(t *testing.T) {
	created := time.Date(2026, 11, 17, 9, 30, 0, 0, time.UTC)
	service := &fakeComplianceService{
		logs: []models.DDALogView{{
			ID:        testLogID,
			StaffName: "Sita Sharma",
			Timestamp: created,
			Status:    models.DDALogStatusPending,
		}},
		stats: models.DDAStats{Pending: 1, ApprovedToday: 4, RejectedToday: 2},
	}
	app := newTestApp(service)

	res := do(t, app, http.MethodGet, "/compliance/dda-logs")
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}

	var body struct {
		Logs []struct {
			ID        string `json:"id"`
			StaffName string `json:"staffName"`
			Timestamp string `json:"timestamp"`
			Status    string `json:"status"`
		} `json:"logs"`
		PendingCount  int `json:"pendingCount"`
		ApprovedToday int `json:"approvedToday"`
		RejectedToday int `json:"rejectedToday"`
	}
	decode(t, res, &body)

	if len(body.Logs) != 1 {
		t.Fatalf("len(logs) = %d, want 1", len(body.Logs))
	}
	got := body.Logs[0]
	if got.ID != testLogID.String() || got.StaffName != "Sita Sharma" || got.Status != "PENDING" {
		t.Errorf("unexpected log %+v", got)
	}
	if body.PendingCount != 1 || body.ApprovedToday != 4 || body.RejectedToday != 2 {
		t.Errorf("unexpected counts %+v", body)
	}
	if service.pharmacyID != testPharmacyID {
		t.Errorf("dashboard scoped to %s, want %s", service.pharmacyID, testPharmacyID)
	}
}

func TestGetDDALogs_ScopesToValidatedPharmacy(t *testing.T) {
	app := fiber.New()
	handler := NewComplianceHandler(&fakeComplianceService{})
	app.Get("/compliance/dda-logs", func(c *fiber.Ctx) error {
		c.Locals("pharmacy_id", "not-a-uuid")
		return c.Next()
	}, handler.GetDDALogs)

	res := do(t, app, http.MethodGet, "/compliance/dda-logs")
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestGetDDALogs_MissingPharmacy(t *testing.T) {
	app := fiber.New()
	app.Get("/compliance/dda-logs", NewComplianceHandler(&fakeComplianceService{}).GetDDALogs)

	res := do(t, app, http.MethodGet, "/compliance/dda-logs")
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}

func TestDecideDDA_ApproveAndReject(t *testing.T) {
	for _, tc := range []struct {
		name string
		path string
		want string
	}{
		{"approve", "/compliance/dda-logs/" + testLogID.String() + "/approve", "APPROVED"},
		{"reject", "/compliance/dda-logs/" + testLogID.String() + "/reject", "REJECTED"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			service := &fakeComplianceService{}
			res := do(t, newTestApp(service), http.MethodPost, tc.path)

			if res.StatusCode != http.StatusOK {
				t.Fatalf("status = %d, want 200", res.StatusCode)
			}
			if !service.called {
				t.Fatal("service was not called")
			}
			if service.logID != testLogID {
				t.Errorf("log id = %s, want %s", service.logID, testLogID)
			}
			if service.pharmacyID != testPharmacyID {
				t.Errorf("pharmacy id = %s, want %s", service.pharmacyID, testPharmacyID)
			}
			if service.pharmacistID != testStaffID {
				t.Errorf("pharmacist id = %s, want the authenticated staff member %s", service.pharmacistID, testStaffID)
			}

			var body struct {
				Log models.DDALogView `json:"log"`
			}
			decode(t, res, &body)
			if string(body.Log.Status) != tc.want {
				t.Errorf("status = %s, want %s", body.Log.Status, tc.want)
			}
		})
	}
}

func TestDecideDDA_ErrorMapping(t *testing.T) {
	for _, tc := range []struct {
		name string
		err  error
		want int
	}{
		{"not found", models.ErrDDANotFound, http.StatusNotFound},
		{"already decided", models.ErrDDAAlreadyDecided, http.StatusConflict},
		{"unexpected", errors.New("boom"), http.StatusInternalServerError},
	} {
		t.Run(tc.name, func(t *testing.T) {
			service := &fakeComplianceService{decisionErr: tc.err}
			res := do(t, newTestApp(service), http.MethodPost, "/compliance/dda-logs/"+testLogID.String()+"/approve")
			if res.StatusCode != tc.want {
				t.Fatalf("status = %d, want %d", res.StatusCode, tc.want)
			}
		})
	}
}

func TestDecideDDA_InvalidID(t *testing.T) {
	service := &fakeComplianceService{}
	res := do(t, newTestApp(service), http.MethodPost, "/compliance/dda-logs/not-a-uuid/approve")

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
	if service.called {
		t.Fatal("service must not be called for a malformed id")
	}
}

func TestDecideDDA_MissingStaffContext(t *testing.T) {
	app := fiber.New()
	app.Post("/compliance/dda-logs/:id/approve", func(c *fiber.Ctx) error {
		c.Locals("pharmacy_id", testPharmacyID.String())
		return c.Next()
	}, NewComplianceHandler(&fakeComplianceService{}).ApproveDDARequest)

	res := do(t, app, http.MethodPost, "/compliance/dda-logs/"+testLogID.String()+"/approve")
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}
