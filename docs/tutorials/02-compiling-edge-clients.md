# Tutorial: Compiling Edge Clients

This tutorial outlines the process for initializing and compiling the Vue 3 frontend application, and utilizing Capacitor to package the artifact into native binaries suitable for iOS and Android deployment.

## Prerequisites

- Node.js 18.0+
- XCode (macOS only, for iOS compilation)
- Android Studio (for Android compilation)

## Step 1: Install Dependencies

The frontend application utilizes Vite as the build tool and relies on several specialized libraries, including WatermelonDB for offline synchronization, Fuse.js for localized search, and Capacitor for hardware telemetry.

Navigate to the root directory of the DEVI project and execute the Node Package Manager installation:

```bash
npm install
```

## Step 2: Initialize the Development Server

To execute the application within a web browser for rapid iteration and testing, initiate the Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`. 

*Note: Capacitor hardware plugins (such as BarcodeScanner or Haptics) will degrade gracefully into mocked console outputs when executed within standard browser environments.*

## Step 3: Capacitor Configuration Synchronization

To compile the application into a native mobile or tablet artifact, the source code must first be built into static assets, followed by synchronization with the Capacitor ecosystem.

Execute the production build:

```bash
npm run build
```

Upon successful compilation into the `dist/` directory, synchronize the assets with the native iOS and Android projects:

```bash
npx cap sync
```

## Step 4: Compiling the Native Application

You may now open the native projects within their respective Integrated Development Environments (IDEs) to finalize the compilation and deployment to physical hardware kiosks.

For iOS (requires macOS):
```bash
npx cap open ios
```

For Android:
```bash
npx cap open android
```

Within the IDE, select the target device (e.g., an attached iPad or Android Tablet) and initiate the build process.

## Summary

You have successfully compiled the edge client and prepared the native application packages for distribution. The application is now capable of executing native hardware capabilities. Proceed to **Tutorial 03: Initializing Zitadel IAM**.
