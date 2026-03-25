-- CreateEnum
CREATE TYPE "CreativeAssetStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VersionApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "creative_asset" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "category" TEXT,
    "status" "CreativeAssetStatus" NOT NULL DEFAULT 'DRAFT',
    "currentInternalVersion" INTEGER NOT NULL DEFAULT 0,
    "currentPublicVersion" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "lastModifiedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_asset_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_asset_version" (
    "_id" TEXT NOT NULL,
    "creativeAssetId" TEXT NOT NULL,
    "internalVersionNumber" INTEGER NOT NULL,
    "publicVersionNumber" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "internalApprovalStatus" "VersionApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "publicApprovalStatus" "VersionApprovalStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileMetadata" JSONB,
    "versionNotes" TEXT,
    "changesSummary" TEXT,
    "previousVersionId" TEXT,
    "internalApprovedBy" TEXT,
    "internalApprovedAt" TIMESTAMP(3),
    "internalRejectedBy" TEXT,
    "internalRejectedAt" TIMESTAMP(3),
    "internalRejectionReason" TEXT,
    "publicApprovedBy" TEXT,
    "publicApprovedAt" TIMESTAMP(3),
    "publicRejectedBy" TEXT,
    "publicRejectedAt" TIMESTAMP(3),
    "publicRejectionReason" TEXT,
    "madePublicBy" TEXT,
    "madePublicAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_asset_version_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_asset_permission" (
    "_id" TEXT NOT NULL,
    "creativeAssetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canComment" BOOLEAN NOT NULL DEFAULT true,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_asset_permission_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_asset_comment" (
    "_id" TEXT NOT NULL,
    "creativeAssetVersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "parentCommentId" TEXT,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "mentions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "creative_asset_comment_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_asset_activity_log" (
    "_id" TEXT NOT NULL,
    "creativeAssetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_asset_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_asset_version_activity_log" (
    "_id" TEXT NOT NULL,
    "creativeAssetVersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_asset_version_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "creative_asset_teamId_idx" ON "creative_asset"("teamId");

-- CreateIndex
CREATE INDEX "creative_asset_status_idx" ON "creative_asset"("status");

-- CreateIndex
CREATE INDEX "creative_asset_createdBy_idx" ON "creative_asset"("createdBy");

-- CreateIndex
CREATE INDEX "creative_asset_isPublic_idx" ON "creative_asset"("isPublic");

-- CreateIndex
CREATE INDEX "creative_asset_createdAt_idx" ON "creative_asset"("createdAt");

-- CreateIndex
CREATE INDEX "creative_asset_version_creativeAssetId_idx" ON "creative_asset_version"("creativeAssetId");

-- CreateIndex
CREATE INDEX "creative_asset_version_internalVersionNumber_idx" ON "creative_asset_version"("internalVersionNumber");

-- CreateIndex
CREATE INDEX "creative_asset_version_publicVersionNumber_idx" ON "creative_asset_version"("publicVersionNumber");

-- CreateIndex
CREATE INDEX "creative_asset_version_isPublic_idx" ON "creative_asset_version"("isPublic");

-- CreateIndex
CREATE INDEX "creative_asset_version_internalApprovalStatus_idx" ON "creative_asset_version"("internalApprovalStatus");

-- CreateIndex
CREATE INDEX "creative_asset_version_publicApprovalStatus_idx" ON "creative_asset_version"("publicApprovalStatus");

-- CreateIndex
CREATE INDEX "creative_asset_version_createdAt_idx" ON "creative_asset_version"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "creative_asset_version_creativeAssetId_internalVersionNumbe_key" ON "creative_asset_version"("creativeAssetId", "internalVersionNumber");

-- CreateIndex
CREATE INDEX "creative_asset_permission_creativeAssetId_idx" ON "creative_asset_permission"("creativeAssetId");

-- CreateIndex
CREATE INDEX "creative_asset_permission_userId_idx" ON "creative_asset_permission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "creative_asset_permission_creativeAssetId_userId_key" ON "creative_asset_permission"("creativeAssetId", "userId");

-- CreateIndex
CREATE INDEX "creative_asset_comment_creativeAssetVersionId_idx" ON "creative_asset_comment"("creativeAssetVersionId");

-- CreateIndex
CREATE INDEX "creative_asset_comment_userId_idx" ON "creative_asset_comment"("userId");

-- CreateIndex
CREATE INDEX "creative_asset_comment_isInternal_idx" ON "creative_asset_comment"("isInternal");

-- CreateIndex
CREATE INDEX "creative_asset_comment_parentCommentId_idx" ON "creative_asset_comment"("parentCommentId");

-- CreateIndex
CREATE INDEX "creative_asset_comment_isResolved_idx" ON "creative_asset_comment"("isResolved");

-- CreateIndex
CREATE INDEX "creative_asset_comment_createdAt_idx" ON "creative_asset_comment"("createdAt");

-- CreateIndex
CREATE INDEX "creative_asset_activity_log_creativeAssetId_idx" ON "creative_asset_activity_log"("creativeAssetId");

-- CreateIndex
CREATE INDEX "creative_asset_activity_log_userId_idx" ON "creative_asset_activity_log"("userId");

-- CreateIndex
CREATE INDEX "creative_asset_activity_log_action_idx" ON "creative_asset_activity_log"("action");

-- CreateIndex
CREATE INDEX "creative_asset_activity_log_createdAt_idx" ON "creative_asset_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "creative_asset_version_activity_log_creativeAssetVersionId_idx" ON "creative_asset_version_activity_log"("creativeAssetVersionId");

-- CreateIndex
CREATE INDEX "creative_asset_version_activity_log_userId_idx" ON "creative_asset_version_activity_log"("userId");

-- CreateIndex
CREATE INDEX "creative_asset_version_activity_log_action_idx" ON "creative_asset_version_activity_log"("action");

-- CreateIndex
CREATE INDEX "creative_asset_version_activity_log_createdAt_idx" ON "creative_asset_version_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "creative_asset" ADD CONSTRAINT "creative_asset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_asset_version" ADD CONSTRAINT "creative_asset_version_creativeAssetId_fkey" FOREIGN KEY ("creativeAssetId") REFERENCES "creative_asset"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_asset_permission" ADD CONSTRAINT "creative_asset_permission_creativeAssetId_fkey" FOREIGN KEY ("creativeAssetId") REFERENCES "creative_asset"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_asset_comment" ADD CONSTRAINT "creative_asset_comment_creativeAssetVersionId_fkey" FOREIGN KEY ("creativeAssetVersionId") REFERENCES "creative_asset_version"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_asset_comment" ADD CONSTRAINT "creative_asset_comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "creative_asset_comment"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_asset_activity_log" ADD CONSTRAINT "creative_asset_activity_log_creativeAssetId_fkey" FOREIGN KEY ("creativeAssetId") REFERENCES "creative_asset"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_asset_version_activity_log" ADD CONSTRAINT "creative_asset_version_activity_log_creativeAssetVersionId_fkey" FOREIGN KEY ("creativeAssetVersionId") REFERENCES "creative_asset_version"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
