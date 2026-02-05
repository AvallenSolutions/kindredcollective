/**
 * Sanitize user input for use in Supabase PostgREST filter strings.
 *
 * PostgREST uses commas, periods, and parentheses as syntax delimiters
 * in filter expressions like `.or()` and `.ilike()`. User input
 * interpolated into these expressions must be stripped of these
 * characters to prevent query manipulation.
 */
export function sanitizeFilterInput(input: string): string {
  return input
    .replace(/[,.()"'\\]/g, '') // Strip PostgREST filter syntax characters
    .replace(/%/g, '')          // Strip SQL LIKE wildcard
    .replace(/_/g, '\\_')       // Escape SQL single-char wildcard
    .trim()
    .slice(0, 200)              // Limit length to prevent abuse
}
