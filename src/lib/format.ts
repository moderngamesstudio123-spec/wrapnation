/**
 * Formats an amount in paise to Indian Rupee (INR) display string.
 * Example: 13000 -> "₹130" or "₹130.50"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const formatted = rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2);
  return `Rs ${formatted}`;
}

/**
 * Returns plain numeric rupees from paise.
 * Example: 13000 -> 130
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Converts rupees float or integer to integer paise.
 * Example: 130 -> 13000, 10.50 -> 1050
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Masks a 10-digit Indian mobile number for privacy in UI and logs.
 * Example: "9876543210" -> "+91 98*** **210"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return phone;
  const last10 = clean.slice(-10);
  return `+91 ${last10.slice(0, 2)}*** **${last10.slice(7)}`;
}
