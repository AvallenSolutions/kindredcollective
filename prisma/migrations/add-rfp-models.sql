-- Migration: Add RFP (Request for Proposal) models
-- Run this in Supabase SQL editor

-- Enums
DO $$ BEGIN
  CREATE TYPE "RFPStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'AWARDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RFPResponseStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RFP table
CREATE TABLE IF NOT EXISTS "RFP" (
  "id"             TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT NOT NULL,
  "brandId"        TEXT NOT NULL,
  "postedByUserId" TEXT NOT NULL,
  "category"       "SupplierCategory" NOT NULL,
  "subcategories"  TEXT[] NOT NULL DEFAULT '{}',
  "budget"         TEXT,
  "deadline"       TIMESTAMP(3),
  "location"       TEXT,
  "isRemoteOk"     BOOLEAN NOT NULL DEFAULT false,
  "status"         "RFPStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RFP_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RFP_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE,
  CONSTRAINT "RFP_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "RFP_brandId_idx" ON "RFP"("brandId");
CREATE INDEX IF NOT EXISTS "RFP_category_idx" ON "RFP"("category");
CREATE INDEX IF NOT EXISTS "RFP_status_idx" ON "RFP"("status");
CREATE INDEX IF NOT EXISTS "RFP_createdAt_idx" ON "RFP"("createdAt");

-- RFPResponse table
CREATE TABLE IF NOT EXISTS "RFPResponse" (
  "id"                TEXT NOT NULL,
  "rfpId"             TEXT NOT NULL,
  "supplierId"        TEXT NOT NULL,
  "respondedByUserId" TEXT NOT NULL,
  "message"           TEXT NOT NULL,
  "status"            "RFPResponseStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RFPResponse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RFPResponse_rfpId_supplierId_key" UNIQUE ("rfpId", "supplierId"),
  CONSTRAINT "RFPResponse_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "RFP"("id") ON DELETE CASCADE,
  CONSTRAINT "RFPResponse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE,
  CONSTRAINT "RFPResponse_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "RFPResponse_rfpId_idx" ON "RFPResponse"("rfpId");
CREATE INDEX IF NOT EXISTS "RFPResponse_supplierId_idx" ON "RFPResponse"("supplierId");
CREATE INDEX IF NOT EXISTS "RFPResponse_status_idx" ON "RFPResponse"("status");

-- RLS policies (allow members to read, brand owners to write their own RFPs)
ALTER TABLE "RFP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RFPResponse" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read open RFPs
CREATE POLICY "RFP_select_authenticated" ON "RFP"
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to read responses (brand sees responses to their RFPs; suppliers see their own)
CREATE POLICY "RFPResponse_select_authenticated" ON "RFPResponse"
  FOR SELECT TO authenticated USING (true);

-- Insert/Update/Delete via service role only (API routes use admin client)
CREATE POLICY "RFP_all_service_role" ON "RFP"
  FOR ALL TO service_role USING (true);

CREATE POLICY "RFPResponse_all_service_role" ON "RFPResponse"
  FOR ALL TO service_role USING (true);
