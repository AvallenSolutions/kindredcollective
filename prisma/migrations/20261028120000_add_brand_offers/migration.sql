-- Offers can now belong to a brand as well as a supplier
ALTER TABLE "Offer" ALTER COLUMN "supplierId" DROP NOT NULL;

ALTER TABLE "Offer" ADD COLUMN "brandId" TEXT;

-- CreateIndex
CREATE INDEX "Offer_brandId_idx" ON "Offer"("brandId");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one owner per offer
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_single_owner_check" CHECK (num_nonnulls("supplierId", "brandId") = 1);
