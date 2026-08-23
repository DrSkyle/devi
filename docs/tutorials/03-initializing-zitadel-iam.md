# Tutorial: Initializing Zitadel IAM

This tutorial provides instructions for configuring the local Zitadel Identity and Access Management (IAM) instance. Proper configuration of Zitadel is mandatory to enforce Role-Based Access Control (RBAC) and to provision the hardware-bound JSON Web Tokens (JWT) required by edge kiosks.

## Prerequisites

- Access to the local Zitadel container deployment (typically via `http://localhost:8080`).
- Administrative credentials for the initial Zitadel machine user.

## Step 1: Establish the DEVI Organization

Zitadel operates on a multi-tenancy model predicated on "Organizations".

1. Access the Zitadel Console via your web browser.
2. Authenticate using the default administrative credentials provisioned during the Docker compose initialization.
3. Navigate to the **Organizations** interface.
4. Create a new organization titled `DEVI Enterprise`.

## Step 2: Configure the DEVI Project

Within Zitadel, a "Project" represents a logical boundary for applications and their associated authorization policies.

1. Ensure the `DEVI Enterprise` organization is active.
2. Navigate to the **Projects** section and instantiate a new project named `DEVI Platform`.
3. Within the `DEVI Platform` project, navigate to **Roles**.
4. Define the following operational roles:
   - `ADMIN`: Global system oversight.
   - `OWNER`: Pharmacy-level administrative privileges.
   - `PHARMACIST`: Department of Drug Administration (DDA) approval authority.
   - `CASHIER`: Point-of-sale execution capabilities.

## Step 3: Register the Frontend Application

The Vue 3 edge application requires registration within Zitadel to acquire a valid Client ID for authentication flows.

1. Within the `DEVI Platform` project, navigate to **Applications**.
2. Select **New** and choose the **Single Page Application (SPA)** architecture.
3. Define the application name as `DEVI Edge Client`.
4. Configure the allowed redirect URIs to include `http://localhost:5173/callback`.
5. Upon creation, safely store the generated **Client ID**.

## Step 4: Register the Backend API (Machine User)

The Go-Fiber backend necessitates a machine user to validate JWTs and interact with the Zitadel introspection endpoints.

1. Navigate to the **Service Users** or **Machine Users** section within the organization.
2. Create a new Machine User named `DEVI Backend API`.
3. Generate a Personal Access Token (PAT) for this machine user.
4. Export this token within the Go application's environment configuration:

```bash
export ZITADEL_MACHINE_KEY="<your-generated-pat>"
```

## Summary

You have successfully initialized the Zitadel IAM infrastructure. The platform is now capable of issuing cryptographically secure identity tokens aligned with the defined Role-Based Access Control matrix.
