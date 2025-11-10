/**
 * Password Utilities
 * 
 * Bcrypt hashing and comparison for passwords.
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate random 8-digit numeric password
 */
export function generateNumericPassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
