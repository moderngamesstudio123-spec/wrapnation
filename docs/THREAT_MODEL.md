# STRIDE Threat Model: Wrap Nation Ordering & Billing System

## 1. System Overview & Trust Boundaries
Wrap Nation is a high-volume fast food restaurant ordering and point-of-sale system in India. The system comprises:
- Public Customer Web App (accessible via table QR or takeaway URL on mobile browsers)
- Authenticated POS Dashboard (accessed on counter tablet / PC by STAFF and OWNER)
- Outbound ESC/POS Thermal Print Agent (running on local shop PC)
- Database (PostgreSQL with Prisma ORM)
- External integrations (WhatsApp Business Cloud API, Shop PhonePe/GPay direct UPI QR)

### Trust Boundaries:
1. **TB-1 (Untrusted Customer to Public API)**: All inputs over the internet from customer mobile browsers.
2. **TB-2 (Staff Client to Admin API)**: Authenticated POS operators with differing authorization levels (STAFF vs OWNER).
3. **TB-3 (Print Agent to Server API)**: Hardware node inside shop network communicating via outbound HTTPS.
4. **TB-4 (Third-Party Webhooks)**: Meta WhatsApp webhook calls arriving from the internet.

---

## 2. STRIDE Analysis Matrix

| Threat ID | STRIDE Category | Threat Description | Attack Vector | Severity | Mitigation & Verification |
|---|---|---|---|---|---|
| **TM-01** | **Spoofing** | **Fake Payment / Screenshot Fraud** | Customer presents a fabricated PhonePe/GPay payment success screenshot or clicks an artificial "I have paid" button to demand food. | **Critical** | **No customer "Mark Paid" button exists in the client.** Order state remains `AWAITING_PAYMENT`. Only authenticated STAFF/OWNER can confirm payment after verifying on the shop soundbox or PhonePe/GPay Business app. Kitchen slip **NEVER prints** until status transitions to `PAID`. |
| **TM-02** | **Spoofing** | **Shop UPI QR Substitution / Hijack** | Rogue staff or malicious actor substitutes the shop's UPI QR code or VPA (UPI ID) with their personal account to divert restaurant revenue. | **Critical** | 1. **Table QR stickers NEVER contain payment QRs**, only the signed menu URL (`/t/{signedToken}`).<br>2. Payment QR and UPI ID are rendered dynamically from database settings.<br>3. Modifying UPI settings is restricted exclusively to **OWNER** role, requires current password re-authentication, and records an immutable entry in `AuditLog`. |
| **TM-03** | **Spoofing** | **Table Number Spoofing** | Malicious customer changes URL parameter (e.g. `?table=5` to `?table=1`) to place orders against other diners' tables. | **High** | Cryptographic HMAC-SHA256 signature generated on the server: `token = tableNumber + "." + HMAC(tableNumber, SECRET)`. Invalid or tampered tokens are rejected before order creation. |
| **TM-04** | **Spoofing** | **Print Agent Impersonation** | Unauthorized client attempts to fetch or manipulate print jobs by guessing endpoints. | **High** | Outbound agent authenticates using a cryptographically random SHA-256 hashed API key. Communication is outbound HTTPS only. Zero incoming ports open. |
| **TM-05** | **Tampering** | **Price & Total Manipulation** | Attacker intercepts or modifies JSON payload on order submission (`total: 0`, `price: 100`). | **Critical** | **Server calculates 100% of prices, taxes, and totals from the database.** Client amounts are completely ignored. Only `itemId`, `variantId`, `addOnIds`, and `quantity` are accepted. |
| **TM-06** | **Tampering** | **Duplicate UTR Replay Fraud** | Customer makes a single payment of Rs 150, obtains a UTR, and attempts to confirm two separate Rs 150 orders using the same reference. | **High** | Global unique constraint on `Payment.utr`. If staff enters a previously recorded UTR, database rejects transaction. POS UI additionally warns if an identical amount was confirmed in the past 10 minutes. |
| **TM-07** | **Tampering** | **Retroactive Menu Price Mutation** | Menu price edit corrupts past sales records and reporting integrity. | **High** | Orders use immutable `OrderItem` snapshots (item name, variant name, unit price, and subtotal at the exact moment of order placement). Future price edits never alter historical orders. |
| **TM-08** | **Repudiation** | **Staff Embezzlement of Cash Orders** | Staff member collects cash from a customer and marks it paid, but later claims they never handled the cash. | **Medium** | Every "Mark Paid" operation records the staff user's ID in `Payment.confirmedById` and in `AuditLog` with IP address, timestamp, payment method, and amount. Daily closing report aggregates cash vs UPI. |
| **TM-09** | **Information Disclosure** | **Sequential Order ID Enumeration** | Competitor or snooper queries `/order/101`, `/order/102` to extract store volume, customer names, or phone numbers. | **High** | Public customer order tracking URLs use cryptographically random 128-bit UUIDs (`/order/{uuid}`). Sequential daily order numbers (#101) are internal business tokens only. |
| **TM-10** | **Information Disclosure** | **Customer PII Leakage** | Takeaway phone numbers and names exposed in application logs or unhandled exceptions. | **Medium** | Customer phone numbers are masked in logs (`+91 98*** **321`). Production error handler returns generic user-facing errors with unique correlation IDs, omitting stack traces. Automated retention script purges customer PII after 90 days. |
| **TM-11** | **Denial of Service** | **Unpaid Order Flooding** | Attacker or bot script floods server with thousands of unpaid fake orders. | **High** | 1. Unpaid orders do NOT reach kitchen or trigger printing.<br>2. Unpaid orders auto-expire after 15 minutes.<br>3. Sliding-window rate limiting per IP and per phone number.<br>4. Operating hours check blocks orders when shop is closed. |
| **TM-12** | **Denial of Service** | **Brute-Force Staff Authentication** | Script attempts dictionary attacks on `/api/auth/login`. | **High** | Argon2id password hashing, sliding-window rate limiting per IP/username, and temporary 15-minute account lockout after 5 consecutive failed attempts. |
| **TM-13** | **Elevation of Privilege** | **Staff Accessing Financial Reports or Settings** | Employee with STAFF role attempts to access `/admin/reports` or alter shop settings. | **High** | Role-based middleware enforces strict server-side checks on all `/api/reports/*` and `/api/settings/*` endpoints with deny-by-default logic. |

---

## 3. Residual Risk & Recommendations
1. **Physical Soundbox Tampering**: Staff must verify the audio chime directly on the shop's physical soundbox or PhonePe/GPay Business app before tapping "Mark Paid" on POS.
2. **Printer Physical Connectivity**: If the USB thermal printer runs out of paper or disconnects, the print-agent queues jobs and marks them as failed after retries, alerting staff via the POS dashboard.
