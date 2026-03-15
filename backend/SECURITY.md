# RunwayIQ — Security

How we protect confidential financial data so companies can trust the platform.

---

## Why security matters here

SMEs upload their actual revenue, burn rate, and runway data. A breach or cross-tenant data leak would expose a company's most sensitive financials to competitors or bad actors. Every security decision in this backend was made with that threat model in mind.

---

## Layer 1 — Authentication (Supabase JWT)

Every endpoint except `/health` requires a valid JWT in the `Authorization` header:

```
Authorization: Bearer <supabase-access-token>
```

**How verification works:**

1. The `requireAuth` middleware extracts the Bearer token from the header
2. It calls `supabase.auth.getUser(token)` — this hits Supabase's auth server to validate the token's signature and expiry
3. If invalid or expired → `401 Unauthorized`
4. If valid → the Supabase `user` object is attached to `req.user`

No JWT parsing is done manually. Supabase handles signature verification, expiry, and revocation.

**What happens without a token:**
```json
HTTP 401
{ "error": "Authentication required" }
```

**What happens with an expired token:**
```json
HTTP 401
{ "error": "Invalid or expired token" }
```

---

## Layer 2 — Multi-Tenant Isolation

This is the most critical security property. Without it, any authenticated user could read another company's financial data by guessing a `businessId`.

**The old (broken) pattern:**
```js
const businessId = req.body.businessId || process.env.BUSINESS_ID
// ↑ attacker passes any businessId they want
```

**The current (secure) pattern:**
```js
// In requireAuth middleware:
const business = await prisma.business.findUnique({ where: { userId: user.id } })
req.businessId = business.id

// In every route:
const businessId = req.businessId  // from JWT — never from client
```

The `Business` table has `userId @unique` — one Supabase user owns exactly one business. The mapping is resolved server-side from the verified JWT. **The client has no way to influence which business's data is returned.**

**What happens if a valid user has no business account:**
```json
HTTP 403
{ "error": "No business account found for this user" }
```

---

## Layer 3 — Security Headers (Helmet)

`helmet()` is applied as the first middleware in `index.js`. It sets:

| Header | What it does |
|--------|-------------|
| `Content-Security-Policy` | Restricts which sources can load scripts, styles, etc. |
| `X-Frame-Options: DENY` | Prevents clickjacking via iframes |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing attacks |
| `Referrer-Policy` | Controls what referrer info is sent |
| `Strict-Transport-Security` | Forces HTTPS in supported browsers |
| `X-DNS-Prefetch-Control` | Prevents DNS prefetching leaks |

These are passive protections — they cost nothing and close a class of browser-level attacks.

---

## Layer 4 — CORS Restriction

Without restriction, any website in the world can make API calls to the backend using a logged-in user's credentials.

```js
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,  // e.g. http://localhost:5173
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
```

In production, set `FRONTEND_ORIGIN` to your deployed frontend URL (e.g. `https://runwayiq.vercel.app`). Requests from any other origin are blocked at the browser level.

---

## Layer 5 — Rate Limiting

Two tiers protect against abuse and API cost attacks.

### Global limiter (all routes)
- **200 requests per 15 minutes per IP**
- Blocks basic scraping and brute force attempts
- Returns standard `Retry-After` headers

### Report limiter (`POST /api/report/generate` only)
- **5 requests per hour per user ID**
- This endpoint triggers 3 Claude API calls — without a limit, a single user could burn through API budget in seconds
- Keyed by `req.user.id` (not IP) so VPNs and shared offices don't cause false positives

**What a rate-limited response looks like:**
```json
HTTP 429
{ "error": "Report generation limit reached. Try again in an hour." }
```

---

## Layer 6 — Input Validation (Zod)

All user-controlled inputs are validated with Zod before any business logic runs.

### `GET /api/forecast?months=N`
```js
months: z.coerce.number().int().min(1).max(24).default(3)
```
Without this, passing `months=999999` would trigger a near-infinite computation loop.

### CSV rows (every row in every upload)
```js
date:        z.string().refine(s => !isNaN(Date.parse(s)))
amount:      z.number().min(-10_000_000).max(10_000_000)
direction:   z.enum(['inflow', 'outflow'])
category:    z.enum(['revenue', 'cogs', 'payroll', 'rent', 'utilities',
                     'marketing', 'software', 'travel', 'tax',
                     'refund', 'transfer', 'uncategorised'])
description: z.string().max(500).nullable().optional()
merchantName:z.string().max(200).nullable().optional()
```

Invalid rows return `422` with per-row, per-field errors so the user can fix and re-upload:
```json
HTTP 422
{
  "error": "CSV validation failed on 2 row(s)",
  "validationErrors": [
    { "row": 3, "issues": [{ "field": "amount", "message": "Amount above $10M limit" }] },
    { "row": 7, "issues": [{ "field": "direction", "message": "Invalid enum value. Expected 'inflow' | 'outflow'" }] }
  ]
}
```

---

## Layer 7 — CSV File Security

Beyond row-level validation, the file upload itself has multiple protections:

| Protection | Implementation |
|-----------|----------------|
| File type check | `mimetype === 'text/csv'` OR filename ends with `.csv` |
| File size limit | Max 10 MB (Multer config) |
| Row limit | Max 5,000 rows — stream is destroyed immediately if exceeded |
| File cleanup | `fs.unlink(filePath)` called in both `end` and `error` handlers — temp file never persists on disk |
| No filename trust | Multer stores uploaded files with UUID names, never using the original filename |

**Why the row limit matters:** Without it, an attacker could upload a 500,000-row CSV and exhaust server memory. The stream is destroyed the moment the limit is hit — it doesn't read the rest of the file.

---

## Layer 8 — Error Response Sanitization

In production, 5xx errors never expose internal details:

```js
// 4xx — our own controlled messages, safe to return
// 5xx — generic in production, full message in dev only
const clientMessage = status < 500
  ? err.message
  : isDev ? err.message : 'An internal error occurred'
```

**What a production 5xx looks like:**
```json
HTTP 500
{ "error": "An internal error occurred" }
```

The full error message and stack trace are still logged server-side as structured JSON for debugging — they just never reach the client.

---

## Layer 9 — Audit Logging

Every authenticated request emits a structured log line:

```json
{
  "event": "data_access",
  "userId": "abc-123",
  "businessId": "biz-456",
  "method": "GET",
  "path": "/",
  "ip": "192.168.1.1",
  "ts": "2024-06-15T14:23:01.000Z"
}
```

This creates a full trail of who accessed what data and when. At hackathon scale this goes to stdout — in production it would pipe to a log aggregator (e.g. Datadog, Logtail).

---

## Threat model summary

| Threat | Mitigation |
|--------|-----------|
| Unauthenticated access | Supabase JWT required on every route |
| Cross-tenant data leak | `businessId` from JWT only, never from client |
| Stolen token reuse | Supabase validates expiry server-side on every request |
| Malicious CSV (oversized) | 10 MB file limit + 5,000 row limit |
| Malicious CSV (bad data) | Zod row validation — invalid rows rejected with detail |
| Disk exhaustion via uploads | Temp file deleted immediately after parse |
| API cost abuse (Claude) | 5 req/hr/user rate limit on report generation |
| DDoS / scraping | 200 req/15min global rate limit |
| XSS / clickjacking | Helmet security headers |
| Cross-origin requests | CORS restricted to FRONTEND_ORIGIN |
| Internal detail leakage | 5xx responses generic in production |
| Untracked data access | Structured audit log on every auth'd request |
