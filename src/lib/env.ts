/**
 * Environment variable validation.
 *
 * Validates that all required environment variables are set at import
 * time so the app fails fast with a clear error message rather than
 * crashing at runtime when a variable is first accessed.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Check your .env file or deployment configuration.`
    )
  }
  return value
}

function optionalEnv(name: string, defaultValue = ''): string {
  return process.env[name] || defaultValue
}

export const env = {
  // Required - Supabase
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Required - Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Optional - OAuth
  GOOGLE_CLIENT_ID: optionalEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optionalEnv('GOOGLE_CLIENT_SECRET'),
  LINKEDIN_CLIENT_ID: optionalEnv('LINKEDIN_CLIENT_ID'),
  LINKEDIN_CLIENT_SECRET: optionalEnv('LINKEDIN_CLIENT_SECRET'),

  // Optional - AI Search
  ANTHROPIC_API_KEY: optionalEnv('ANTHROPIC_API_KEY'),

  // Optional - Email
  RESEND_API_KEY: optionalEnv('RESEND_API_KEY'),

  // Optional - App URL
  NEXT_PUBLIC_APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
} as const
