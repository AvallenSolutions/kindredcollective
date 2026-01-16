-- Enable public read access to Supplier table
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled (it is by default in Supabase)
-- If you want to disable RLS entirely for the Supplier table:
-- ALTER TABLE "Supplier" DISABLE ROW LEVEL SECURITY;

-- OR, better approach: Add a policy to allow public read access
-- This keeps RLS enabled but allows anonymous users to read suppliers

-- Drop existing policy if it exists (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow public read access to suppliers" ON "Supplier";

-- Create policy to allow anyone to read public suppliers
CREATE POLICY "Allow public read access to suppliers"
ON "Supplier"
FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

-- Also add policies for other tables that need public read access

-- Events
DROP POLICY IF EXISTS "Allow public read access to events" ON "Event";
CREATE POLICY "Allow public read access to events"
ON "Event"
FOR SELECT
TO anon, authenticated
USING (status = 'PUBLISHED');

-- Offers
DROP POLICY IF EXISTS "Allow public read access to offers" ON "Offer";
CREATE POLICY "Allow public read access to offers"
ON "Offer"
FOR SELECT
TO anon, authenticated
USING (status = 'ACTIVE');

-- Brands (public profiles)
DROP POLICY IF EXISTS "Allow public read access to brands" ON "Brand";
CREATE POLICY "Allow public read access to brands"
ON "Brand"
FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

-- Members (public profiles)
DROP POLICY IF EXISTS "Allow public read access to members" ON "Member";
CREATE POLICY "Allow public read access to members"
ON "Member"
FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

-- Supplier Reviews (public)
DROP POLICY IF EXISTS "Allow public read access to reviews" ON "SupplierReview";
CREATE POLICY "Allow public read access to reviews"
ON "SupplierReview"
FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('Supplier', 'Event', 'Offer', 'Brand', 'Member', 'SupplierReview');
