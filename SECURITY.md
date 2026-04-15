# DebtGuard Security Report

_Audit date: 2026-04-06_

---

## What Was Fixed

### 1. Rate Limiting (NEW — `src/lib/rate-limiter.ts`)

An in-memory rate limiter was added and applied to all 7 API routes.

| Route | Key prefix | Limit |
|---|---|---|
| `POST /api/chat` | `chat:{ip}` | 20 req / 15 min |
| `POST /api/chat/demo` | `demo:{ip}` | 20 req / 15 min |
| `GET /api/chat/configured` | `cfg:{ip}` | 20 req / 15 min |
| `POST /api/ai/insights` | `insights:{ip}` | 20 req / 15 min |
| `POST /api/analyze` | `analyze:{ip}` | 20 req / 15 min |
| `POST /api/optimize` | `opt:{ip}` | 20 req / 15 min |
| `POST /api/simulation-analysis` | `simlysis:{ip}` | 20 req / 15 min |

- IP is extracted from `x-forwarded-for` → `x-real-ip` → `'unknown'`
- Returns HTTP 429 with `{ error: "too_many_requests", retryAfter: <seconds> }` and `Retry-After` header
- Store auto-cleans when it exceeds 1000 entries

The `/api/chat/demo` route is public (no auth) and was the highest priority.

### 2. Body Size Limits (NEW)

All POST routes now reject oversized payloads before parsing JSON:

- Standard routes: **50 KB** limit (returns HTTP 413)
- `/api/simulation-analysis`: **200 KB** limit (simulation arrays with up to 120 months × multiple scenarios can exceed 50 KB legitimately)

### 3. Security Headers (`next.config.ts`)

Added the missing `X-XSS-Protection: 1; mode=block` header. The following headers were already present and verified:

| Header | Value | Status |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Already present ✓ |
| `X-Frame-Options` | `DENY` | Already present ✓ |
| `X-XSS-Protection` | `1; mode=block` | **Added** |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Already present ✓ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Already present ✓ |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Already present ✓ |
| `Content-Security-Policy` | Full CSP (default-src 'self', frame-ancestors 'none', ...) | Already present ✓ |

### 4. `.gitignore` Update

Added `*.env` pattern to catch files ending in `.env` (e.g., `secrets.env`, `prod.env`). The existing `.env*` pattern already covers files beginning with `.env`.

---

## Secrets Scan Results

Scanned all `.ts`, `.tsx`, `.js`, `.json`, `.env*`, `.md` files.

**No hardcoded secrets found.**

| Pattern | Result |
|---|---|
| `sk-*` API keys | None found |
| JWT tokens (`eyJ...`) | None found |
| Hardcoded `ANTHROPIC_API_KEY` | None — always via `process.env` |
| Hardcoded `OPENAI_API_KEY` | None found |
| Supabase URLs in source | `placeholder.supabase.co` — intentional no-op fallback, not a real credential |
| Passwords in source | Variable names only (e.g., `newPassword` in settings UI), no hardcoded values |

All API keys are loaded exclusively from environment variables:
- `process.env.ANTHROPIC_API_KEY` — used in insights, analyze, simulation-analysis routes
- `process.env.NEXT_PUBLIC_SUPABASE_URL` — loaded in supabase client/server modules
- `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` — loaded in supabase client/server modules
- `process.env.PYTHON_SERVICE_URL` — optional, defaults to `http://localhost:8000`

---

## Input Sanitization Audit

### Already in Place (pre-audit)

- **`sanitizeNum()`** — coerces to finite float, rejects NaN/Infinity (used in all AI routes)
- **`sanitizeStr()`** — strips control characters and prompt injection patterns, length-caps strings (used in all AI routes)
- **Message length limits** — chat: 4000 chars/msg, demo: 500 chars/msg
- **Message count limits** — chat: 40 messages, demo: 5 messages
- **Structured extraction** — all routes extract only named fields; unknown fields are ignored
- **Type checking** — string/number/object/array types are explicitly validated before use
- **JSON parse errors** — all routes catch `req.json()` failures and return 400
- **AI output validation** — all AI responses are validated/coerced before returning to client (never trusted raw)
- **Driver name sanitization** — `analyze` route strips all chars except `[\w\s,().%-]`
- **SessionId validation** — `/api/chat` validates `^[\w-]{1,64}$` before use

### Added During Audit

- Body size checks (50 KB / 200 KB) — see section 2 above

### Not Added (Rationale)

- **Content-Type validation** — Skipped: Next.js already handles this before the handler is called, and `.json()` will throw on malformed bodies
- **CSRF tokens** — Not needed: all mutating routes use `Authorization` (Supabase JWT) or are session-authenticated server-side

---

## AI Intercept Regex Audit (`src/lib/chat-intercepts.ts`)

The intercept regex was verified correct:

```
/debt.?free|when.*(will i|can i).*(pay|be free)|how long.*(until|to pay|before)|payoff.*(date|timeline|when)|when.*paid off/
```

**Does NOT intercept** (general strategy questions):
- "how can I find extra money to pay off debt faster?" ✓
- "how do I pay off debt?" ✓

**Does intercept** (specific timeline questions):
- "when will I be debt free?" ✓
- "how long until paid off?" ✓
- "payoff timeline?" ✓

No changes were needed.

---

## Remaining Concerns / Recommendations

### Medium Priority

1. **Rate limiter is in-memory and per-process**: In a multi-instance deployment (e.g., Vercel serverless with multiple cold starts), each instance has its own store. A distributed rate limiter (Redis/Upstash) would be needed for production at scale. For launch with modest traffic this is acceptable.

2. **`unknown` IP fallback**: Requests without any IP headers (e.g., direct server access, some proxy configs) all share the `unknown` key. This means if many such requests arrive, they share a single rate limit bucket. Low risk for a typical deployment behind Vercel/Cloudflare.

3. **`/api/chat/demo` has no auth**: This is intentional (public demo), but it is the most exposed endpoint. The 20 req/15 min limit per IP mitigates abuse. Consider lowering to 10 req/15 min if abuse is observed.

### Low Priority

4. **CSP uses `unsafe-inline` and `unsafe-eval`**: Required by Framer Motion and Next.js. This is a known trade-off for this stack. Nonce-based CSP would be more secure but requires significant refactoring.

5. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed client-side**: This is by design in the Supabase architecture — the anon key has row-level security (RLS) applied at the database level. Ensure RLS policies are correctly configured in Supabase.

6. **Python service URL**: `PYTHON_SERVICE_URL` defaults to `localhost:8000`. In production, ensure this points to the correct internal service and is not accessible externally.

---

## Security Posture Summary

| Area | Status |
|---|---|
| Authentication (all protected routes) | Supabase JWT, server-side ✓ |
| Rate limiting | In-memory, 20 req/15 min per IP ✓ |
| Body size limits | 50 KB standard / 200 KB simulation ✓ |
| Input sanitization | Numbers, strings, lengths, types validated ✓ |
| Prompt injection defense | `sanitizeStr()` strips control chars and injection patterns ✓ |
| Error leakage | H-3: Generic errors returned, internals suppressed ✓ |
| Security headers | Full set including CSP, HSTS, X-Frame-Options ✓ |
| Secrets management | All via env vars, none hardcoded ✓ |
| `.gitignore` | Covers all `.env*` and `*.env` patterns ✓ |
| SQL injection | Supabase parameterized queries (no raw SQL) ✓ |
| XSS | CSP + `X-XSS-Protection` + React's default escaping ✓ |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` ✓ |
