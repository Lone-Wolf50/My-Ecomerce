# My Shop — Janina Luxury Bags

My Shop is a **full‑stack e‑commerce platform** for **Janina Luxury Bags**, built with a modern React frontend and a secure Node.js/Express backend.
It handles product browsing, cart and checkout, Paystack payments in GHS, OTP-based verification flows, and rich email + live-chat based customer support.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running Locally](#running-locally)
- [Backend API (High Level)](#backend-api-high-level)
- [Frontend Overview](#frontend-overview)
- [Security Notes](#security-notes)
- [Deployment](#deployment)
- [Scripts Reference](#scripts-reference)
- [License](#license)

---

## Overview

**My Shop** provides a complete online store experience for a single brand:

- **Customer store** with luxury bag catalogue, cart, checkout, and order confirmation.
- **Secure payments** with **Paystack** (server-side validation, fee calculation, and anti-tampering checks).
- **OTP flows** for email verification and login-like operations (via one-time codes).
- **Transactional emails** (order confirmation, shipped, delivered, OTP, live chat notifications) sent through **Gmail SMTP** with polished HTML templates.
- **Live support** integration: customers can open a live-chat session that is logged in **Supabase** and notifies staff by email.
- **Hardened backend**:
  - Helmet, CORS, rate limiting.
  - Idempotency / de‑duplication for outgoing emails.
  - Strong input validation for emails, phone numbers, UUIDs, OTPs, and payment references.
  - All prices are **trusted only from the database**, never from the client.

The project is split into a `frontend` (React + Vite) and a `server` (Node.js + Express) inside the `my-shop` folder.

---

## Tech Stack

| Layer       | Technologies |
|------------|--------------|
| **Frontend** | React 19, React DOM, React Router 7, Vite, Tailwind CSS, Lucide React, Axios, SweetAlert2, React Hot Toast |
| **Backend**  | Node.js (ES Modules), Express 5, Nodemailer (Gmail SMTP), Axios, Helmet, CORS, express-rate-limit |
| **Database** | Supabase (PostgreSQL + REST) via `@supabase/supabase-js` and raw `fetch` calls |
| **Payments** | Paystack (GHS) |
| **Auth / Security** | OTP codes with hashing, in‑memory stores, dedicated rate limiters, input sanitisation (`escape-html`) |

---

## Project Structure

From `my-shop/`:

```text
my-shop/
├── frontend/              # React + Vite single-page app
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                # Node/Express backend
│   ├── server.js          # All API routes, security middleware, email + payment logic
│   ├── package.json
│   ├── otp-client/        # (If used) auxiliary client utilities / assets
│   └── .env               # Backend‑specific environment (overrides root .env)
├── package.json           # Root workspace metadata (minimal)
├── package-lock.json
└── README.md              # This file
```

The **frontend** talks to the **server** over HTTP (typically `http://localhost:3001` in development) and the server talks to:

- **Supabase REST API** for product/price and live-chat session data.
- **Paystack** for initializing and verifying payments.
- **Gmail SMTP** (via Nodemailer) for sending OTP and order/status emails.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended).
- **npm** (bundled with Node).
- A **Supabase** project (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- A **Gmail** account with an **App Password** for SMTP.
- A **Paystack** account and **secret key** for live payments or test mode.

Optionally, you may also want:

- A production hosting provider for the backend (Vercel, Render, Railway, etc.).
- A static hosting or Vercel project for the frontend.

---

## Environment Variables

The backend loads environment variables in this order:

1. **Root `.env`** at `my-shop/.env` (loaded explicitly in `server/server.js`).
2. **Backend `.env`** at `my-shop/server/.env` (loaded as a fallback/override).

You can keep everything in the root `.env`, or split between the two; just make sure all required keys are defined in at least one of them.

### Required (Backend)

These are validated on startup in `server/server.js`:

| Variable | Required | Description |
|---------|----------|-------------|
| `PAYSTACK_SECRET_KEY` | ✅ | Paystack secret key used to sign and verify requests. **Never expose to frontend.** |
| `GMAIL_USER` | ✅ | Gmail address used to send all emails (e.g. `myshop.app@gmail.com`). |
| `GMAIL_PASS` | ✅ | Gmail **App Password** for `GMAIL_USER`. |
| `ADMIN_SECRET_TOKEN` | ✅ | Secret token required in `x-admin-token` for sensitive admin email endpoints. |
| `SUPABASE_URL` | ✅ | Supabase REST base URL (e.g. `https://xyz.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase **service role** key used only on the backend for secure DB access. |

Additional backend variables used in the code:

| Variable | Required | Description |
|---------|----------|-------------|
| `NODE_ENV` | ⛔ (optional) | `"production"` or `"development"`. Defaults to dev mode if not `"production"`. |
| `PORT` | ⛔ | Port for Express server. Defaults to `3001` if not set. |
| `ALLOWED_ORIGIN_1` | ⛔ | Optional override for the main production frontend origin; used to construct Paystack callback URLs. |
| `SITE_URL` | ⛔ | Base URL of the customer frontend (e.g. `https://my-ecomerce-gygn.vercel.app`) for links inside emails. |
| `ADMIN_EMAIL` | ⛔ | Email address for admin notifications (falls back to `GMAIL_USER` if omitted). |

### Frontend Environment

The frontend is a standard **Vite React app** and will use `VITE_*` variables from `my-shop/frontend/.env`.
Typical ones you may want to define:

- `VITE_API_URL` – base URL of the backend (e.g. `http://localhost:3001` in dev, your server URL in production).
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` – if the frontend talks directly to Supabase.

> **Note:** Check your `frontend/src` configuration files to confirm which `VITE_*` keys are actually used before deploying.

---

## Installation & Setup

From the `my-shop` folder:

```bash
cd my-shop
```

### 1. Backend dependencies

```bash
cd server
npm install
```

Create and configure your backend `.env` (or the root `.env`) with the variables listed above.

### 2. Frontend dependencies

In a **new terminal** (or after coming back to the root):

```bash
cd my-shop/frontend
npm install
```

Create `frontend/.env` with any `VITE_*` variables (at minimum your backend `VITE_API_URL` if not using a proxy).

---

## Running Locally

### 1. Start the backend

```bash
cd my-shop/server
npm start
```

By default, the backend listens on:

- `http://localhost:3001`

Check `GET /health` to verify that the server is running:

```bash
curl http://localhost:3001/health
```

You should receive a small JSON payload like `{ "status": "ok" }`.

### 2. Start the frontend

In another terminal:

```bash
cd my-shop/frontend
npm run dev
```

This will:

- Start the Vite dev server (default `http://localhost:5173`).
- Serve the React app that calls the backend using your configured `VITE_*` variables.

Open `http://localhost:5173` in your browser to use the app.

---

## Backend API (High Level)

Base URL in development: **`http://localhost:3001`**.

The main groups of endpoints exposed by `server/server.js` are:

- **Health**
  - `GET /health` – simple health check used by monitoring or deployment platforms.

- **Payments & Orders (Paystack)**
  - `POST /validate-order` – validates cart payload (user ID, email, phone, delivery method, items) and recomputes totals using **authoritative prices from Supabase**. Rejects invalid products, too many items, or suspicious values.
  - `POST /initialize-payment` – contacts Paystack to create a transaction, using a safe `metadata` whitelist and a hard‑coded or env‑based callback URL.
  - `GET /verify-payment/:reference` – verifies a payment with Paystack and returns structured status information.
  - `POST /paystack-webhook` – receives Paystack webhook events; verifies signatures and acknowledges `charge.success` events without sending emails directly (email is handled via other endpoints).

- **Email Notifications**
  - `POST /send-order-confirmed-email` – admin‑protected route that sends an order confirmation email, with strong validation and idempotency (each order ID sent only once).
  - `POST /send-shipped-email` – admin‑protected “your order has shipped” email with branding and tracking CTA.
  - `POST /send-delivered-email` – admin‑protected “thank you / delivered” email with optional item breakdown and return policy note.
  - `POST /send-status-update` – similar to the confirmation email but intended to be called by the authenticated client right after payment; rate‑limited and deduplicated.

- **OTP Authentication**
  - `POST /send-otp` – sends a 6‑digit code to the given email, storing only a hash along with expiry, attempts, and TTL in an in‑memory store.
  - `POST /verify-otp` – validates an email + code pair with max attempts and expiry; consumes the OTP if valid.

- **Live Chat / Support**
  - `POST /notify-admin-live-chat` – logs the opening of a live chat session into a Supabase table and emails the admin with session details. Rate‑limited and deduplicated per session ID.

All endpoints share:

- Global rate limiter for overall abuse protection.
- JSON responses with a consistent `{ success: boolean, ... }` shape for errors and successes.

---

## Frontend Overview

The frontend is a **single‑page React application** created with Vite and styled with Tailwind.
Although the exact components and pages are defined in `frontend/src`, the high‑level behaviour is:

- Public pages for browsing products (luxury bags and related accessories).
- Cart + checkout flow integrating with the `/validate-order` and `/initialize-payment` endpoints.
- OTP‑based flows (e.g. email verification / login steps) using `/send-otp` and `/verify-otp`.
- Order confirmation and status tracking, reading back Paystack verification or Supabase‑stored order data.
- Support / live chat entry points that call `/notify-admin-live-chat` to alert staff.

Routing is handled by **React Router 7**, and UI feedback uses libraries such as **SweetAlert2** and **react-hot-toast** for modals and toasts.

---

## Security Notes

- **Environment validation** – the backend refuses to start if any critical environment variable is missing.
- **Helmet + CORS** – sensible security headers and a strict CORS policy allowing only trusted origins (localhost in dev and the real production frontend URL).
- **Rate limiting** – global limiter plus specialised limiters for auth, email, and OTP endpoints to reduce abuse.
- **Email de‑duplication** – in‑memory idempotency log ensures order/status emails are not sent multiple times for the same order or session.
- **Input validation & sanitisation**:
  - Emails, phone numbers, OTPs, UUIDs, and Paystack references are all validated with strict regexes.
  - User‑supplied strings are cleaned and escaped with `escape-html` before being rendered into email templates.
- **Server‑side pricing** – item prices are always queried from Supabase on the backend; client‑provided prices are ignored, preventing tampering.

When deploying to production, consider:

- Using a **Redis** store for rate limiting and idempotency instead of the default in‑memory maps.
- Ensuring all environment variables are set via your hosting provider’s dashboard (never committed to Git).

---

## Deployment

You can deploy the project in many ways; a common pattern is:

- **Backend**
  - Deploy `my-shop/server` to a Node‑friendly platform (Vercel serverless functions, Render, Railway, traditional VPS, etc.).
  - Set the same environment variables (`PAYSTACK_SECRET_KEY`, `GMAIL_USER`, `SUPABASE_URL`, etc.) in the hosting dashboard.
  - Expose the server over HTTPS (recommended, especially for payments and OTP endpoints).

- **Frontend**
  - Build the frontend:
    ```bash
    cd my-shop/frontend
    npm run build
    ```
  - Deploy the `dist` folder to a static host (Vercel, Netlify, etc.).
  - Set `VITE_API_URL` (and any other `VITE_*` variables) so that the frontend points to your deployed backend.

Remember to:

- Add your production frontend URL to the backend CORS `allowedOrigins`.
- Use your production domain (e.g. `https://my-ecomerce-gygn.vercel.app`) in `SITE_URL` and Paystack callback URLs.

---

## Scripts Reference

### Backend (`my-shop/server/package.json`)

- `npm start` – runs `node server.js` with the production Express server.
- (Optional) In development you can install `nodemon` globally and run `nodemon server.js` for auto‑reloads.

### Frontend (`my-shop/frontend/package.json`)

- `npm run dev` – Vite dev server with React Refresh.
- `npm run build` – production build into `dist`.
- `npm run preview` – locally preview the production build.
- `npm run lint` – run ESLint across the project.

---

## License

This project is currently licensed under the **ISC** license (see `server/package.json`).
You are free to adapt and extend it for your own deployments of the Janina Luxury Bags shop.

