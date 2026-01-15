-- Kindred Collective Database Schema
-- Run this in Supabase SQL Editor

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BRAND', 'SUPPLIER', 'ADMIN');
CREATE TYPE "DrinkCategory" AS ENUM ('SPIRITS', 'BEER', 'WINE', 'RTD', 'NO_LO', 'CIDER', 'OTHER');
CREATE TYPE "SupplierCategory" AS ENUM ('PACKAGING', 'INGREDIENTS', 'LOGISTICS', 'CO_PACKING', 'DESIGN', 'MARKETING', 'EQUIPMENT', 'CONSULTING', 'LEGAL', 'FINANCE', 'DISTRIBUTION', 'RECRUITMENT', 'SOFTWARE', 'SUSTAINABILITY', 'PR', 'PHOTOGRAPHY', 'WEB_DEVELOPMENT', 'OTHER');
CREATE TYPE "Certification" AS ENUM ('ORGANIC', 'B_CORP', 'FAIRTRADE', 'VEGAN', 'GLUTEN_FREE', 'PLASTIC_FREE', 'CARBON_NEUTRAL', 'OTHER');
CREATE TYPE "EventType" AS ENUM ('TRADE_SHOW', 'MEETUP', 'WORKSHOP', 'WEBINAR', 'NETWORKING', 'LAUNCH', 'PARTY', 'OTHER');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "OfferType" AS ENUM ('PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_TRIAL', 'BUNDLE', 'OTHER');
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'PAUSED');
CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'INTERESTED', 'NOT_GOING');
CREATE TYPE "ClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'CLAIMED', 'REJECTED');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Member
CREATE TABLE "Member" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable Brand
CREATE TABLE "Brand" (
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
    "subcategories" TEXT[],
    "yearFounded" INTEGER,
    "location" TEXT,
    "country" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable BrandImage
CREATE TABLE "BrandImage" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable Supplier
CREATE TABLE "Supplier" (
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
    "subcategories" TEXT[],
    "services" TEXT[],
    "certifications" "Certification"[],
    "moqMin" INTEGER,
    "moqMax" INTEGER,
    "leadTimeDays" INTEGER,
    "location" TEXT,
    "country" TEXT,
    "serviceRegions" TEXT[],
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable SupplierImage
CREATE TABLE "SupplierImage" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable SupplierReview
CREATE TABLE "SupplierReview" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable SupplierClaim
CREATE TABLE "SupplierClaim" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable Offer
CREATE TABLE "Offer" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable OfferClaim
CREATE TABLE "OfferClaim" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable Event
CREATE TABLE "Event" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventRsvp
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable SavedSupplier
CREATE TABLE "SavedSupplier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable SavedBrand
CREATE TABLE "SavedBrand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable NewsSource
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "siteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable NewsArticle
CREATE TABLE "NewsArticle" (
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

-- CreateTable SearchQuery
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "resultCount" INTEGER NOT NULL,
    "processingMs" INTEGER NOT NULL,
    "usedAI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");
CREATE INDEX "Member_firstName_lastName_idx" ON "Member"("firstName", "lastName");
CREATE UNIQUE INDEX "Brand_userId_key" ON "Brand"("userId");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");
CREATE INDEX "Brand_category_idx" ON "Brand"("category");
CREATE INDEX "Brand_location_idx" ON "Brand"("location");
CREATE INDEX "Brand_name_idx" ON "Brand"("name");
CREATE UNIQUE INDEX "Supplier_userId_key" ON "Supplier"("userId");
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");
CREATE INDEX "Supplier_slug_idx" ON "Supplier"("slug");
CREATE INDEX "Supplier_category_idx" ON "Supplier"("category");
CREATE INDEX "Supplier_location_idx" ON "Supplier"("location");
CREATE INDEX "Supplier_companyName_idx" ON "Supplier"("companyName");
CREATE INDEX "Supplier_claimStatus_idx" ON "Supplier"("claimStatus");
CREATE INDEX "SupplierReview_supplierId_idx" ON "SupplierReview"("supplierId");
CREATE INDEX "SupplierReview_rating_idx" ON "SupplierReview"("rating");
CREATE INDEX "SupplierClaim_status_idx" ON "SupplierClaim"("status");
CREATE UNIQUE INDEX "SupplierClaim_supplierId_userId_key" ON "SupplierClaim"("supplierId", "userId");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");
CREATE INDEX "Offer_supplierId_idx" ON "Offer"("supplierId");
CREATE INDEX "Offer_endDate_idx" ON "Offer"("endDate");
CREATE UNIQUE INDEX "OfferClaim_offerId_userId_key" ON "OfferClaim"("offerId", "userId");
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_type_idx" ON "Event"("type");
CREATE UNIQUE INDEX "EventRsvp_eventId_userId_key" ON "EventRsvp"("eventId", "userId");
CREATE UNIQUE INDEX "SavedSupplier_userId_supplierId_key" ON "SavedSupplier"("userId", "supplierId");
CREATE UNIQUE INDEX "SavedBrand_userId_brandId_key" ON "SavedBrand"("userId", "brandId");
CREATE UNIQUE INDEX "NewsSource_feedUrl_key" ON "NewsSource"("feedUrl");
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");
CREATE INDEX "SearchQuery_query_idx" ON "SearchQuery"("query");

-- AddForeignKeys
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandImage" ADD CONSTRAINT "BrandImage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierImage" ADD CONSTRAINT "SupplierImage_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierClaim" ADD CONSTRAINT "SupplierClaim_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierClaim" ADD CONSTRAINT "SupplierClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferClaim" ADD CONSTRAINT "OfferClaim_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferClaim" ADD CONSTRAINT "OfferClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedBrand" ADD CONSTRAINT "SavedBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedBrand" ADD CONSTRAINT "SavedBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
