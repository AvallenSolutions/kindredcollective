import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure random token.
 *
 * Uses base64url encoding for URL-safe tokens that are compact
 * and don't require additional encoding in URLs or query params.
 *
 * @param byteLength - Number of random bytes (default: 32, producing ~43 chars)
 */
export function generateSecureToken(byteLength: number = 32): string {
  return randomBytes(byteLength).toString('base64url')
}
