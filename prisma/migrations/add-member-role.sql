-- Add MEMBER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MEMBER';

-- Add targetRole to InviteLink for role-specific invites
ALTER TABLE "InviteLink" ADD COLUMN IF NOT EXISTS "targetRole" "UserRole";

-- Add email field to InviteLink for targeted invites
ALTER TABLE "InviteLink" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Add phone field to InviteLink for WhatsApp share tracking
ALTER TABLE "InviteLink" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Add company field to Member for members not yet in an organisation
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "company" TEXT;

-- Index for targeted invite lookups
CREATE INDEX IF NOT EXISTS "InviteLink_email_idx" ON "InviteLink"("email");
