-- Kindred Collective - Row Level Security Policies
-- Run this in Supabase SQL Editor AFTER creating the schema
-- This implements role-based access control for Admin, Brand (User), and Supplier roles

-- =============================================
-- HELPER: Create a function to get the current user's role
-- =============================================

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM "User" WHERE id = auth.uid()::text
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT auth.uid()::text
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================
-- USER TABLE POLICIES
-- =============================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access to users" ON "User";
CREATE POLICY "Admin full access to users" ON "User"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Users can read and update their own record
DROP POLICY IF EXISTS "Users can view own record" ON "User";
CREATE POLICY "Users can view own record" ON "User"
  FOR SELECT
  TO authenticated
  USING (id = auth.user_id());

DROP POLICY IF EXISTS "Users can update own record" ON "User";
CREATE POLICY "Users can update own record" ON "User"
  FOR UPDATE
  TO authenticated
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- =============================================
-- SUPPLIER TABLE POLICIES
-- =============================================

ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;

-- Anyone can read public suppliers
DROP POLICY IF EXISTS "Public read access to suppliers" ON "Supplier";
CREATE POLICY "Public read access to suppliers" ON "Supplier"
  FOR SELECT
  TO anon, authenticated
  USING ("isPublic" = true);

-- Admin can do everything with suppliers
DROP POLICY IF EXISTS "Admin full access to suppliers" ON "Supplier";
CREATE POLICY "Admin full access to suppliers" ON "Supplier"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Suppliers can manage their own profile
DROP POLICY IF EXISTS "Suppliers can view own profile" ON "Supplier";
CREATE POLICY "Suppliers can view own profile" ON "Supplier"
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Suppliers can update own profile" ON "Supplier";
CREATE POLICY "Suppliers can update own profile" ON "Supplier"
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.user_id() AND auth.user_role() = 'SUPPLIER')
  WITH CHECK ("userId" = auth.user_id() AND auth.user_role() = 'SUPPLIER');

DROP POLICY IF EXISTS "Suppliers can insert own profile" ON "Supplier";
CREATE POLICY "Suppliers can insert own profile" ON "Supplier"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'SUPPLIER' AND "userId" = auth.user_id());

DROP POLICY IF EXISTS "Suppliers can delete own profile" ON "Supplier";
CREATE POLICY "Suppliers can delete own profile" ON "Supplier"
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.user_id() AND auth.user_role() = 'SUPPLIER');

-- =============================================
-- BRAND TABLE POLICIES
-- =============================================

ALTER TABLE "Brand" ENABLE ROW LEVEL SECURITY;

-- Anyone can read public brands
DROP POLICY IF EXISTS "Public read access to brands" ON "Brand";
CREATE POLICY "Public read access to brands" ON "Brand"
  FOR SELECT
  TO anon, authenticated
  USING ("isPublic" = true);

-- Admin can do everything with brands
DROP POLICY IF EXISTS "Admin full access to brands" ON "Brand";
CREATE POLICY "Admin full access to brands" ON "Brand"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Brand users can manage their own profile
DROP POLICY IF EXISTS "Brands can view own profile" ON "Brand";
CREATE POLICY "Brands can view own profile" ON "Brand"
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Brands can update own profile" ON "Brand";
CREATE POLICY "Brands can update own profile" ON "Brand"
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.user_id() AND auth.user_role() = 'BRAND')
  WITH CHECK ("userId" = auth.user_id() AND auth.user_role() = 'BRAND');

DROP POLICY IF EXISTS "Brands can insert own profile" ON "Brand";
CREATE POLICY "Brands can insert own profile" ON "Brand"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'BRAND' AND "userId" = auth.user_id());

DROP POLICY IF EXISTS "Brands can delete own profile" ON "Brand";
CREATE POLICY "Brands can delete own profile" ON "Brand"
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.user_id() AND auth.user_role() = 'BRAND');

-- =============================================
-- OFFER TABLE POLICIES
-- =============================================

ALTER TABLE "Offer" ENABLE ROW LEVEL SECURITY;

-- Anyone can read active offers
DROP POLICY IF EXISTS "Public read access to offers" ON "Offer";
CREATE POLICY "Public read access to offers" ON "Offer"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ACTIVE');

-- Admin can do everything with offers
DROP POLICY IF EXISTS "Admin full access to offers" ON "Offer";
CREATE POLICY "Admin full access to offers" ON "Offer"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Suppliers can manage their own offers
DROP POLICY IF EXISTS "Suppliers can view own offers" ON "Offer";
CREATE POLICY "Suppliers can view own offers" ON "Offer"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "Offer"."supplierId"
      AND s."userId" = auth.user_id()
    )
  );

DROP POLICY IF EXISTS "Suppliers can insert offers" ON "Offer";
CREATE POLICY "Suppliers can insert offers" ON "Offer"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.user_role() = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "supplierId"
      AND s."userId" = auth.user_id()
    )
  );

DROP POLICY IF EXISTS "Suppliers can update own offers" ON "Offer";
CREATE POLICY "Suppliers can update own offers" ON "Offer"
  FOR UPDATE
  TO authenticated
  USING (
    auth.user_role() = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "Offer"."supplierId"
      AND s."userId" = auth.user_id()
    )
  )
  WITH CHECK (
    auth.user_role() = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "Offer"."supplierId"
      AND s."userId" = auth.user_id()
    )
  );

DROP POLICY IF EXISTS "Suppliers can delete own offers" ON "Offer";
CREATE POLICY "Suppliers can delete own offers" ON "Offer"
  FOR DELETE
  TO authenticated
  USING (
    auth.user_role() = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "Offer"."supplierId"
      AND s."userId" = auth.user_id()
    )
  );

-- =============================================
-- EVENT TABLE POLICIES
-- =============================================

ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

-- Anyone can read published events
DROP POLICY IF EXISTS "Public read access to events" ON "Event";
CREATE POLICY "Public read access to events" ON "Event"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');

-- Admin can do everything with events
DROP POLICY IF EXISTS "Admin full access to events" ON "Event";
CREATE POLICY "Admin full access to events" ON "Event"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Brand users can manage their own events
DROP POLICY IF EXISTS "Users can view own events" ON "Event";
CREATE POLICY "Users can view own events" ON "Event"
  FOR SELECT
  TO authenticated
  USING ("createdById" = auth.user_id());

DROP POLICY IF EXISTS "Users can insert events" ON "Event";
CREATE POLICY "Users can insert events" ON "Event"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.user_role() IN ('BRAND', 'ADMIN') AND
    "createdById" = auth.user_id()
  );

DROP POLICY IF EXISTS "Users can update own events" ON "Event";
CREATE POLICY "Users can update own events" ON "Event"
  FOR UPDATE
  TO authenticated
  USING ("createdById" = auth.user_id())
  WITH CHECK ("createdById" = auth.user_id());

DROP POLICY IF EXISTS "Users can delete own events" ON "Event";
CREATE POLICY "Users can delete own events" ON "Event"
  FOR DELETE
  TO authenticated
  USING ("createdById" = auth.user_id());

-- =============================================
-- MEMBER TABLE POLICIES
-- =============================================

ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;

-- Anyone can read public members
DROP POLICY IF EXISTS "Public read access to members" ON "Member";
CREATE POLICY "Public read access to members" ON "Member"
  FOR SELECT
  TO anon, authenticated
  USING ("isPublic" = true);

-- Admin can do everything with members
DROP POLICY IF EXISTS "Admin full access to members" ON "Member";
CREATE POLICY "Admin full access to members" ON "Member"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Users can manage their own member profile
DROP POLICY IF EXISTS "Users can view own member profile" ON "Member";
CREATE POLICY "Users can view own member profile" ON "Member"
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can update own member profile" ON "Member";
CREATE POLICY "Users can update own member profile" ON "Member"
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can insert own member profile" ON "Member";
CREATE POLICY "Users can insert own member profile" ON "Member"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can delete own member profile" ON "Member";
CREATE POLICY "Users can delete own member profile" ON "Member"
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.user_id());

-- =============================================
-- SUPPLIER REVIEW POLICIES
-- =============================================

ALTER TABLE "SupplierReview" ENABLE ROW LEVEL SECURITY;

-- Anyone can read public reviews
DROP POLICY IF EXISTS "Public read access to reviews" ON "SupplierReview";
CREATE POLICY "Public read access to reviews" ON "SupplierReview"
  FOR SELECT
  TO anon, authenticated
  USING ("isPublic" = true);

-- Admin can do everything with reviews
DROP POLICY IF EXISTS "Admin full access to reviews" ON "SupplierReview";
CREATE POLICY "Admin full access to reviews" ON "SupplierReview"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Users can manage their own reviews
DROP POLICY IF EXISTS "Users can insert reviews" ON "SupplierReview";
CREATE POLICY "Users can insert reviews" ON "SupplierReview"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can update own reviews" ON "SupplierReview";
CREATE POLICY "Users can update own reviews" ON "SupplierReview"
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can delete own reviews" ON "SupplierReview";
CREATE POLICY "Users can delete own reviews" ON "SupplierReview"
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.user_id());

-- =============================================
-- EVENT RSVP POLICIES
-- =============================================

ALTER TABLE "EventRsvp" ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access to rsvps" ON "EventRsvp";
CREATE POLICY "Admin full access to rsvps" ON "EventRsvp"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Users can manage their own RSVPs
DROP POLICY IF EXISTS "Users can view own rsvps" ON "EventRsvp";
CREATE POLICY "Users can view own rsvps" ON "EventRsvp"
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can insert rsvps" ON "EventRsvp";
CREATE POLICY "Users can insert rsvps" ON "EventRsvp"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can update own rsvps" ON "EventRsvp";
CREATE POLICY "Users can update own rsvps" ON "EventRsvp"
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

DROP POLICY IF EXISTS "Users can delete own rsvps" ON "EventRsvp";
CREATE POLICY "Users can delete own rsvps" ON "EventRsvp"
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.user_id());

-- Event creators can view RSVPs for their events
DROP POLICY IF EXISTS "Event creators can view rsvps" ON "EventRsvp";
CREATE POLICY "Event creators can view rsvps" ON "EventRsvp"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Event" e
      WHERE e.id = "EventRsvp"."eventId"
      AND e."createdById" = auth.user_id()
    )
  );

-- =============================================
-- SAVED SUPPLIER/BRAND POLICIES
-- =============================================

ALTER TABLE "SavedSupplier" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved suppliers" ON "SavedSupplier";
CREATE POLICY "Users manage own saved suppliers" ON "SavedSupplier"
  FOR ALL
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

ALTER TABLE "SavedBrand" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved brands" ON "SavedBrand";
CREATE POLICY "Users manage own saved brands" ON "SavedBrand"
  FOR ALL
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- =============================================
-- OFFER CLAIM POLICIES
-- =============================================

ALTER TABLE "OfferClaim" ENABLE ROW LEVEL SECURITY;

-- Admin can see all claims
DROP POLICY IF EXISTS "Admin full access to claims" ON "OfferClaim";
CREATE POLICY "Admin full access to claims" ON "OfferClaim"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Users can manage their own claims
DROP POLICY IF EXISTS "Users manage own claims" ON "OfferClaim";
CREATE POLICY "Users manage own claims" ON "OfferClaim"
  FOR ALL
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- Suppliers can view claims on their offers
DROP POLICY IF EXISTS "Suppliers view claims on own offers" ON "OfferClaim";
CREATE POLICY "Suppliers view claims on own offers" ON "OfferClaim"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Offer" o
      JOIN "Supplier" s ON s.id = o."supplierId"
      WHERE o.id = "OfferClaim"."offerId"
      AND s."userId" = auth.user_id()
    )
  );

-- =============================================
-- SUPPLIER CLAIM POLICIES
-- =============================================

ALTER TABLE "SupplierClaim" ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access to supplier claims" ON "SupplierClaim";
CREATE POLICY "Admin full access to supplier claims" ON "SupplierClaim"
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- Users can manage their own claims
DROP POLICY IF EXISTS "Users manage own supplier claims" ON "SupplierClaim";
CREATE POLICY "Users manage own supplier claims" ON "SupplierClaim"
  FOR ALL
  TO authenticated
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- =============================================
-- IMAGE TABLE POLICIES
-- =============================================

ALTER TABLE "BrandImage" ENABLE ROW LEVEL SECURITY;

-- Public read for brand images
DROP POLICY IF EXISTS "Public read brand images" ON "BrandImage";
CREATE POLICY "Public read brand images" ON "BrandImage"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Brand" b
      WHERE b.id = "BrandImage"."brandId"
      AND b."isPublic" = true
    )
  );

-- Brand owners can manage their images
DROP POLICY IF EXISTS "Brands manage own images" ON "BrandImage";
CREATE POLICY "Brands manage own images" ON "BrandImage"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Brand" b
      WHERE b.id = "BrandImage"."brandId"
      AND b."userId" = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Brand" b
      WHERE b.id = "BrandImage"."brandId"
      AND b."userId" = auth.user_id()
    )
  );

ALTER TABLE "SupplierImage" ENABLE ROW LEVEL SECURITY;

-- Public read for supplier images
DROP POLICY IF EXISTS "Public read supplier images" ON "SupplierImage";
CREATE POLICY "Public read supplier images" ON "SupplierImage"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "SupplierImage"."supplierId"
      AND s."isPublic" = true
    )
  );

-- Supplier owners can manage their images
DROP POLICY IF EXISTS "Suppliers manage own images" ON "SupplierImage";
CREATE POLICY "Suppliers manage own images" ON "SupplierImage"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "SupplierImage"."supplierId"
      AND s."userId" = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Supplier" s
      WHERE s.id = "SupplierImage"."supplierId"
      AND s."userId" = auth.user_id()
    )
  );

-- =============================================
-- NEWS TABLES (Public read, Admin write)
-- =============================================

ALTER TABLE "NewsSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsArticle" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read news sources" ON "NewsSource";
CREATE POLICY "Public read news sources" ON "NewsSource"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage news sources" ON "NewsSource";
CREATE POLICY "Admin manage news sources" ON "NewsSource"
  FOR ALL TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Public read news articles" ON "NewsArticle";
CREATE POLICY "Public read news articles" ON "NewsArticle"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage news articles" ON "NewsArticle";
CREATE POLICY "Admin manage news articles" ON "NewsArticle"
  FOR ALL TO authenticated
  USING (auth.user_role() = 'ADMIN')
  WITH CHECK (auth.user_role() = 'ADMIN');

-- =============================================
-- SEARCH QUERY TABLE (Insert only for tracking)
-- =============================================

ALTER TABLE "SearchQuery" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert search queries" ON "SearchQuery";
CREATE POLICY "Anyone can insert search queries" ON "SearchQuery"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read search queries" ON "SearchQuery";
CREATE POLICY "Admin read search queries" ON "SearchQuery"
  FOR SELECT TO authenticated
  USING (auth.user_role() = 'ADMIN');

-- =============================================
-- VERIFICATION: List all policies
-- =============================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
