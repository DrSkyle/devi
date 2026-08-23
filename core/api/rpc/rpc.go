package rpc

import (
	"context"
	"crypto/tls"
	"fmt"
	"time"

	pb "devi/core/api/rpc/generated"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// AIServiceClient wraps the gRPC connection to the Python AI Worker
type AIServiceClient struct {
	conn   *grpc.ClientConn
	client pb.PredictionServiceClient
}

// NewAIServiceClient creates a new client for the AI Worker
func NewAIServiceClient(address string, useTLS bool) (*AIServiceClient, error) {
	var opts []grpc.DialOption
	if useTLS {
		config := &tls.Config{InsecureSkipVerify: false}
		creds := credentials.NewTLS(config)
		opts = append(opts, grpc.WithTransportCredentials(creds))
	} else {
		opts = append(opts, grpc.WithInsecure())
	}

	conn, err := grpc.Dial(address, opts...)
	if err != nil {
		return nil, fmt.Errorf("did not connect: %v", err)
	}

	client := pb.NewPredictionServiceClient(conn)
	return &AIServiceClient{
		conn:   conn,
		client: client,
	}, nil
}

// PredictDemand calls the AI worker to predict inventory demand
func (c *AIServiceClient) PredictDemand(pharmacyID string, inventoryIDs []string, days int) ([]*pb.DemandItem, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	req := &pb.DemandRequest{
		PharmacyId:     pharmacyID,
		InventoryIds:   inventoryIDs,
		PredictionDays: int32(days),
	}

	resp, err := c.client.PredictDemand(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("could not predict demand: %v", err)
	}

	return resp.Items, nil
}

// Close closes the gRPC connection
func (c *AIServiceClient) Close() {
	c.conn.Close()
}
