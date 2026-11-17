package models

import (
	"time"

	"github.com/google/uuid"
)

// DDALogStatus is the lifecycle state of a Drug and Drug Administration audit entry.
type DDALogStatus string

const (
	DDALogStatusPending  DDALogStatus = "PENDING"
	DDALogStatusApproved DDALogStatus = "APPROVED"
	DDALogStatusRejected DDALogStatus = "REJECTED"
)

// DDALogView is a DDA audit entry as rendered by the compliance dashboard.
type DDALogView struct {
	ID        uuid.UUID    `json:"id"`
	StaffName string       `json:"staffName"`
	Timestamp time.Time    `json:"timestamp"`
	Status    DDALogStatus `json:"status"`
}

// DDAStats summarises the pharmacy's DDA queue for the dashboard KPIs.
type DDAStats struct {
	Pending       int
	ApprovedToday int
	RejectedToday int
}
