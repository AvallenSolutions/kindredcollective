-- Add categories array field to Brand for multi-category support
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "categories" TEXT[] NOT NULL DEFAULT '{}';

-- Backfill existing brands: copy their single category into the array
UPDATE "Brand" SET "categories" = ARRAY["category"::TEXT] WHERE "categories" = '{}';
