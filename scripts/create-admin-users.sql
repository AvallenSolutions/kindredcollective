-- Run this SQL in Supabase SQL Editor AFTER creating auth users in Authentication > Users
--
-- First, create these users in Authentication > Users > Add User:
--   1. jack@theduppyshare.com (password: duppyshare123) - Auto confirm: YES
--   2. tim@avallen.solutions (password: RonZacapa23) - Auto confirm: YES
--
-- Then run this SQL:

-- Clean up any existing records for these users
DELETE FROM "Member" WHERE "userId" IN (
  SELECT id FROM auth.users WHERE email IN ('jack@theduppyshare.com', 'tim@avallen.solutions')
);

DELETE FROM "User" WHERE email IN ('jack@theduppyshare.com', 'tim@avallen.solutions');

-- Create User records with ADMIN role for Jack
INSERT INTO "User" (id, email, role, "emailVerified", "createdAt", "updatedAt")
SELECT
  id,
  email,
  'ADMIN'::"UserRole",
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'jack@theduppyshare.com'
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN'::"UserRole", "updatedAt" = NOW();

-- Create User records with ADMIN role for Tim
INSERT INTO "User" (id, email, role, "emailVerified", "createdAt", "updatedAt")
SELECT
  id,
  email,
  'ADMIN'::"UserRole",
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'tim@avallen.solutions'
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN'::"UserRole", "updatedAt" = NOW();

-- Create Member profile for Jack
INSERT INTO "Member" (id, "userId", "firstName", "lastName", "isPublic", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  id,
  'Jack',
  'Admin',
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'jack@theduppyshare.com'
ON CONFLICT ("userId") DO NOTHING;

-- Create Member profile for Tim
INSERT INTO "Member" (id, "userId", "firstName", "lastName", "isPublic", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  id,
  'Tim',
  'Admin',
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'tim@avallen.solutions'
ON CONFLICT ("userId") DO NOTHING;

-- Verify the admin users were created
SELECT u.id, u.email, u.role, m."firstName", m."lastName"
FROM "User" u
LEFT JOIN "Member" m ON m."userId" = u.id
WHERE u.role = 'ADMIN';
