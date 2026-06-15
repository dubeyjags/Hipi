# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (Next.js + Turbopack)
pnpm build            # Production build
pnpm check            # Lint + type-check
pnpm typecheck        # TypeScript only
pnpm lint             # ESLint only
pnpm format:write     # Prettier format
pnpm agent            # Run src/server/agent.ts directly with tsx

# Database (Drizzle + Postgres)
pnpm db:push          # Push schema changes to DB
pnpm db:studio        # Drizzle Studio UI
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run migrations

# Corsair CLI (discover APIs before writing code)
pnpm corsair list                             # All live API endpoints
pnpm corsair list --type db                  # Cached DB entity types
pnpm corsair schema gmail.api.messages.send  # Schema for one endpoint

# Auth setup (one-time, per plugin/tenant)
pnpm corsair setup --gmail client_id=... client_secret=...
pnpm corsair auth --plugin=gmail --tenant=dev
pnpm corsair auth --plugin=gmail --webhooks
```

Services needed locally: `docker start corsair` (Postgres), `ngrok http 3000` (webhook tunnel).

## Architecture

This is a T3 stack app (Next.js 15, tRPC 11, Drizzle ORM, Tailwind v4) that acts as a Google Workspace demo UI. It wraps **Corsair** — an integration layer that provides local Postgres caching + OAuth management for Gmail, Google Calendar, and GitHub.

### Corsair pattern: DB vs API

Every Corsair plugin exposes two namespaces:
- `.db.*` — reads from local Postgres cache (fast, no rate limits). Use for all UI list/search queries.
- `.api.*` — live calls to the external service. Use only for user-initiated sync ("Refresh" button) and all write operations (send, create).

All calls are tenant-scoped via `corsair.withTenant(tenantId)`. The tenant is resolved from `TENANT_ID` env var (defaults to `"dev"`) in `src/server/lib/tenant.ts`.

### Request flow

```
Browser → tRPC (React Query) → Next.js API Route (/api/trpc)
                                    → tRPC Router (src/server/api/routers/)
                                    → getTenant() → corsair.withTenant()
                                    → .db.* or .api.*

Webhooks → POST /api/webhooks → processWebhook(corsair, ...) → updates DB cache
```

### Key files

- `src/server/corsair.ts` — Corsair singleton (plugins: gmail, googlecalendar, github)
- `src/server/lib/tenant.ts` — `getTenant()` helper, reads `TENANT_ID` env
- `src/server/lib/email.ts` — `encodeRawEmail()` (base64url RFC 2822), `extractBodyFromPayload()`, `getHeader()`
- `src/server/api/routers/gmail.ts` — tRPC router: searchEmails, getMessage, listDrafts, refreshInbox, createDraft, sendDraft, sendEmail
- `src/server/api/routers/calendar.ts` — tRPC router: searchEvents, refreshEvents, createDraft, sendInvite
- `src/server/db/schema.ts` — Drizzle schema for Corsair's tables (corsair_integrations, corsair_accounts, corsair_entities, corsair_events)
- `src/app/api/webhooks/route.ts` — Webhook handler for all Corsair plugins
- `src/server/agent.ts` — One-off script for testing Corsair calls directly

### DB entity shape

```typescript
{ id, entity_id, updated_at, data: { snippet, subject, from, summary, start, ... } }
```

- `entity_id` is the external ID (Gmail message ID, Calendar event ID)
- The cache can contain duplicate `entity_id` rows — always dedupe by `entity_id`, keeping the row with the latest `updated_at`
- Search filters wrap fields in a `data` key: `{ data: { snippet: { contains: 'hello' } }, limit: 50 }`

### Gotchas

**Gmail**
- `messages.send` and `drafts.create` require `raw`: base64url-encoded RFC 2822 MIME (replace `+`→`-`, `/`→`_`, strip `=`). Use `encodeRawEmail()` from `src/server/lib/email.ts`.
- `messages.get` with `format: 'full'` returns nested `payload.parts`; use `extractBodyFromPayload()` to recursively find `text/plain`.
- DB messages may already have `subject`, `from`, `to`, `body` parsed — check cache before hitting the live API (`getMessage` procedure does this).

**Calendar**
- `events.getMany` without `timeMin`/`timeMax` returns events from the beginning of time — always pass both.
- `sendUpdates: 'none'` saves event without notifying attendees; `'all'` sends invites.

**Do not guess Corsair endpoints.** Run `pnpm corsair list` and `pnpm corsair schema <endpoint>` before writing new Corsair calls.

## Environment variables

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/google-demo
CORSAIR_KEK=<base64 key>
TENANT_ID=dev
```

`src/env.js` validates env vars at startup via `@t3-oss/env-nextjs`. Add new server-side vars there.
