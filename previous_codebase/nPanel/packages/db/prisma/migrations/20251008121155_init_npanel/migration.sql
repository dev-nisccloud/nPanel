-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'AGENCY_ADMIN');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastAccessedTeamId" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "emailVerified" SET DEFAULT false;

-- CreateTable
CREATE TABLE "team" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "team_invite" (
    "_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_invite_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "cloud_services" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT,
    "pleskserviceId" TEXT NOT NULL,
    "pleskownerId" TEXT,
    "connectedBy" TEXT,
    "firstpurchasedAt" TIMESTAMP(3),
    "purchaseAt" TIMESTAMP(3),
    "renewsOn" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloud_services_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "timezone" TEXT,
    "language" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "user_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_slug_key" ON "team"("slug");

-- CreateIndex
CREATE INDEX "team_slug_idx" ON "team"("slug");

-- CreateIndex
CREATE INDEX "team_createdById_idx" ON "team"("createdById");

-- CreateIndex
CREATE INDEX "team_isActive_idx" ON "team"("isActive");

-- CreateIndex
CREATE INDEX "team_member_teamId_idx" ON "team_member"("teamId");

-- CreateIndex
CREATE INDEX "team_member_userId_idx" ON "team_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_userId_key" ON "team_member"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_invite_code_key" ON "team_invite"("code");

-- CreateIndex
CREATE INDEX "team_invite_code_idx" ON "team_invite"("code");

-- CreateIndex
CREATE INDEX "team_invite_teamId_idx" ON "team_invite"("teamId");

-- CreateIndex
CREATE INDEX "team_invite_email_idx" ON "team_invite"("email");

-- CreateIndex
CREATE INDEX "team_invite_status_idx" ON "team_invite"("status");

-- CreateIndex
CREATE INDEX "team_invite_expiresAt_idx" ON "team_invite"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "team_invite_teamId_email_key" ON "team_invite"("teamId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "cloud_services_pleskserviceId_key" ON "cloud_services"("pleskserviceId");

-- CreateIndex
CREATE INDEX "cloud_services_teamId_idx" ON "cloud_services"("teamId");

-- CreateIndex
CREATE INDEX "cloud_services_pleskserviceId_idx" ON "cloud_services"("pleskserviceId");

-- CreateIndex
CREATE INDEX "cloud_services_pleskownerId_idx" ON "cloud_services"("pleskownerId");

-- CreateIndex
CREATE INDEX "cloud_services_isActive_idx" ON "cloud_services"("isActive");

-- CreateIndex
CREATE INDEX "cloud_services_renewsOn_idx" ON "cloud_services"("renewsOn");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_userId_key" ON "user_profile"("userId");

-- CreateIndex
CREATE INDEX "user_profile_userId_idx" ON "user_profile"("userId");

-- CreateIndex
CREATE INDEX "user_activity_log_userId_idx" ON "user_activity_log"("userId");

-- CreateIndex
CREATE INDEX "user_activity_log_action_idx" ON "user_activity_log"("action");

-- CreateIndex
CREATE INDEX "user_activity_log_createdAt_idx" ON "user_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE INDEX "user_lastAccessedTeamId_idx" ON "user"("lastAccessedTeamId");

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_services" ADD CONSTRAINT "cloud_services_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
