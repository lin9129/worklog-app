DELETE FROM "LotSummary";
ALTER TABLE "LotSummary" DROP CONSTRAINT IF EXISTS "LotSummary_lotNumber_productId_key";
