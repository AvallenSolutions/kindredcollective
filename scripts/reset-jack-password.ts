import { createClient } from '@supabase/supabase-js'

// Run with: npx tsx scripts/reset-jack-password.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase credentials in environment')
  console.error('   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local\n')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TARGET_EMAIL = 'jack@theduppyshare.com'
const NEW_PASSWORD = 'DuppyShare123'

async function main() {
  console.log(`\n🔑 Resetting password for ${TARGET_EMAIL}...\n`)

  // Find the user
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error(`❌ Failed to list users: ${listError.message}`)
    process.exit(1)
  }

  const user = listData?.users?.find(u => u.email === TARGET_EMAIL)

  if (!user) {
    console.error(`❌ User ${TARGET_EMAIL} not found in Supabase Auth`)
    process.exit(1)
  }

  console.log(`  Found user: ${user.id}`)

  // Update the password
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD,
  })

  if (updateError) {
    console.error(`❌ Failed to update password: ${updateError.message}`)
    process.exit(1)
  }

  console.log(`  ✅ Password for ${TARGET_EMAIL} has been reset successfully!\n`)
}

main().catch(console.error)
