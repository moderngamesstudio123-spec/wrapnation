import crypto from 'crypto';

function getSecret(secret?: string): string {
  return secret || process.env.HMAC_SECRET || 'wrap_nation_table_hmac_secret_key_must_be_random_and_secure!';
}

/**
 * Generates an HMAC-SHA256 signature for a table number.
 * Resulting token format: `${tableNumber}.${signatureHex}`
 */
export function signTableToken(tableNumber: number, customSecret?: string, short: boolean = true): string {
  if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
    throw new Error('Table number must be a positive integer');
  }

  const secret = getSecret(customSecret);
  const data = `table:${tableNumber}`;
  const fullSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // 16-hex characters (64 bits of entropy) produces a clean, low-density Version 2 QR code
  // which budget Android phone cameras can autofocus on instantly
  const sig = short ? fullSignature.slice(0, 16) : fullSignature;
  return `${tableNumber}.${sig}`;
}

/**
 * Validates an HMAC-signed table token.
 * Uses constant-time buffer comparison to prevent timing attacks.
 * Accepts both 16-character compact tokens and legacy 64-character tokens.
 */
export function verifyTableToken(token: string, customSecret?: string): { valid: boolean; tableNumber?: number } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [tableStr, signature] = parts;
  const tableNumber = parseInt(tableStr, 10);

  if (isNaN(tableNumber) || tableNumber <= 0 || `${tableNumber}` !== tableStr) {
    return { valid: false };
  }

  const secret = getSecret(customSecret);
  const fullSig = crypto
    .createHmac('sha256', secret)
    .update(`table:${tableNumber}`)
    .digest('hex');

  // Support both 16-char compact tokens and full 64-char tokens
  const expectedSig = signature.length === 16 ? fullSig.slice(0, 16) : fullSig;

  // Constant-time comparison
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || sigBuffer.length === 0) {
    return { valid: false };
  }

  const match = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  return match ? { valid: true, tableNumber } : { valid: false };
}
