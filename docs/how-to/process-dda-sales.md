# How-To: Process DDA Sales

This guide details the procedure for processing transactions involving Department of Drug Administration (DDA) controlled substances. Due to stringent regulatory requirements, the DEVI platform enforces a dual-authorization protocol involving real-time WebSocket communication and biometric verification.

## Requirements
- An active session on a registered kiosk (Cashier perspective).
- An active, authenticated session on a secondary device possessing the `PHARMACIST` IAM role (Pharmacist perspective).
- The Centrifugo real-time messaging service must be operational.

## Procedure: The Cashier Workflow

1. Navigate to the Point of Sale interface (`MobileTerminalView`) on the kiosk.
2. Utilize the native barcode scanner or the localized Fuse.js search input to append items to the cart.
3. If the selected pharmaceutical is flagged within the `master_catalog` as a controlled substance (`is_dda: true`), the user interface will immediately alter its state.
4. The standard "Complete Sale" action button will transition to an orange "Requires Pharmacist Approval" state.
5. Depress the action button. The kiosk will enter a "Paused" state and transmit an approval request to the backend. The interface will be locked, displaying "Waiting for Pharmacist...".

## Procedure: The Pharmacist Workflow

1. Ensure you are authenticated within the DEVI dashboard on a separate device (e.g., a desktop computer or personal tablet).
2. The `DDAService` running silently in the background maintains an active WebSocket subscription to the Centrifugo channel specific to your pharmacy location.
3. Upon the cashier initiating the DDA transaction, the Centrifugo server pushes a high-priority event to your active session.
4. A global modal (`DDAApprovalModal`) will instantly overlay your screen, detailing the requested pharmaceutical, the quantity, and the initiating kiosk identifier.
5. Select the **"Authorize via Biometrics"** option.
6. The `SimpleWebAuthn` protocol will invoke the native operating system authenticator (e.g., TouchID on macOS, Windows Hello, or FaceID on iOS).
7. Execute the biometric challenge.

## Resolution

Following successful biometric validation, the Pharmacist's device transmits the cryptographic proof to the Go backend. The backend updates the immutable audit log and subsequently publishes an "APPROVED" event back through the Centrifugo pipeline to the originating kiosk. 

The kiosk's "Paused" state is lifted, native haptic feedback is triggered to alert the cashier, and the transaction is successfully committed to the ledger.
