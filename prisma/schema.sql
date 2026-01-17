-- ============================================
-- KINDRED COLLECTIVE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============= ENUMS =============

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('BRAND', 'SUPPLIER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DrinkCategory" AS ENUM ('SPIRITS', 'BEER', 'WINE', 'RTD', 'NO_LO', 'CIDER', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupplierCategory" AS ENUM ('PACKAGING', 'INGREDIENTS', 'LOGISTICS', 'CO_PACKING', 'DESIGN', 'MARKETING', 'EQUIPMENT', 'CONSULTING', 'LEGAL', 'FINANCE', 'DISTRIBUTION', 'RECRUITMENT', 'SOFTWARE', 'SUSTAINABILITY', 'PR', 'PHOTOGRAPHY', 'WEB_DEVELOPMENT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Certification" AS ENUM ('ORGANIC', 'B_CORP', 'FAIRTRADE', 'VEGAN', 'GLUTEN_FREE', 'PLASTIC_FREE', 'CARBON_NEUTRAL', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM ('TRADE_SHOW', 'MEETUP', 'WORKSHOP', 'WEBINAR', 'NETWORKING', 'LAUNCH', 'PARTY', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OfferType" AS ENUM ('PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_TRIAL', 'BUNDLE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'PAUSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'INTERESTED', 'NOT_GOING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'CLAIMED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============= TABLES =============

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Member table
CREATE TABLE IF NOT EXISTS "Member" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "jobTitle" TEXT,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "linkedinUrl" TEXT,
  "phone" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- Brand table
CREATE TABLE IF NOT EXISTS "Brand" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT,
  "story" TEXT,
  "logoUrl" TEXT,
  "heroImageUrl" TEXT,
  "websiteUrl" TEXT,
  "instagramUrl" TEXT,
  "linkedinUrl" TEXT,
  "twitterUrl" TEXT,
  "category" "DrinkCategory" NOT NULL,
  "subcategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "yearFounded" INTEGER,
  "location" TEXT,
  "country" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- BrandImage table
CREATE TABLE IF NOT EXISTS "BrandImage" (
  "id" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BrandImage_pkey" PRIMARY KEY ("id")
);

-- Supplier table
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "companyName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT,
  "logoUrl" TEXT,
  "heroImageUrl" TEXT,
  "websiteUrl" TEXT,
  "linkedinUrl" TEXT,
  "instagramUrl" TEXT,
  "portfolioUrl" TEXT,
  "category" "SupplierCategory" NOT NULL,
  "subcategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "certifications" "Certification"[] DEFAULT ARRAY[]::"Certification"[],
  "moqMin" INTEGER,
  "moqMax" INTEGER,
  "leadTimeDays" INTEGER,
  "location" TEXT,
  "country" TEXT,
  "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'UNCLAIMED',
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- SupplierImage table
CREATE TABLE IF NOT EXISTS "SupplierImage" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierImage_pkey" PRIMARY KEY ("id")
);

-- SupplierReview table
CREATE TABLE IF NOT EXISTS "SupplierReview" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "brandId" TEXT,
  "userId" TEXT,
  "reviewerName" TEXT NOT NULL,
  "reviewerCompany" TEXT,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "content" TEXT NOT NULL,
  "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
  "serviceRating" INTEGER,
  "valueRating" INTEGER,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierReview_pkey" PRIMARY KEY ("id")
);

-- SupplierClaim table
CREATE TABLE IF NOT EXISTS "SupplierClaim" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
  "companyEmail" TEXT NOT NULL,
  "verificationCode" TEXT,
  "notes" TEXT,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierClaim_pkey" PRIMARY KEY ("id")
);

-- Offer table
CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "OfferType" NOT NULL,
  "discountValue" DECIMAL(65,30),
  "code" TEXT,
  "termsConditions" TEXT,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "forBrandsOnly" BOOLEAN NOT NULL DEFAULT false,
  "minOrderValue" DECIMAL(65,30),
  "imageUrl" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "claimCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- OfferClaim table
CREATE TABLE IF NOT EXISTS "OfferClaim" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OfferClaim_pkey" PRIMARY KEY ("id")
);

-- Event table
CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "type" "EventType" NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
  "isVirtual" BOOLEAN NOT NULL DEFAULT false,
  "venueName" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "virtualUrl" TEXT,
  "imageUrl" TEXT,
  "capacity" INTEGER,
  "isFree" BOOLEAN NOT NULL DEFAULT true,
  "price" DECIMAL(65,30),
  "registrationUrl" TEXT,
  "showAttendees" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,

  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- EventRsvp table
CREATE TABLE IF NOT EXISTS "EventRsvp" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "RsvpStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- SavedSupplier table
CREATE TABLE IF NOT EXISTS "SavedSupplier" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedSupplier_pkey" PRIMARY KEY ("id")
);

-- SavedBrand table
CREATE TABLE IF NOT EXISTS "SavedBrand" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedBrand_pkey" PRIMARY KEY ("id")
);

-- NewsSource table
CREATE TABLE IF NOT EXISTS "NewsSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "feedUrl" TEXT NOT NULL,
  "siteUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- NewsArticle table
CREATE TABLE IF NOT EXISTS "NewsArticle" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- SearchQuery table
CREATE TABLE IF NOT EXISTS "SearchQuery" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "userId" TEXT,
  "resultCount" INTEGER NOT NULL,
  "processingMs" INTEGER NOT NULL,
  "usedAI" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- Organisation table
CREATE TABLE IF NOT EXISTS "Organisation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "brandId" TEXT,
  "supplierId" TEXT,

  CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- OrganisationMember table
CREATE TABLE IF NOT EXISTS "OrganisationMember" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isOwner" BOOLEAN NOT NULL DEFAULT false,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrganisationMember_pkey" PRIMARY KEY ("id")
);

-- OrganisationInvite table
CREATE TABLE IF NOT EXISTS "OrganisationInvite" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,

  CONSTRAINT "OrganisationInvite_pkey" PRIMARY KEY ("id")
);

-- WorkRelationship table
CREATE TABLE IF NOT EXISTS "WorkRelationship" (
  "id" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "brandVerified" BOOLEAN NOT NULL DEFAULT false,
  "supplierVerified" BOOLEAN NOT NULL DEFAULT false,
  "projectDate" TIMESTAMP(3),
  "projectDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkRelationship_pkey" PRIMARY KEY ("id")
);

-- ============= UNIQUE CONSTRAINTS =============

ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email") ON CONFLICT DO NOTHING;
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_key" UNIQUE ("userId") ON CONFLICT DO NOTHING;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_userId_key" UNIQUE ("userId") ON CONFLICT DO NOTHING;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_slug_key" UNIQUE ("slug") ON CONFLICT DO NOTHING;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_userId_key" UNIQUE ("userId") ON CONFLICT DO NOTHING;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_slug_key" UNIQUE ("slug") ON CONFLICT DO NOTHING;
ALTER TABLE "SupplierClaim" ADD CONSTRAINT "SupplierClaim_supplierId_userId_key" UNIQUE ("supplierId", "userId") ON CONFLICT DO NOTHING;
ALTER TABLE "OfferClaim" ADD CONSTRAINT "OfferClaim_offerId_userId_key" UNIQUE ("offerId", "userId") ON CONFLICT DO NOTHING;
ALTER TABLE "Event" ADD CONSTRAINT "Event_slug_key" UNIQUE ("slug") ON CONFLICT DO NOTHING;
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_userId_key" UNIQUE ("eventId", "userId") ON CONFLICT DO NOTHING;
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_userId_supplierId_key" UNIQUE ("userId", "supplierId") ON CONFLICT DO NOTHING;
ALTER TABLE "SavedBrand" ADD CONSTRAINT "SavedBrand_userId_brandId_key" UNIQUE ("userId", "brandId") ON CONFLICT DO NOTHING;
ALTER TABLE "NewsSource" ADD CONSTRAINT "NewsSource_feedUrl_key" UNIQUE ("feedUrl") ON CONFLICT DO NOTHING;
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_url_key" UNIQUE ("url") ON CONFLICT DO NOTHING;
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_slug_key" UNIQUE ("slug") ON CONFLICT DO NOTHING;
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_brandId_key" UNIQUE ("brandId") ON CONFLICT DO NOTHING;
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_supplierId_key" UNIQUE ("supplierId") ON CONFLICT DO NOTHING;
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_userId_key" UNIQUE ("organisationId", "userId") ON CONFLICT DO NOTHING;
ALTER TABLE "OrganisationInvite" ADD CONSTRAINT "OrganisationInvite_token_key" UNIQUE ("token") ON CONFLICT DO NOTHING;
ALTER TABLE "WorkRelationship" ADD CONSTRAINT "WorkRelationship_brandId_supplierId_key" UNIQUE ("brandId", "supplierId") ON CONFLICT DO NOTHING;

-- ============= FOREIGN KEYS =============

ALTER TABLE "Member" DROP CONSTRAINT IF EXISTS "Member_userId_fkey";
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Brand" DROP CONSTRAINT IF EXISTS "Brand_userId_fkey";
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrandImage" DROP CONSTRAINT IF EXISTS "BrandImage_brandId_fkey";
ALTER TABLE "BrandImage" ADD CONSTRAINT "BrandImage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Supplier" DROP CONSTRAINT IF EXISTS "Supplier_userId_fkey";
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierImage" DROP CONSTRAINT IF EXISTS "SupplierImage_supplierId_fkey";
ALTER TABLE "SupplierImage" ADD CONSTRAINT "SupplierImage_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierReview" DROP CONSTRAINT IF EXISTS "SupplierReview_supplierId_fkey";
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierReview" DROP CONSTRAINT IF EXISTS "SupplierReview_brandId_fkey";
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierReview" DROP CONSTRAINT IF EXISTS "SupplierReview_userId_fkey";
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierClaim" DROP CONSTRAINT IF EXISTS "SupplierClaim_supplierId_fkey";
ALTER TABLE "SupplierClaim" ADD CONSTRAINT "SupplierClaim_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierClaim" DROP CONSTRAINT IF EXISTS "SupplierClaim_userId_fkey";
ALTER TABLE "SupplierClaim" ADD CONSTRAINT "SupplierClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Offer" DROP CONSTRAINT IF EXISTS "Offer_supplierId_fkey";
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OfferClaim" DROP CONSTRAINT IF EXISTS "OfferClaim_offerId_fkey";
ALTER TABLE "OfferClaim" ADD CONSTRAINT "OfferClaim_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OfferClaim" DROP CONSTRAINT IF EXISTS "OfferClaim_userId_fkey";
ALTER TABLE "OfferClaim" ADD CONSTRAINT "OfferClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventRsvp" DROP CONSTRAINT IF EXISTS "EventRsvp_eventId_fkey";
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventRsvp" DROP CONSTRAINT IF EXISTS "EventRsvp_userId_fkey";
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedSupplier" DROP CONSTRAINT IF EXISTS "SavedSupplier_userId_fkey";
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedSupplier" DROP CONSTRAINT IF EXISTS "SavedSupplier_supplierId_fkey";
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedBrand" DROP CONSTRAINT IF EXISTS "SavedBrand_userId_fkey";
ALTER TABLE "SavedBrand" ADD CONSTRAINT "SavedBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedBrand" DROP CONSTRAINT IF EXISTS "SavedBrand_brandId_fkey";
ALTER TABLE "SavedBrand" ADD CONSTRAINT "SavedBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NewsArticle" DROP CONSTRAINT IF EXISTS "NewsArticle_sourceId_fkey";
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Organisation" DROP CONSTRAINT IF EXISTS "Organisation_brandId_fkey";
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Organisation" DROP CONSTRAINT IF EXISTS "Organisation_supplierId_fkey";
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrganisationMember" DROP CONSTRAINT IF EXISTS "OrganisationMember_organisationId_fkey";
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganisationMember" DROP CONSTRAINT IF EXISTS "OrganisationMember_userId_fkey";
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganisationInvite" DROP CONSTRAINT IF EXISTS "OrganisationInvite_organisationId_fkey";
ALTER TABLE "OrganisationInvite" ADD CONSTRAINT "OrganisationInvite_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkRelationship" DROP CONSTRAINT IF EXISTS "WorkRelationship_brandId_fkey";
ALTER TABLE "WorkRelationship" ADD CONSTRAINT "WorkRelationship_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkRelationship" DROP CONSTRAINT IF EXISTS "WorkRelationship_supplierId_fkey";
ALTER TABLE "WorkRelationship" ADD CONSTRAINT "WorkRelationship_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============= INDEXES =============

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "Member_firstName_lastName_idx" ON "Member"("firstName", "lastName");
CREATE INDEX IF NOT EXISTS "Brand_slug_idx" ON "Brand"("slug");
CREATE INDEX IF NOT EXISTS "Brand_category_idx" ON "Brand"("category");
CREATE INDEX IF NOT EXISTS "Brand_location_idx" ON "Brand"("location");
CREATE INDEX IF NOT EXISTS "Brand_name_idx" ON "Brand"("name");
CREATE INDEX IF NOT EXISTS "Supplier_slug_idx" ON "Supplier"("slug");
CREATE INDEX IF NOT EXISTS "Supplier_category_idx" ON "Supplier"("category");
CREATE INDEX IF NOT EXISTS "Supplier_location_idx" ON "Supplier"("location");
CREATE INDEX IF NOT EXISTS "Supplier_companyName_idx" ON "Supplier"("companyName");
CREATE INDEX IF NOT EXISTS "Supplier_claimStatus_idx" ON "Supplier"("claimStatus");
CREATE INDEX IF NOT EXISTS "SupplierReview_supplierId_idx" ON "SupplierReview"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierReview_rating_idx" ON "SupplierReview"("rating");
CREATE INDEX IF NOT EXISTS "SupplierClaim_status_idx" ON "SupplierClaim"("status");
CREATE INDEX IF NOT EXISTS "Offer_status_idx" ON "Offer"("status");
CREATE INDEX IF NOT EXISTS "Offer_supplierId_idx" ON "Offer"("supplierId");
CREATE INDEX IF NOT EXISTS "Offer_endDate_idx" ON "Offer"("endDate");
CREATE INDEX IF NOT EXISTS "Event_startDate_idx" ON "Event"("startDate");
CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");
CREATE INDEX IF NOT EXISTS "Event_type_idx" ON "Event"("type");
CREATE INDEX IF NOT EXISTS "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");
CREATE INDEX IF NOT EXISTS "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");
CREATE INDEX IF NOT EXISTS "SearchQuery_query_idx" ON "SearchQuery"("query");
CREATE INDEX IF NOT EXISTS "Organisation_slug_idx" ON "Organisation"("slug");
CREATE INDEX IF NOT EXISTS "Organisation_type_idx" ON "Organisation"("type");
CREATE INDEX IF NOT EXISTS "OrganisationMember_userId_idx" ON "OrganisationMember"("userId");
CREATE INDEX IF NOT EXISTS "OrganisationInvite_token_idx" ON "OrganisationInvite"("token");
CREATE INDEX IF NOT EXISTS "OrganisationInvite_email_idx" ON "OrganisationInvite"("email");
CREATE INDEX IF NOT EXISTS "WorkRelationship_brandId_idx" ON "WorkRelationship"("brandId");
CREATE INDEX IF NOT EXISTS "WorkRelationship_supplierId_idx" ON "WorkRelationship"("supplierId");

-- ============= DONE =============
-- Schema created successfully!
