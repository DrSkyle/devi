# 🚀 Deploying Devi Signaling Server (Free)

This folder (`workers/`) contains a standalone Node.js application that acts as the "Switchboard" for the Devi Network. It introduces pharmacies to each other but stores no data.

## Option 1: Render.com (Easiest UI)

1.  **Push your code** to GitHub (if you haven't already).
2.  Go to [dashboard.render.com](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository (`antigravity`).
5.  **Important Configuration:**
    *   **Root Directory:** `devi/workers` (This tells Render to look inside this folder)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
    *   **Instance Type:** `Free`
6.  Click **Create Web Service**.

**Success!** You will get a URL like `https://devi-signal.onrender.com`.
**Note:** The URL must use `wss://` (Secure WebSocket) in your config, so it becomes `wss://devi-signal.onrender.com`.

---

## Option 2: Fly.io (Best Performance)

1.  Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2.  Navigate to the folder:
    ```bash
    cd devi/workers
    ```
3.  Launch:
    ```bash
    fly launch
    ```
4.  Follow prompts (Keep defaults).
5.  Deploy:
    ```bash
    fly deploy
    ```

---

## Final Step: Connect Devi

Once deployed, copy your new URL.
Open `src/config/index.ts` in Devi and update:

```typescript
// src/config/index.ts
signalingUrls: [
  'ws://localhost:4444',
  'wss://your-new-app.onrender.com' // <-- Paste here
]
```
