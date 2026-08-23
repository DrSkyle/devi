# Reference: Telemetry & Observability Pipeline

The DEVI architecture enforces a stringent observability posture to monitor infrastructure health, trace distributed latency bottlenecks, and warehouse unstructured application logs. This pipeline is constructed utilizing Vector.dev, ClickHouse, and OpenTelemetry.

## 1. Structured Logging (Vector.dev)

Rather than directly connecting the Go-Fiber backend to the ClickHouse datastore (which introduces tight coupling and connection-pool exhaustion risks), Vector.dev is deployed as an intermediary high-performance routing daemon.

### Vector Configuration (`vector.yaml`)

Vector is configured to ingest JSON-structured logs emitted via HTTP from the Go application, normalize the payloads, and execute bulk inserts into the ClickHouse engine.

#### Source Definition
```yaml
sources:
  go_api_logs:
    type: "http_server"
    address: "0.0.0.0:8081"
    encoding: "json"
```

#### Transformation Rules
```yaml
transforms:
  process_logs:
    type: "remap"
    inputs: ["go_api_logs"]
    source: |
      .timestamp = now()
      .service = "devi-core-api"
      .env = "production"
```

#### Sink Target (ClickHouse)
```yaml
sinks:
  clickhouse_warehouse:
    type: "clickhouse"
    inputs: ["process_logs"]
    endpoint: "http://devi_clickhouse:8123"
    database: "default"
    table: "api_telemetry"
```

## 2. Distributed Tracing (OpenTelemetry)

To diagnose latency across the microservice boundaries (e.g., measuring the precise duration between a Go API request, the NATS JetStream emission, and the TigerBeetle response), the application utilizes the OpenTelemetry (OTel) specification.

### Fiber Instrumentation

The Go backend is instrumented via the `otelfiber` middleware.

```go
import "github.com/gofiber/contrib/otelfiber/v2"

// Initialization
app.Use(otelfiber.Middleware())
```

### Exporter Configuration

The OTel SDK is configured to export spans via the OTLP/gRPC protocol to a SigNoz collector (or any compatible OTLP endpoint) operating on `localhost:4317`.

```go
traceExporter, err := otlptracegrpc.New(ctx,
    otlptracegrpc.WithInsecure(),
    otlptracegrpc.WithEndpoint("localhost:4317"),
)
```

## 3. Data Warehouse (ClickHouse)

ClickHouse serves as the final analytical database for all telemetry data. It is optimized for high-speed, columnar aggregations.

### Telemetry Table Schema

```sql
CREATE TABLE IF NOT EXISTS default.api_telemetry (
    timestamp DateTime,
    service String,
    env String,
    message String,
    level String
) ENGINE = MergeTree()
ORDER BY (timestamp, service);
```
