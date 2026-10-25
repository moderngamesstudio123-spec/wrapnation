import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/db';
import { updateUpiSettings, getSettings } from '@/server/services/settingService';
import { User } from '@prisma/client';

describe('Security: Shop UPI Settings Protection (Owner + Re-auth)', () => {
  let ownerUser: User;
  let staffUser: User;

  beforeAll(async () => {
    ownerUser = await prisma.user.findFirstOrThrow({
      where: { email: 'owner@wrapnation.com' },
    });
    staffUser = await prisma.user.findFirstOrThrow({
      where: { email: 'staff@wrapnation.com' },
    });
  });

  it('rejects STAFF attempting to change shop UPI settings', async () => {
    const result = await updateUpiSettings(
      {
        upiId: 'attacker@okaxis',
        payeeName: 'Attacker Account',
        currentPassword: 'Staff@123456',
      },
      staffUser.id
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Only the store OWNER can modify/);
  });

  it('rejects OWNER when incorrect password is provided', async () => {
    const result = await updateUpiSettings(
      {
        upiId: 'attacker@okaxis',
        payeeName: 'Attacker Account',
        currentPassword: 'WrongPassword@999',
      },
      ownerUser.id
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Owner password verification failed/);
  });

  it('allows OWNER to successfully update UPI ID when correct password is provided', async () => {
    const newUpiId = 'wrapnation.official@okaxis';
    const newPayee = 'Wrap Nation Official Store';

    const result = await updateUpiSettings(
      {
        upiId: newUpiId,
        payeeName: newPayee,
        currentPassword: 'Owner@123456',
      },
      ownerUser.id
    );

    expect(result.success).toBe(true);

    const updated = await getSettings();
    expect(updated.upiId).toBe(newUpiId);
    expect(updated.payeeName).toBe(newPayee);
  });
});
