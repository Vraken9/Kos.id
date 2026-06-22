import { randomBytes } from 'crypto';

/**
 * Generate a booking code in format: KOS-YYYYMMDD-XXXXXX
 * XXXXXX = random uppercase alphanumeric
 */
export function generateBookingCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    suffix += chars[bytes[i] % chars.length];
  }

  return `KOS-${dateStr}-${suffix}`;
}

/**
 * Generate a random access token for booking (32 bytes, hex encoded)
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString('hex');
}
