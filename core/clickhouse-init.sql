CREATE TABLE IF NOT EXISTS default.api_telemetry (
    timestamp DateTime,
    service String,
    env String,
    message String,
    level String
) ENGINE = MergeTree()
ORDER BY (timestamp, service);
