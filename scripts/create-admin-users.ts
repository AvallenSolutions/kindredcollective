import { createClient } from '@supabase/supabase-js'

// This script creates admin users for testing
// Run with: npx tsx scripts/create-admin-users.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const adminUsers = [
  {
    email: 'jack@theduppyshare.com',
    password: 'duppyshare123',
    firstName: 'Jack',
    lastName: 'Admin',
  },
  {
    email: 'tim@avallen.solutions',
    password: 'RonZacapa23',
    firstName: 'Tim',
    lastName: 'Admin',
  },
]

async function createAdminUsers() {
  for (const user of adminUsers) {
    console.log(`Creating admin user: ${user.email}...`)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  User ${user.email} already exists in auth, checking database...`)

        // Get the existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === user.email)

        if (existingUser) {
          // Check if User record exists
          const { data: dbUser } = await supabase
            .from('User')
            .select('id, role')
            .eq('id', existingUser.id)
            .single()

          if (dbUser) {
            if (dbUser.role !== 'ADMIN') {
              // Update to admin
              await supabase
                .from('User')
                .update({ role: 'ADMIN' })
                .eq('id', existingUser.id)
              console.log(`  Updated ${user.email} to ADMIN role`)
            } else {
              console.log(`  ${user.email} is already an ADMIN`)
            }
          } else {
            // Create User record
            await supabase.from('User').insert({
              id: existingUser.id,
              email: user.email,
              role: 'ADMIN',
              emailVerified: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            console.log(`  Created User record for ${user.email}`)
          }

          // Check/create Member profile
          const { data: member } = await supabase
            .from('Member')
            .select('id')
            .eq('userId', existingUser.id)
            .single()

          if (!member) {
            await supabase.from('Member').insert({
              id: crypto.randomUUID(),
              userId: existingUser.id,
              firstName: user.firstName,
              lastName: user.lastName,
              isPublic: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            console.log(`  Created Member profile for ${user.email}`)
          }
        }
        continue
      }
      console.error(`  Error creating auth user: ${authError.message}`)
      continue
    }

    const userId = authData.user.id
    console.log(`  Created auth user with ID: ${userId}`)

    // Create User record in database
    const { error: userError } = await supabase.from('User').insert({
      id: userId,
      email: user.email,
      role: 'ADMIN',
      emailVerified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (userError) {
      console.error(`  Error creating User record: ${userError.message}`)
    } else {
      console.log(`  Created User record with ADMIN role`)
    }

    // Create Member profile
    const { error: memberError } = await supabase.from('Member').insert({
      id: crypto.randomUUID(),
      userId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (memberError) {
      console.error(`  Error creating Member profile: ${memberError.message}`)
    } else {
      console.log(`  Created Member profile`)
    }

    console.log(`  ✓ Admin user ${user.email} created successfully!`)
  }

  console.log('\nDone! Admin users created.')
}

createAdminUsers().catch(console.error)
