# Feature: Predictive Inventory Forecasting

## Visual Aim

A real-time dashboard widget and "wizard" that uses historical sales data (stored in ClickHouse) to predict when stock will run out. The goal is to shift pharmacies from "reactive restocking" to "proactive purchasing."

## Technical Architecture

1. **ClickHouse Integration:** We will write a Go worker (`cmd/worker/main.go`) that runs as a cron job. This worker queries our `sales` table in ClickHouse.
2. **Time-Series Analysis:** The worker uses a simple time-series analysis (e.g., moving average or a basic linear regression) on the `quantity_sold` per day for each `pharmacy_id` and `inventory_id`.
3. **Prediction Logic:**
   - Calculate the average daily consumption rate.
   - Fetch the current stock level from our primary PostgreSQL inventory table.
   - Predict `days_until_stockout = current_stock / daily_consumption_rate`.
   - If `days_until_stockout < 7`, flag as a `LOW_STOCK` event.
4. **Real-Time Alert:** The worker publishes a `STOCK_CRITICAL` event to NATS. Our `CentrifugoPublisher` picks this up and pushes a real-time alert to the pharmacy's dashboard, prompting them to create a purchase order.

## API Endpoints (To be implemented in `core/api/handlers/analytics.go`)

- `GET /api/v1/analytics/stock-forecast`: Returns the predicted stockout dates for the current pharmacy.
- `POST /api/v1/procurement/purchase-orders`: Triggers a purchase order based on a `LOW_STOCK` alert.

## Frontend Integration (In `AnalyticsView.vue`)

- Display a graph (ApexCharts) showing the stock level vs. the predicted stockout line.
- Show a "Critical Stock" table with auto-generated purchase order suggestions.
