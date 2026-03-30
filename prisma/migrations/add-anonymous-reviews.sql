-- Add isAnonymous column to SupplierReview table
ALTER TABLE "SupplierReview" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
