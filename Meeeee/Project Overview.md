**Project purpose**: MenuNova is a modern, advanced restaurant management SaaS providing digital menus, kitchen display systems (KDS), and robust admin tools for restaurant owners.

**Main functionality**:

- Multi-tenant digital menus for customers.

- Live order management and tracking.

- Real-time Kitchen Display System (KDS).

- SaaS Admin panel with premium media uploads and analytics.

- Landing and marketing pages for the SaaS product itself.

**Current maturity/status**: Active development / Early production. Recently migrated to a modern Next.js 16 (App Router) architecture, with a significant amount of legacy code retained in an `unused/` directory.

  

# Tech Stack

  

* **Frameworks**: Next.js 16.2.1, React 19.2.4

* **Languages**: TypeScript, JavaScript

* **Styling**: Tailwind CSS v4, PostCSS, Framer Motion

* **Runtime versions**: Node.js (v20 types configured)

* **Package managers**: npm

* **Build tools**: Next.js compiler, ESLint

* **Hosting/deployment providers**: Vercel (inferred via build setup and Blob package)

* **Databases/storage/services**: Vercel Blob (`@vercel/blob`) for uploads, Firebase Cloud Messaging (FCM) for push notifications, Socket.io for real-time events. Backend API and Database are externalized.

  

# Architecture

  

* **High-level architecture explanation**: The application is a frontend Next.js application that serves both the SaaS marketing website and the multi-tenant restaurant applications. It communicates with an external backend API (`api.menunova.me`).

* **Rendering strategy**: Mixed strategy leveraging Next.js App Router (Server Components, SSR, and Client Components).

* **State management**: Zustand for global state (e.g., `useCart.ts`, `useLiveOrders.ts`).

* **API structure**: Centralized API service wrappers (`MenuNovaAPI` in JS and `fetchApi` in TS) that handle authentication, primary/fallback routing, and timeout management.

* **Authentication flow**: JWT-based. Tokens (`admin_token`) are stored in `localStorage` and `Cookies`, and sent via the `Authorization: Bearer <token>` header.

* **File organization philosophy**: Organized by domain using Next.js Route Groups (`(marketing)` vs `(tenant)`) and categorized component/js folders (`admin`, `kitchen`, `menu`, `ui`).

  

# Folder Structure

  

```text

.

├── public/ # Static assets, icons, service workers (sw.js, firebase-messaging-sw.js)

├── src/

│ ├── app/

│ │ ├── (marketing)/ # SaaS landing pages (Pricing, Features, Terms)

│ │ ├── (tenant)/ # Multi-tenant restaurant app route group

│ │ │ └── [slug]/ # Dynamic tenant route (e.g. /restaurant-name)

│ │ │ ├── admin/ # Restaurant admin dashboard

│ │ │ ├── kitchen/# Kitchen Display System

│ │ │ └── page.tsx# Customer-facing digital menu

│ ├── components/ # React components organized by domain (admin, kitchen, landing, etc.)

│ ├── css/ # Global and domain-specific CSS (themes)

│ ├── hooks/ # Custom React hooks (useCart, useLiveOrders)

│ ├── js/ # Core logic, services (api.js, socket.js, upload-service.js)

│ └── lib/ # TypeScript utilities and typed API wrappers

└── unused/ # Legacy HTML/JS/CSS implementations (Technical debt)

```

  

# Core Modules

  

* **MenuNovaAPI** (`src/js/services/api.js`):

* *Purpose*: Core API client.

* *Features*: Handles token management, automated failover to fallback APIs, logging, and unified error handling.

* **Live Orders / Sockets** (`src/hooks/useLiveOrders.ts`, `src/js/services/socket.js`):

* *Purpose*: Real-time state synchronization.

* *Interactions*: Uses `socket.io-client` to listen for order status changes and update the UI immediately.

* **Cart Manager** (`src/hooks/useCart.ts`):

* *Purpose*: Client-side cart state management using Zustand.

* **Service Workers** (`public/sw.js`, `public/firebase-messaging-sw.js`):

* *Purpose*: PWA capabilities and Firebase Cloud Messaging for order notifications.

  

# Routing & Navigation

  

* **Routes/pages**:

* Marketing: `/`, `/pricing`, `/features`, `/nova-os`

* Tenant: `/[slug]`, `/[slug]/admin`, `/[slug]/kitchen`

* **Dynamic routes**: The `[slug]` parameter is used universally to identify the tenant context and fetch the correct menu/orders.

* **Middleware**: Not heavily utilized at the edge; tenant context is extracted dynamically from the `[slug]` parameter at the page/layout level.

* **Guards/protection**: The `admin` and `kitchen` routes utilize the token check. Invalid tokens redirect to login or show an unauthorized state.

  

# APIs & Backend

  

* **Internal APIs**: None detected (pure frontend consuming external API).

* **External APIs/services**: `https://api.menunova.me` (Configurable via `window.AppConfig.API_BASE`).

* **Request flow**: Client -> `MenuNovaAPI` (attaches Bearer token) -> Backend. On failure, falls back to `FALLBACK_API_BASE`.

* **Validation**: Mostly handled on the backend; frontend catches HTTP errors and parses error messages.

* **Error handling**: Robust retry and failover logic in `attemptFetch` and `processResponse`.

  

# Environment Variables

  

*(Inferred from codebase usage since no `.env` files are present in the repo)*

* **Frontend Config**: `API_BASE`, `FALLBACK_API_BASE` (often injected dynamically or built into the environment).

* **Vercel**: `BLOB_READ_WRITE_TOKEN` (used implicitly by `@vercel/blob`).

* **Firebase**: Standard FCM config (apiKey, projectId, messagingSenderId, appId) likely passed dynamically to the service worker.

  

> Note: No secrets are exposed in the repository.

  

# Database & Storage

  

* **Schema overview**: Database is managed externally by the backend API.

* **Blob/file storage usage**: `@vercel/blob` is configured for handling premium media uploads (e.g., menu item images, restaurant logos).

* **Real-time**: Leverages Socket.io and Firebase FCM for push notifications and live UI updates.

  

# Build & Deployment

  

* **Build commands**: `npm run build`

* **Dev commands**: `npm run dev`

* **Production flow**: Next.js build process. Optimized for Vercel deployment.

* **Hosting setup**: Vercel.

  

# Performance Notes

  

* **Bundle concerns**: The `unused/` directory contains a massive amount of legacy code. While not imported, it adds clutter.

* **Optimization opportunities**:

* Consolidate the dual API implementations (`src/lib/api.ts` vs `src/js/services/api.js`).

* Ensure the heavy Socket.io client is lazy-loaded only for the Kitchen/Admin routes, not for landing pages.

  

# Security Notes

  

* **Auth/session concerns**: `admin_token` is stored in `localStorage` and `Cookies`. It is recommended to move to `HttpOnly` cookies to mitigate XSS risks, especially since user-generated content (menu descriptions) might be displayed.

* **Exposed credentials risks**: None found.

  

# Dependency Audit

  

* **Runtime dependencies**: Cutting-edge versions (React 19, Next 16, Tailwind 4). Minimal bloat.

* **Dev dependencies**: Standard TypeScript and ESLint configuration.

* **Potentially unused packages**: Everything in dependencies appears actively used.

  

# Code Quality Observations

  

* **Architectural consistency**: Transitioning to Next.js App Router has introduced some architectural splitting (e.g., JS services vs TS libs).

* **Dead code**: The `unused/` folder contains significant legacy HTML/JS implementations that should be archived and deleted from the main branch.

* **Refactor opportunities**: Migrate all JS services in `src/js` to TypeScript (`src/lib`) for better type safety and IDE support.

  

# Developer Experience

  

* **Setup process**: Simple standard Next.js setup.

* **Missing docs**: Setup documentation for the required backend environment variables is missing from the README.

* **Recommended tooling**: Prettier configuration could be added to standardize formatting.

  

# Suggested Improvements

  

1. **Critical**: Delete the `unused/` folder to remove legacy debt and prevent confusion.

2. **Important**: Consolidate `src/js/services/api.js` and `src/lib/api.ts` into a single, robust, typed API service.

3. **Important**: Convert the remaining `.js` files in `src/js` to `.ts/.tsx`.

4. **Nice-to-have**: Move authentication state to `HttpOnly` cookies.

  

# Quick Start

  

```bash

# Install dependencies

npm install

  

# Run locally

npm run dev

  

# Build for production

npm run build

  

# Deploy (if using Vercel CLI)

vercel deploy

```

  

# Final Summary

  

MenuNova is a well-structured, modern multi-tenant SaaS application leveraging the latest Next.js 16 and React 19 capabilities. The use of Route Groups cleanly separates marketing concerns from core application logic. While the architecture is sound and real-time capabilities are well-integrated, the codebase is in a transitional state with duplicate API logic and a large repository of legacy code (`unused/`) that needs to be cleaned up. Addressing these technical debts will result in a highly maintainable and scalable frontend.