# Wrap Nation REST API Reference

All requests and responses use JSON format. Date-time fields are formatted in ISO-8601 strings. All monetary figures are integer **paise** (1 INR = 100 paise) unless explicitly labeled otherwise.

---

## 1. Authentication
### `POST /api/auth/login`
Authenticates a staff or owner account.
- **Rate Limit**: 5 requests / minute per IP.
- **Lockout**: 15 minutes after 5 consecutive failures.
- **Request Body**:
  ```json
  {
    "email": "staff@wrapnation.com",
    "password": "Password123"
  }
  ```
- **Response**: Sets `wn_session` HTTP-only cookie.
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "staff@wrapnation.com",
      "name": "Counter Staff",
      "role": "STAFF",
      "mustChangePassword": false
    }
  }
  ```

### `POST /api/auth/logout`
Destroys the session in the database and clears the session cookie.

### `GET /api/auth/me`
Returns current session user or 401 if unauthenticated.

### `POST /api/auth/change-password`
Updates password for the currently logged in user.
- **Request Body**: `{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }`

---

## 2. Menu
### `GET /api/menu`
Public endpoint returning active menu categories, items, combo variants, and available add-ons.

### `POST /api/menu/toggle-stock`
Requires `STAFF` or `OWNER` session.
- **Request Body**:
  ```json
  {
    "itemId": "uuid",
    "isAvailable": false
  }
  ```

---

## 3. Orders
### `POST /api/orders`
Creates a customer order. The server calculates 100% of prices, taxes, and totals from the database.
- **Request Body**:
  ```json
  {
    "type": "DINE_IN",
    "tableToken": "3.3a8f...",
    "customerName": null,
    "customerPhone": null,
    "whatsappOptIn": true,
    "cookingNote": "Less spicy",
    "paymentMethod": "UPI",
    "items": [
      {
        "menuItemId": "uuid",
        "variantId": "uuid",
        "addOnIds": ["uuid"],
        "quantity": 2
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "order": {
      "id": "128-bit-uuid",
      "orderNumber": 101,
      "takeawayToken": null,
      "status": "AWAITING_PAYMENT",
      "subtotal": 40000,
      "tax": 2000,
      "total": 42000
    }
  }
  ```

### `GET /api/orders/[id]`
Customer order tracking endpoint.
- Returns order status, item snapshots, and if `AWAITING_PAYMENT`, includes the verified shop UPI QR data and prefilled UPI deep link.

### `POST /api/orders/[id]/mark-paid`
**Strictly STAFF/OWNER only.** Confirms payment and triggers thermal printing of Kitchen Slip and Customer Bill.
- **Request Body**:
  ```json
  {
    "method": "UPI",
    "utr": "492198210492",
    "notes": "Verified on PhonePe soundbox"
  }
  ```

### `POST /api/orders/[id]/status`
**STAFF/OWNER only.** Advances preparation status (`PREPARING`, `READY`, `COMPLETED`, `CANCELLED`).

### `POST /api/orders/[id]/customer-utr`
Allows customer to provide the last 4 digits of their UPI payment reference as a hint for counter staff.

### `GET /api/orders/stream`
Server-Sent Events (SSE) feed.
- For Admin POS: broadcasts `NEW_ORDER`, `ORDER_STATUS_CHANGED`, `PAYMENT_CONFIRMED`, `MENU_STOCK_CHANGED`.
- For Customer (`?orderId=uuid`): streams events for that specific order.

---

## 4. Printer Agent
### `GET /api/printer/jobs`
Outbound polling endpoint for the local Node.js print-agent. Authenticated via `X-Printer-Key` header.
- Returns list of pending print jobs with pre-rendered ESC/POS payloads.

### `POST /api/printer/ack`
Acknowledges a print job (`{ "jobId": "uuid", "success": true }`).

### `POST /api/printer/status`
Heartbeat sent by print-agent every 15 seconds.

---

## 5. Settings & Reports
### `GET /api/reports?date=YYYY-MM-DD`
**OWNER only.** Returns daily sales, cash vs UPI reconciliation, and top selling items.

### `GET /api/reports/export?date=YYYY-MM-DD`
**OWNER only.** Downloads CSV file of daily sales.

### `PUT /api/settings/upi`
**OWNER only.** Modifies shop UPI ID, payee name, and static QR. Requires current password verification.
