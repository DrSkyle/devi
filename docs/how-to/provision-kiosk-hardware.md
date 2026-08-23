# How-To: Provision Kiosk Hardware

This guide details the procedure for registering physical hardware (e.g., an iPad or Android tablet) as a dedicated point-of-sale kiosk within the DEVI platform. Proper hardware provisioning is a security prerequisite, ensuring that only registered MAC addresses equipped with hardware-bound JSON Web Tokens (JWTs) can interface with the core API.

## Requirements
- Administrative access to the PostgreSQL database.
- Administrative access to the Zitadel IAM instance.
- The physical device intended for provisioning.

## Procedure

### Step 1: Identify the Device MAC Address
Obtain the Media Access Control (MAC) address of the target tablet. This is typically located within the device's network settings interface (e.g., `Settings > General > About > Wi-Fi Address` on iOS).

### Step 2: Register the Kiosk in the Database
The device must be registered against a specific pharmacy location. Execute the following SQL statement against the `devi` PostgreSQL database, replacing the placeholder variables with the appropriate values:

```sql
INSERT INTO kiosks (
    pharmacy_id, 
    mac_address, 
    device_name, 
    status
) VALUES (
    'your-pharmacy-uuid', 
    '00:1B:44:11:3A:B7', 
    'Front Desk Terminal Alpha', 
    'ACTIVE'
);
```

### Step 3: Issue a Hardware-Bound Service Account within Zitadel
Standard user authentication is insufficient for dedicated hardware kiosks. A service account must be generated to issue a long-lived, hardware-bound JWT.

1. Navigate to your Zitadel organization dashboard.
2. Under the specific Project encompassing the DEVI infrastructure, navigate to **Service Users**.
3. Create a new Service User designated as the kiosk identity (e.g., `sa-kiosk-alpha`).
4. Generate a machine key for this Service User.

### Step 4: Inject the Identity Token into the Edge Client
During the initial deployment of the native application binary to the tablet, the machine key must be injected securely into the device's native keychain.

1. Launch the DEVI Edge Client on the provisioned tablet.
2. Access the administrative setup overlay (typically accessible via a hidden gesture sequence defined during compilation).
3. Input the Zitadel machine key generated in Step 3.

## Verification
Upon successful configuration, the tablet will initiate a secure handshake with the Go backend upon startup. The backend will validate the Zitadel JWT and cross-reference the incoming network MAC address against the `kiosks` table registry. Successful verification will unlock the `MobileTerminalView` interface.
