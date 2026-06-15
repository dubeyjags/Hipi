# Google Demo — Project Summary

## What This App Does

A Next.js web app that reads and writes Gmail and Google Calendar through **Corsair** (an integration layer). It caches data in PostgreSQL so reads are fast and don't hit Google rate limits. Writes (send email, create event) go live to the API.

**Email tab:**
- List inbox threads (newest first)
- Click thread to read full message
- Create draft / send email / list & manage drafts

**Calendar tab:**
- Week view with prev/next navigation
- Search events
- Create event draft (tentative) or send invite (notifies attendees)
- Refresh calendar from Google

---

## Architecture Overview

```
Browser (React + tRPC React Query)
        ↕ tRPC (type-safe RPC)
Next.js API Routes (/api/trpc/...)
        ↕
Corsair layer
    ├── .db   → PostgreSQL cache (fast reads, no quota)
    └── .api  → Live Google API (writes / refreshes)
        ↕ OAuth 2.0
   Gmail API  /  Google Calendar API
```

Webhooks: Google pushes change notifications → ngrok tunnel → `/api/webhooks` → Corsair updates cache automatically.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.2.3 |
| Language | TypeScript | 5.8.2 |
| UI | React + TailwindCSS | 19 / 4.0 |
| API layer | tRPC | 11 |
| Client cache | TanStack React Query | 5 |
| Integration | Corsair + plugins | 0.1.74 |
| Database | PostgreSQL + Drizzle ORM | - |
| DB client | postgres.js | 3.4.4 |
| Agents | OpenAI Agents SDK | 0.11.6 |
| Package manager | pnpm | 10.11.1 |

---

## What You Need (Prerequisites)

### 1. Node.js + pnpm
```bash
npm install -g pnpm@10
```

### 2. PostgreSQL via Docker
```bash
docker run --name corsair -e POSTGRES_USER=corsair -e POSTGRES_PASSWORD=corsair \
  -e POSTGRES_DB=corsair -p 5432:5432 -d postgres
```
Or use the existing container: `docker start corsair`

### 3. ngrok (for webhooks)
- Download from https://ngrok.com
- Create free account, copy your auth token
- `ngrok config add-authtoken YOUR_TOKEN`

### 4. Google Cloud Project
1. Go to https://console.cloud.google.com/projectcreate
2. Create a new project
3. Enable APIs: **Gmail API** and **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add redirect URI: `http://localhost:3000` (or wherever Corsair redirects during auth)
7. Copy **Client ID** and **Client Secret**

### 5. OpenAI API Key (optional, for agent feature)
- Get from https://platform.openai.com/api-keys

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection
DATABASE_URL=postgresql://corsair:corsair@localhost:5432/corsair

# Corsair encryption key — generate once, never change
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
CORSAIR_KEK=<base64-encoded-32-byte-key>

# Tenant ID (can be anything; "dev" is the default used throughout)
TENANT_ID=dev

# OpenAI (only needed for agent.ts feature)
OPENAI_API_KEY=sk-...
```

**Generate CORSAIR_KEK once and store it safely. Changing it will invalidate all stored tokens.**

---

## First-Time Setup (Step by Step)

```bash
# 1. Install dependencies
pnpm install

# 2. Start the database
docker start corsair

# 3. Push schema to database
pnpm run db:push

# 4. Set up Corsair with your Google OAuth credentials
#    Use the SAME client_id and client_secret for both plugins
pnpm corsair setup --gmail client_id=YOUR_CLIENT_ID client_secret=YOUR_CLIENT_SECRET
pnpm corsair setup --googlecalendar client_id=YOUR_CLIENT_ID client_secret=YOUR_CLIENT_SECRET

# 5. Authenticate your tenant (opens browser for Google OAuth)
pnpm corsair auth --plugin=gmail --tenant=dev
#    → Click the URL shown, authorize in browser, then run the follow-up command printed
pnpm corsair auth --plugin=googlecalendar --tenant=dev
#    → Same: click URL, authorize, run follow-up command

# 6. Set up webhooks (Google will push changes to your /api/webhooks)
#    Start ngrok FIRST in a separate terminal:
ngrok http 3000
#    Copy the https URL shown (e.g. https://abc123.ngrok-free.dev)
#    Then register webhooks:
pnpm corsair auth --plugin=gmail --webhooks
pnpm corsair auth --plugin=googlecalendar --webhooks
#    Paste your ngrok URL + /api/webhooks when prompted

# 7. Start the dev server
pnpm run dev
```

---

## Running the App (Day-to-Day)

Every session you need three terminals:

```bash
# Terminal 1: Database
docker start corsair

# Terminal 2: Webhooks tunnel (keep running)
ngrok http 3000

# Terminal 3: Dev server
pnpm run dev
```

App runs at http://localhost:3000

---

## Key Commands

```bash
pnpm run dev          # Start dev server (Turbopack, hot reload)
pnpm run build        # Production build
pnpm run start        # Start production server
pnpm run db:push      # Push schema changes to database (no migration file)
pnpm run db:generate  # Generate migration files
pnpm run db:migrate   # Apply pending migrations
pnpm run db:studio    # Open Drizzle Studio GUI (browse DB in browser)
pnpm run check        # Lint + typecheck
pnpm run agent        # Run src/server/agent.ts (debug/test Corsair directly)
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Home page (Email / Calendar tabs)
│   ├── layout.tsx                      # Root layout + tRPC provider
│   ├── _components/
│   │   ├── gmail-panel.tsx             # Full email UI
│   │   └── calendar-panel.tsx          # Full calendar UI
│   └── api/
│       ├── trpc/[trpc]/route.ts        # tRPC HTTP endpoint
│       └── webhooks/route.ts           # Google push notification handler
├── server/
│   ├── corsair.ts                      # Corsair instance (plugins + DB + KEK)
│   ├── agent.ts                        # Standalone agent script (debug/test)
│   ├── api/
│   │   ├── root.ts                     # Combines all routers
│   │   ├── trpc.ts                     # tRPC setup + middleware
│   │   └── routers/
│   │       ├── gmail.ts                # Email procedures
│   │       └── calendar.ts             # Calendar procedures
│   ├── db/
│   │   ├── index.ts                    # Drizzle + postgres.js connection
│   │   └── schema.ts                   # Corsair table definitions
│   └── lib/
│       ├── tenant.ts                   # getTenant() helper
│       └── email.ts                    # RFC 2822 encode/decode utilities
├── lib/
│   ├── display.tsx                     # Date/sender/URL formatting
│   └── week.ts                         # Week calculation helpers
├── trpc/
│   ├── react.tsx                       # tRPC React Query provider
│   ├── server.ts                       # Server-side tRPC caller
│   └── query-client.ts                 # Shared QueryClient config
└── env.js                              # Env variable validation (Zod)
```

---

## How Corsair Works

Corsair is the integration layer between your app and Google APIs. It:

1. **Stores OAuth tokens** encrypted in PostgreSQL using a KEK (Key Encryption Key)
2. **Caches API responses** in `corsair_entities` table (JSONB) — so `corsair.db.threads.list()` reads from DB, not Google
3. **Handles webhooks** — when Google sends a push notification, Corsair updates the cache
4. **Provides a typed API** — `corsair.withTenant('dev').gmail.api.*` mirrors the Gmail REST API

### Two modes of access:
- **`.db.*`** — reads from local PostgreSQL cache (fast, no quota usage) → use for lists/search in UI
- **`.api.*`** — live call to Google (slower, uses quota) → use for creates, sends, refreshes

### Multi-tenancy:
- Each "tenant" is an isolated set of OAuth tokens + cached data
- Always call `.withTenant('dev')` (or your tenant ID) before any operation

---

## How tRPC Works Here

- Frontend calls `api.gmail.searchEmails.useQuery(...)` (React Query hook)
- That hits `/api/trpc/gmail.searchEmails` on the server
- Server procedure calls Corsair and returns typed data
- React Query caches the result, handles loading/error states

---

## Database Tables (Corsair-managed)

| Table | Purpose |
|---|---|
| `corsair_integrations` | Google OAuth app configs (client ID/secret per plugin) |
| `corsair_accounts` | Per-tenant OAuth tokens (encrypted at rest with DEK) |
| `corsair_entities` | Cached Gmail messages, Calendar events (JSONB) |
| `corsair_events` | Webhook event log |

---

## Common Gotchas

- **Webhook URL must be HTTPS** — ngrok gives you this; plain `localhost` won't work
- **Ngrok URL changes on restart** — re-register webhooks if it changes: `pnpm corsair auth --plugin=gmail --webhooks`
- **CORSAIR_KEK must never change** — it decrypts stored OAuth tokens; changing it locks you out
- **Gmail `raw` field** — Gmail API requires emails encoded as RFC 2822 + base64url; `src/server/lib/email.ts` handles this
- **Calendar time range** — always pass `timeMin`/`timeMax`; without them you'd fetch all events ever
- **DB-first pattern** — mutations use `.api`, reads use `.db`; mixing these up causes stale data or unnecessary quota use
- **tenant=dev** — hardcoded in several places; change `TENANT_ID` env var and update `getTenant()` if using a different name
