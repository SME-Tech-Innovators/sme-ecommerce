# SME Operations — Frontend

Customer-facing storefront and merchant dashboard for the SME Operations Automation System. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

---

## Prerequisites

- **Node.js 20+** (check with `node -v`)
- **npm** (bundled with Node)
- A running instance of the [SME Operations backend](../sme) **or** access to the deployed Azure backend

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see below)
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the project root (already in `.gitignore` — never commit it).

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SME_API_BASE_URL` | **Yes** | Backend API base URL, no trailing slash. E.g. `http://localhost:8080/api/v1` for local dev. |
| `NEXT_PUBLIC_APP_ORIGIN` | No | Public frontend origin for storefront links and Paystack callbacks. Defaults to `window.location.origin` in the browser. |
| `OPENAI_API_KEY` | No | OpenAI API key for the AI product copy feature. Without this the "Generate with AI" button is disabled. |

### Local development example

```env
NEXT_PUBLIC_SME_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
OPENAI_API_KEY=sk-...your-key-here...
```

A ready-to-copy template is provided in `.env.local.example`.

> **Pointing at the deployed backend:** Replace `NEXT_PUBLIC_SME_API_BASE_URL` with the Azure App Service URL, e.g. `https://sme-operations-gpgudcaud8bddgdu.canadacentral-01.azurewebsites.net/api/v1`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server at `http://localhost:3000` |
| `npm run build` | Production build (type-checks and compiles) |
| `npm start` | Run the production build locally |
| `npm test` | Run all Jest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Server-side route handlers (AI proxy, health)
│   ├── dashboard/        # Merchant dashboard (auth-protected)
│   ├── s/                # Public customer storefront (/s/[storeSlug])
│   ├── preview/          # Merchant storefront preview
│   ├── signin/           # Business sign-in
│   ├── signup/           # Business registration
│   └── verify/           # Email verification
├── apis/                 # Backend API client functions
├── components/           # React components
│   ├── dashboard/        # Merchant dashboard panels
│   ├── storefront/       # Storefront rendering components
│   ├── landing/          # Landing page sections
│   └── ui/               # Shared UI primitives
├── hooks/                # TanStack Query data hooks
├── lib/                  # Utilities and helpers
├── types/                # TypeScript type definitions
└── providers/            # React context providers
```

---

## Key Features

- **Merchant dashboard** — product management, storefront editor, order tracking, analytics, payment settings
- **Public storefront** — two templates (Classic Boutique, Minimal Catalogue) with live theme/config editor
- **Customer checkout** — cart, Paystack payment integration, order confirmation and tracking
- **AI product copy** — GPT-4o-mini drafts product title, summary and category from an image or title hint (requires `OPENAI_API_KEY`)
- **Authentication** — JWT-based login/register/logout with email verification

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

Tests cover API response parsing, cart totals, currency formatting, analytics date ranges, and storefront utilities.

---

## Deployment

The app is deployed to [Netlify](https://sme-operations.netlify.app). Environment variables are configured in the Netlify dashboard under **Site settings → Environment variables**.

For a fresh deployment:
1. Connect the repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add all required environment variables

---

## Backend

This frontend connects to the [SME Operations Spring Boot backend](../sme/README.md). See that README for backend setup, API documentation, and deployment instructions.
