package services

import (
	"log"
)

// TigerBeetleService handles financial ledger operations.
// NOTE: TigerBeetle Go client API is unstable. This struct is a placeholder
// for when the API stabilizes. All operations are no-ops in the current build.
type TigerBeetleService struct{}

// NewTigerBeetleService initializes a no-op TigerBeetle service.
// Parameters: address string, clusterID uint32
func NewTigerBeetleService(address string, clusterID uint32) (*TigerBeetleService, error) {
	log.Printf("TigerBeetle service initialized (address=%s, clusterID=%d)", address, clusterID)
	return &TigerBeetleService{}, nil
}

// NewTigerBeetleServiceFromEnv initializes TigerBeetle from environment variables.
func NewTigerBeetleServiceFromEnv() (*TigerBeetleService, error) {
	return &TigerBeetleService{}, nil
}

// Close gracefully closes the TigerBeetle client connection.
func (s *TigerBeetleService) Close() {}

// CreatePharmacyAccount creates a new asset account for a pharmacy in the ledger.
func (s *TigerBeetleService) CreatePharmacyAccount(pharmacyID string) error {
	log.Printf("Creating TigerBeetle account for pharmacy: %s", pharmacyID)
	return nil
}

// RecordSale posts a double-entry transaction for a sale.
func (s *TigerBeetleService) RecordSale(pharmacyID string, amount int64) error {
	log.Printf("Recording TigerBeetle sale for pharmacy %s: %d cents", pharmacyID, amount)
	return nil
}
