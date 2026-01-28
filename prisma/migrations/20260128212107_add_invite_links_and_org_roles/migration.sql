-- CreateEnum
CREATE TYPE "OrganisationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable: Add invite tracking to User
ALTER TABLE "User" ADD COLUMN "inviteLinkToken" TEXT;

-- CreateTable: InviteLink for admin invites
CREATE TABLE "InviteLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "InviteLink_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add role to OrganisationMember (replacing isOwner)
ALTER TABLE "OrganisationMember" ADD COLUMN "role" "OrganisationMemberRole" NOT NULL DEFAULT 'MEMBER';

-- Migrate existing data: Set existing members with isOwner=true to OWNER role
UPDATE "OrganisationMember" SET "role" = 'OWNER' WHERE "isOwner" = true;

-- AlterTable: Remove old isOwner column
ALTER TABLE "OrganisationMember" DROP COLUMN "isOwner";

-- AlterTable: Add role to OrganisationInvite
ALTER TABLE "OrganisationInvite" ADD COLUMN "role" "OrganisationMemberRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_token_key" ON "InviteLink"("token");

-- CreateIndex
CREATE INDEX "InviteLink_token_idx" ON "InviteLink"("token");

-- CreateIndex
CREATE INDEX "InviteLink_isActive_idx" ON "InviteLink"("isActive");

-- CreateIndex
CREATE INDEX "InviteLink_createdBy_idx" ON "InviteLink"("createdBy");

-- CreateIndex
CREATE INDEX "OrganisationMember_role_idx" ON "OrganisationMember"("role");

-- AddForeignKey: User.inviteLinkToken -> InviteLink.token
ALTER TABLE "User" ADD CONSTRAINT "User_inviteLinkToken_fkey" FOREIGN KEY ("inviteLinkToken") REFERENCES "InviteLink"("token") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: InviteLink.createdBy -> User.id
ALTER TABLE "InviteLink" ADD CONSTRAINT "InviteLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
