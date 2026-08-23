# Dockerfile for the DEVI Core API
# Multi-stage build for a minimal production image

# Stage 1: Build
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY core/go.mod core/go.sum ./
RUN go mod download

COPY core/ .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o devi-api .

# Stage 2: Production
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/devi-api .

EXPOSE 3000
CMD ["./devi-api"]
