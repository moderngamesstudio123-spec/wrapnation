# Wrap Nation — Outbound Thermal Print Agent

This standalone Node.js daemon runs on the local shop computer connected to your 80mm thermal receipt printer (e.g. Epson, TVS, Everycom, NGX, POS-80).

## Key Security Features
- **Outbound-only connection**: Initiates HTTPS requests to the cloud server. **Zero inbound open ports, zero port-forwarding, zero router changes** needed.
- **Hashed API Key Authentication**: Authenticates with a 256-bit secret token passed via `X-Printer-Key`.
- **Idempotent Job Processing**: Uses unique job IDs to guarantee that no order slip is ever printed twice.
- **Dual Slip Support**:
  1. **Kitchen Slip (KOT)**: Large token, table/takeaway, time, items, quantities, combo variants, add-ons, and cooking notes. **No prices**.
  2. **Customer Bill**: Shop header, address, phone, GSTIN, token, itemized prices, subtotal, tax, grand total, and payment mode.
- **Configurable Width**: Supports 80mm (standard) and 58mm (compact) receipt paper.

---

## Quick Setup (Shop PC)

### 1. Install Node.js
Ensure Node.js (v18+) is installed on the shop PC.

### 2. Configure Environment Variables
Create a `.env` file in `/print-agent`:
```ini
SERVER_URL="https://your-wrapnation-domain.com"
PRINTER_KEY="wn_print_agent_secret_key_prod_80mm"
PRINTER_INTERFACE="mock" # Change to '//./COM3' for Windows USB/Serial or 'tcp://192.168.1.100' for Ethernet
PRINTER_WIDTH="80"
```

### 3. Test Printing
Run the test print utility to verify printer alignment and ESC/POS commands:
```bash
npm install
npm run test-print
```

### 4. Start Agent
```bash
npm start
```

### 5. Windows Auto-Startup on Boot
To ensure the print agent automatically starts when the shop computer turns on:
Right-click `scripts/install-service-win.ps1` -> **Run with PowerShell as Administrator**, or double-click `scripts/start-agent.bat` and place a shortcut in the Windows Startup folder (`shell:startup`).
