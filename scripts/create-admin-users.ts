import { createClient } from '@supabase/supabase-js'

// Run with: npx tsx scripts/create-admin-users.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'paste-your-service-role-key-here') {
  console.error('\n❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role\n')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const adminUsers = [
  { email: 'jack@theduppyshare.com', password: 'duppyshare123', name: 'Jack' },
  { email: 'tim@avallen.solutions', password: 'RonZacapa23', name: 'Tim' },
]

async function main() {
  console.log('\n🚀 Creating admin users...\n')

  for (const user of adminUsers) {
    console.log(`Processing ${user.email}...`)

    // Delete existing auth user if exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === user.email)

    if (existing) {
      console.log(`  Deleting existing auth user...`)

      // Delete database records first
      await supabase.from('Member').delete().eq('userId', existing.id)
      await supabase.from('User').delete().eq('id', existing.id)

      // Delete auth user
      await supabase.auth.admin.deleteUser(existing.id)
    }

    // Create fresh auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (error) {
      console.error(`  ❌ Failed: ${error.message}`)
      continue
    }

    console.log(`  ✓ Auth user created: ${data.user.id}`)

    // Create User record
    const { error: userError } = await supabase.from('User').insert({
      id: data.user.id,
      email: user.email,
      role: 'ADMIN',
      emailVerified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (userError) {
      console.error(`  ❌ User record failed: ${userError.message}`)
    } else {
      console.log(`  ✓ User record created with ADMIN role`)
    }

    // Create Member profile
    const { error: memberError } = await supabase.from('Member').insert({
      id: crypto.randomUUID(),
      userId: data.user.id,
      firstName: user.name,
      lastName: 'Admin',
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (memberError) {
      console.error(`  ❌ Member profile failed: ${memberError.message}`)
    } else {
      console.log(`  ✓ Member profile created`)
    }

    console.log(`  ✅ ${user.email} ready!\n`)
  }

  console.log('Done! Try logging in now.\n')
}

main().catch(console.error)
