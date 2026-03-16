-- Create GameScore table for the 404 Bottle Breaker leaderboard
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "GameScore" (
  "id" TEXT NOT NULL DEFAULT concat('c', substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
  "name" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "level" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GameScore_score_idx" ON "GameScore"("score");
CREATE INDEX "GameScore_createdAt_idx" ON "GameScore"("createdAt");

-- Allow public read/write access (no auth required for the game)
ALTER TABLE "GameScore" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game scores"
  ON "GameScore" FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert game scores"
  ON "GameScore" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete game scores"
  ON "GameScore" FOR DELETE
  USING (true);
