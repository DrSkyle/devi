# How-To: Configure Developer Dashboard

This guide outlines the procedure for utilizing the Appsmith container to rapidly construct internal administrative tooling and monitoring dashboards. Appsmith serves as the "God-Mode" interface for high-level oversight of the DEVI ecosystem, completely decoupled from the production edge clients.

## Requirements
- Access to the local Appsmith deployment (default `http://localhost:8080`).
- Credentials for the primary PostgreSQL instance.

## Procedure

### Step 1: Initialize the Appsmith Environment
1. Access `http://localhost:8080` via your web browser.
2. Complete the initial registration prompt to establish the master administrative account.
3. Upon accessing the primary workspace, instantiate a new Application titled `DEVI Command Center`.

### Step 2: Establish the Database Datasource
Appsmith requires a direct connection to the source of truth to execute administrative queries.

1. Navigate to the **Datasources** panel and select **Add new datasource**.
2. Select **PostgreSQL**.
3. Configure the connection parameters based on your Docker Compose environment:
   - **Host Address:** `host.docker.internal` (if accessing the host machine from the container) or the specific container IP if operating within a dedicated bridge network.
   - **Port:** `5432`
   - **Database Name:** `devi`
   - **Username:** `postgres`
   - **Password:** `postgrespassword`
4. Execute a **Test Connection**. Upon success, save the datasource.

### Step 3: Construct the Oversight Interface
You may now utilize the drag-and-drop widget interface to construct visualization panes.

1. Drag a **Table** widget onto the canvas.
2. Create a new Query bound to the PostgreSQL datasource:
   ```sql
   SELECT * FROM dda_audit_logs ORDER BY created_at DESC LIMIT 50;
   ```
3. Bind the query output to the Table widget's data property: `{{Query1.data}}`.
4. Deploy the application.

## Best Practices
- **Isolation:** Do not expose the Appsmith interface outside of a secure Virtual Private Network (VPN) or local intranet. It bypasses the standard API authorization gateways and maintains direct, unrestricted access to the relational database.
- **Read-Only Replicas:** In high-throughput production environments, bind Appsmith to a read-only PostgreSQL replica to prevent analytical queries from impacting transactional performance.
