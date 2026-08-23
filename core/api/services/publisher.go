package services

import (
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

// Publisher is the interface for publishing messages to a message queue or event bus.
type Publisher interface {
	Publish(topic string, message []byte) error
}

// CentrifugoPublisher publishes messages via NATS (which can be bridged to Centrifugo).
type CentrifugoPublisher struct {
	nc *nats.Conn
}

// NewCentrifugoPublisher creates a new publisher instance.
// If NATS is not available, it returns a no-op publisher.
func NewCentrifugoPublisher() Publisher {
	return &centrifugoNoOpPublisher{}
}

// NewCentrifugoPublisherWithNATS creates a publisher backed by a live NATS connection.
func NewCentrifugoPublisherWithNATS(nc *nats.Conn) Publisher {
	return &CentrifugoPublisher{nc: nc}
}

// Publish sends a message to the specified NATS topic.
func (p *CentrifugoPublisher) Publish(topic string, message []byte) error {
	if p.nc == nil || !p.nc.IsConnected() {
		return fmt.Errorf("nats connection not available")
	}
	return p.nc.Publish(topic, message)
}

// centrifugoNoOpPublisher is a no-op publisher for when NATS is unavailable.
type centrifugoNoOpPublisher struct{}

func (p *centrifugoNoOpPublisher) Publish(topic string, message []byte) error {
	log.Printf("[NOP Publisher] Topic: %s, Message: %s", topic, string(message))
	return nil
}
