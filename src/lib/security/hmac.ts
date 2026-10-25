import crypto from 'crypto';

function getSecret(secret?: string): string {
  return secret || process.env.HMAC_SECRET || 'wrap_nation_table_hmac_secret_key_must_be_random_and_secure!';
}

/**
 * Generates an HMAC-SHA256 signature for a table number.
 * Resulting token format: `${tableNumber}.${signatureHex}`
 */
export function signTableToken(tableNumber: number, customSecret?: string): string {
  if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
    throw new Error('Table number must be a positive integer');
  }

  const secret = getSecret(customSecret);
  const data = `table:${tableNumber}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  return `${tableNumber}.${signature}`;
}

/**
 * Validates an HMAC-signed table token.
 * Uses constant-time buffer comparison to prevent timing attacks.
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
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`table:${tableNumber}`)
    .digest('hex');

  // Constant-time comparison
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false };
  }

  const match = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  return match ? { valid: true, tableNumber } : { valid: false };
}
