# DEVI Pharmacy Project - Context for Kimi AI

## 1. Project Vision & Goals
**Vision:** Transform the DEVI Pharmacy App into a flawless, modern, state-of-the-art enterprise system. We want a highly complex, premium application that leverages edge AI, real-time sync, and a scalable cloud-native architecture. 

**Core Goals:**
*   [YOUR GOAL HERE: e.g., Make the app fully offline-capable with real-time sync when online]
*   [YOUR GOAL HERE: e.g., Automate DDA compliance tracking and reporting]
*   [YOUR GOAL HERE: e.g., Add AI-driven predictive inventory management]
*   [YOUR GOAL HERE: e.g., Ensure the UI is incredibly premium, responsive, and fast]

## 2. Current Architecture & Technology Stack
Based on the current codebase, here is the technology DNA of the project:

*   **Frontend Framework:** Vue 3 (Composition API) built with Vite.
*   **State Management:** Pinia (Global State) and XState (Finite State Machines for complex workflows).
*   **UI/Styling:** PrimeVue 4, UnoCSS, FormKit.
*   **Data Fetching & Sync:** @tanstack/vue-query, Yjs / y-webrtc (for collaborative/real-time features).
*   **Local Database / Offline First:** @nozbe/watermelondb and Dexie.
*   **Backend & Database Services:** 
    *   **Supabase:** Primary backend database and auth.
    *   **Firebase:** Also present in the stack (needs evaluation on whether to keep or remove to consolidate on Supabase).
*   **Edge AI:** @xenova/transformers (Running machine learning models directly in the browser/client, likely for invoice parsing).
*   **Hardware Integrations:** Capacitor (for mobile/tablet packaging), ESC/POS Encoders (for thermal receipt printers), Barcode Scanner plugins.
*   **Testing:** Playwright (E2E) and Vitest (Unit).

## 3. What to Keep vs. What to Remove
**To Keep:**
*   **Vue 3 & Vite:** Strong, fast modern frontend foundation.
*   **Supabase:** Keep as the primary backend for Postgres database, Auth, and Edge Functions.
*   **Edge AI (@xenova/transformers):** Keep for client-side invoice/document processing without server costs.
*   **Offline-first capabilities (WatermelonDB):** Crucial for pharmacies with unstable internet.

**To Remove / Refactor (Kimi, please analyze these):**
*   **Firebase:** If we are using Supabase, we should likely strip Firebase entirely to avoid vendor fragmentation.
*   **Overlapping State Management:** Evaluate if we actually need Pinia, Vue Query, XState, AND Yjs. This might be over-engineered. Please suggest consolidation.
*   **Complex Sync Logic:** If the syncing between WatermelonDB and Supabase is clunky (the "old way"), we need the absolute best modern pattern for local-first sync.

## 4. Current Pain Points (Where we need help)
*   [YOUR PAIN POINT HERE: e.g., Synchronization between local WatermelonDB and remote Supabase fails or is hard to maintain]
*   [YOUR PAIN POINT HERE: e.g., The app feels slow on older pharmacy hardware]
*   [YOUR PAIN POINT HERE: e.g., Codebase has become messy, lacks strict domain boundaries]

## 5. Root Directory Structure
```text
.env
.firebaserc
.gitignore
README.md
capacitor.config.ts
core/
dist/
docs/
eslint.config.js
firebase.json
formkit.config.js
formkit.theme.js
functions/
index.html
package.json
playwright.config.ts
public/
server/
src/
src-tauri/
supabase/
tests/
tsconfig.json
uno.config.ts
vercel.json
vite.config.js
workers/
```

## 6. Package.json (Dependencies)
(See actual file content in the project root for full list of dependencies, which includes Vue, Supabase, WatermelonDB, PrimeVue, XState, etc.)

---
**INSTRUCTION FOR KIMI:** Please review this context. I want you to act as the Principal Enterprise Architect. Tell me if my "To Keep / To Remove" plan is sound, how to fix the overlapping state management, and what our first technical milestone should be to achieve the "Perfection" vision.
