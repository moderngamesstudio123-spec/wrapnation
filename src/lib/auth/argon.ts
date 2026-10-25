import { hash, verify, type Options } from '@node-rs/argon2';

const ARGON2_OPTIONS: Options = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
  outputLen: 32,
};

/**
 * Hashes a plaintext password using Argon2id with production security parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
  try {
    return await verify(hashString, password, ARGON2_OPTIONS);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
