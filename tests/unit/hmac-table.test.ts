import { describe, it, expect } from 'vitest';
import { signTableToken, verifyTableToken } from '@/lib/security/hmac';

describe('Security: HMAC Table Token Signature Validation', () => {
  it('successfully verifies genuine signed table token', () => {
    const token = signTableToken(5);
    const result = verifyTableToken(token);

    expect(result.valid).toBe(true);
    expect(result.tableNumber).toBe(5);
  });

  it('rejects tampered table numbers', () => {
    // Generate valid token for table 1
    const tokenTable1 = signTableToken(1);
    const [, signature] = tokenTable1.split('.');

    // Attacker modifies table number to table 5 while preserving signature
    const spoofedToken = `5.${signature}`;
    const result = verifyTableToken(spoofedToken);

    expect(result.valid).toBe(false);
    expect(result.tableNumber).toBeUndefined();
  });

  it('rejects corrupt signatures', () => {
    const token = signTableToken(3);
    const [tableNum, sig] = token.split('.');
    const corruptedSig = sig.slice(0, -2) + 'aa';

    const result = verifyTableToken(`${tableNum}.${corruptedSig}`);
    expect(result.valid).toBe(false);
  });

  it('rejects malformed tokens', () => {
    expect(verifyTableToken('')).toEqual({ valid: false });
    expect(verifyTableToken('not-a-token')).toEqual({ valid: false });
    expect(verifyTableToken('abc.def')).toEqual({ valid: false });
    expect(verifyTableToken('-1.validhex')).toEqual({ valid: false });
  });
});
