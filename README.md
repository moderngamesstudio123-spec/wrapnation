# Wrap Nation — Production QR Ordering & Billing POS System

A secure, mobile-first QR-based food ordering and live billing system built for **Wrap Nation** (India).

---

## 🌯 Key Highlights & Business Capabilities

1. **Cryptographic Table QR Ordering**:
   - Each table has an HMAC-SHA256 signed QR sticker (`/t/{signedTableToken}`) preventing table spoofing.
   - Separate Takeaway counter QR (`/takeaway`).
   - Admin page to generate and download printable A6 table stickers. Table stickers **never** include payment QRs to prevent physical sticker replacement fraud.
2. **Swiggy-Style Mobile-First Menu**:
   - Sticky category tabs with active scroll-spy (Wraps, Burgers, Fried Chicken, Snacks).
   - Veg / Non-veg badges, instant search, and Veg-only filter toggle.
   - Item customization sheet: Combos (+₹60, adds fries + cold drink) and add-ons (Extra Mayo +₹10, Extra Cheese +₹10, Cold Drink).
   - Sticky bottom cart bar (`3 items | Rs 410 | View Cart`).
   - Cooking notes (max 200 chars).
3. **Staff-Verified Payment Flow (PhonePe / GPay Direct UPI & Cash)**:
   - **No Payment Gateway Needed**: The shop uses its own static PhonePe/GPay soundbox and UPI QR.
   - Built behind a clean `PaymentProvider` interface so gateways (PhonePe PG / Razorpay / Cashfree) can be plugged in later without altering order logic.
   - When the customer taps "Pay via UPI", the server dynamically generates the shop's verified UPI QR, exact server-calculated amount, order token, and an **"Open UPI App"** deep link (`upi://pay?pa=...&am=...&tn=Order_101&cu=INR`).
   - **Crucial Security Rule**: Customers can **never** mark an order as paid (eliminating fake screenshot fraud). No "I have paid" button exists. Customers may optionally input the last 4 digits of their UPI Reference (UTR) as a hint for staff.
   - **Kitchen slips print ONLY after staff taps "Mark Paid"** on the POS dashboard.
   - **Duplicate-Payment Guard**: Enforces global uniqueness on transaction references (UTR) and prompts an alert if another order with the same amount was confirmed in the past 10 minutes.
4. **Live POS Dashboard (PWA)**:
   - Real-time Server-Sent Events (SSE) live orders board with synthesised audio chime alerts on new orders.
   - One-click order state transitions (`AWAITING_PAYMENT` -> `PREPARING` -> `READY` -> `COMPLETED`).
   - Fast walk-in manual billing screen for counter staff.
   - Menu management: out-of-stock toggles and price snapshotting (changes only affect future orders).
   - Daily sales reconciliation report (Cash vs UPI) with CSV export.
   - Thermal printer status indicator (Online / Offline) and one-click reprint button.
   - **Critical Settings Protection**: Modifying shop UPI ID or QR image requires **OWNER** role and mandatory password re-authentication.
5. **Outbound 80mm ESC/POS Thermal Print Agent (`/print-agent`)**:
   - Standalone Node.js daemon running on the shop PC.
   - Connects **outbound-only** to the cloud server over HTTPS using a hashed API key. **Zero incoming ports or router changes needed.**
   - Generates ESC/POS slips using `node-thermal-printer`:
     - **Kitchen Slip**: Big order token, table/takeaway, time, items, combo variants, add-ons, notes, **NO prices**.
     - **Customer Bill**: Shop header, GSTIN, token, itemized prices, subtotal, tax, grand total, and payment status.
   - Fallback `@media print` CSS for browser printing if the agent is down.
   - Windows startup service scripts (`scripts/install-service-win.ps1` and `scripts/start-agent.bat`).

---

## 🚀 Quickstart (Local Development)

### 1. Start the Embedded Database Daemon
The repository comes with a built-in embedded PostgreSQL daemon for instant local execution:
```bash
npm run db:daemon
```

### 2. Seed the Menu & Accounts
In a second terminal window, populate the database with the full Wrap Nation menu and staff credentials:
```bash
npm run db:seed
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run the Thermal Print Agent
In another terminal:
```bash
cd print-agent
npm start
```
To run a test print of sample Kitchen Slips and Customer Bills:
```bash
npm --prefix print-agent run test-print
```

---

## 🔑 Default Staff Credentials
Both demo accounts are pre-seeded with forced password rotation on initial login:
- **Owner (Admin)**: `owner@wrapnation.com` / `Owner@123456` (Full access to reports, settings, menu, orders)
- **Staff (POS)**: `staff@wrapnation.com` / `Staff@123456` (Orders, billing, and out-of-stock toggles only)

---

## 🧪 Running Automated Tests
```bash
# Run Vitest unit tests (price recalculation, HMAC tokens, RBAC guards, duplicate UTR)
npm test
```

---

## 🐳 Production Deployment with Docker Compose
```bash
# 1. Copy and configure environment variables
cp .env.example .env

# 2. Build and launch containers
docker compose up -d --build

# 3. Seed database
docker compose exec app npm run db:seed
```

---

## ⏱️ Background Cron Job (Expiring Unpaid Orders)
Unpaid orders older than the timeout (15 mins) are marked `EXPIRED` via `/api/cron/expire`:
- **Vercel**: Pre-configured in `vercel.json` to trigger every 5 minutes automatically.
- **VPS / Docker**: Add a crontab entry using curl with your `CRON_SECRET`:
  ```bash
  */5 * * * * curl -s -H "Authorization: Bearer <YOUR_CRON_SECRET>" https://yourdomain.com/api/cron/expire > /dev/null
  ```

---

## ⚠️ Mandatory Security & Secret Rotation Notice
> [!WARNING]
> The Supabase DB password, `SESSION_SECRET`, `HMAC_SECRET`, and `PRINTER_AGENT_RAW_KEY` that existed in the previous `.env` **must be rotated immediately**, because that file was shared in an archive that also contained the `.git` directory history.
>
> Ensure `.env` is never committed to git (kept in `.gitignore`).

---

## 🌐 Supabase & Vercel Latency Optimization
For production deployments in India:
- **Supabase Project Region**: Select **Mumbai (`ap-south-1`)**
- **Vercel Serverless Function Region**: Select **Mumbai (`bom1`)**
- **Database Connection Strings**:
  - `DATABASE_URL`: Use Supabase PgBouncer pooler URL with `?pgbouncer=true&connection_limit=1`
  - `DIRECT_URL`: Use direct Supabase port `5432` URL for Prisma migrations.

---

## 🔒 Security Documentation
- [STRIDE Threat Model](file:///d:/Wrap%20Nation/docs/THREAT_MODEL.md)
- [Security Architecture & Controls](file:///d:/Wrap%20Nation/docs/SECURITY.md)
- [REST API Reference](file:///d:/Wrap%20Nation/docs/API.md)
- [Deployment & Backup Guide](file:///d:/Wrap%20Nation/docs/DEPLOYMENT.md)

