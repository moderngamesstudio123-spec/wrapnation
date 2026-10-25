# Security Architecture & Controls: Wrap Nation

## 1. Authentication & Session Management
- **Password Hashing**: Passwords are saved using **Argon2id** (`@node-rs/argon2`) with recommended cryptographic parameters:
  - Memory cost: 65,536 KiB (64 MB)
  - Time cost (iterations): 3
  - Parallelism: 4 threads
  - Output length: 32 bytes
- **Account Lockout & Brute-Force Defense**:
  - Consecutive failed logins are tracked in `User.failedLoginAttempts`.
  - Upon reaching 5 consecutive failures, the account is locked for 15 minutes (`User.lockoutUntil`).
  - Sliding-window IP rate limiter restricts login attempts to 5 per minute per IP address.
- **Forced Password Rotation**:
  - Demo accounts or newly provisioned staff accounts have `User.mustChangePassword = true`.
  - The middleware intercepts all authenticated requests from users flagged with `mustChangePassword` and redirects them exclusively to `/change-password` until updated.
- **Session Security**:
  - Session tokens are generated using `crypto.randomBytes(32).toString('hex')`.
  - Only the SHA-256 hash of the session token is stored in the database (`Session.tokenHash`).
  - Session cookie attributes: `httpOnly: true`, `secure: true` (in production), `sameSite: 'strict'`, `path: '/'`, `maxAge: 7 * 24 * 60 * 60` (7 days).
  - Explicit logout invalidates the session record in the database immediately.

---

## 2. Authorization & Role-Based Access Control (RBAC)
- Two distinct roles: `OWNER` and `STAFF`.
- **Deny by default**: Every administrative server action and route handler invokes `requireAuth(role)`:
  - `STAFF`: Allowed to view live orders, update preparation status (`PREPARING`, `READY`, `COMPLETED`), mark orders paid at counter, initiate manual walk-in billing, toggle item stock availability (`isAvailable`), and trigger reprints.
  - `OWNER`: All STAFF capabilities, plus accessing gross revenue reports, exporting financial CSVs, modifying opening/closing hours, table counts, tax rates, and updating shop UPI ID / QR codes.
- **Critical Operation Protection**: Changing shop UPI ID or uploading a replacement UPI QR requires:
  1. `OWNER` role check.
  2. Re-entry and verification of the owner's current password.
  3. Writing an immutable entry to `AuditLog`.

---

## 3. Business-Logic Integrity & Pricing Calculations
- **Server Recalculation**: Prices submitted by the client are strictly ignored.
- The server retrieves item base prices, variant price deltas, and add-on prices directly from PostgreSQL via parameterized queries.
- Order subtotals, GST amounts (if enabled), and grand totals are calculated in integer **paise** (1 INR = 100 paise), completely avoiding floating-point rounding errors.
- **Table Token Security**: Dine-in table URLs use HMAC-SHA256 tokens (`/t/{signedToken}`). The token format is `[tableNumber].[signature]`. Signatures are computed using a server secret. Any tampering with table numbers results in immediate rejection.
- **Order Tracking Isolation**: Customer order tracking URLs use 128-bit cryptographically random UUIDs (`/order/[uuid]`). Customers cannot guess adjacent order tokens.

---

## 4. Payment Verification (Manual UPI / Cash Flow)
- **Zero Frontend Authority**: No client button can set an order to `PAID`.
- Order state initiates as `AWAITING_PAYMENT`.
- When the customer chooses "Pay via UPI", the server sends:
  - Exact verified server-computed amount
  - Shop UPI ID and Payee Name from database settings
  - Verified deep link: `upi://pay?pa={vpa}&pn={name}&am={amount}&tn=Order_{orderNumber}&cu=INR`
  - Shop UPI QR image URL
- Customers may optionally input the last 4 digits of their transaction reference (UTR) as a hint for staff.
- **Staff Confirmation**: Staff verifies credit on the physical soundbox or PhonePe/GPay Business app, opens the order on the POS, and clicks "Mark Paid".
- **Duplicate UTR Guard**:
  - `Payment.utr` is indexed with a unique database constraint.
  - The POS prompts a warning if another order with the identical amount was marked paid in the preceding 10 minutes.
- **Auto-Expiration**: Unpaid orders automatically transition to `EXPIRED` after 15 minutes (configurable), releasing pending table holds.
- **Kitchen Slips**: Kitchen tickets are queued to print **only after status is transitioned to `PAID`**.

---

## 5. Thermal Printing & Hardware Security
- Print agent in `/print-agent` runs on the local shop PC and establishes **outbound-only** HTTPS communication to the server (`/api/printer/jobs`).
- Zero inbound firewall ports or port forwarding required on the restaurant network.
- Print agent authenticates with a 256-bit random API key, stored hashed (SHA-256) on the server.
- The API key can be revoked or rotated immediately from the Admin Settings dashboard.
- Print jobs are queued with unique IDs; jobs are acknowledged idempotently to prevent double printing.

---

## 6. Input Validation & Injection Defenses
- **Zod Schema Validation**: 100% of client-submitted parameters (JSON request bodies, query parameters, route slugs) are parsed and validated with Zod.
- `z.object(...).strict()` is used to reject unknown fields.
- **Database Safety**: All database interactions use Prisma ORM with parameterized SQL queries. Zero string concatenation in database access.
- **Cooking Notes Sanitization**: Cooking notes are trimmed, limited to 200 characters, and escaped when rendered.

---

## 7. HTTP Security Headers & Hardening
The application enforces standard security headers in `next.config.ts`:
```typescript
{
  key: 'X-Frame-Options',
  value: 'DENY'
},
{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
},
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
},
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=()'
},
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
}
```

---

## 8. Data Privacy & Customer PII Retention
- Takeaway customer phone numbers and names are collected solely for order fulfillment and opt-in WhatsApp notifications.
- Customer phone numbers are masked in server logs (`+91 98*** **321`).
- An automated maintenance script (`npm run cleanup:pii`) purges customer names, phone numbers, and cooking notes older than 90 days while preserving anonymized financial sales records for tax and revenue auditing.
