-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('TECHNICAL', 'BILLING', 'FEATURE', 'BUG', 'ACCOUNT', 'GENERAL', 'HOSTING', 'DOMAIN', 'EMAIL', 'WORDPRESS');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('WEB', 'EMAIL', 'API', 'CHAT', 'PHONE');

-- CreateTable
CREATE TABLE "ticket" (
    "_id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TicketType" NOT NULL DEFAULT 'GENERAL',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "source" "TicketSource" NOT NULL DEFAULT 'WEB',
    "createdById" TEXT NOT NULL,
    "teamId" TEXT,
    "assignedToId" TEXT,
    "metadata" JSONB,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "lastResponseAt" TIMESTAMP(3),
    "lastCustomerResponseAt" TIMESTAMP(3),
    "lastAgentResponseAt" TIMESTAMP(3),

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ticket_comment" (
    "_id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ticket_comment_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ticket_participant" (
    "_id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_participant_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ticket_attachment" (
    "_id" TEXT NOT NULL,
    "ticketId" TEXT,
    "commentId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_attachment_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ticket_tag" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_tag_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ticket_tag_relation" (
    "_id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_tag_relation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ticket_activity_log" (
    "_id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ticketNumber_key" ON "ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ticket_createdById_idx" ON "ticket"("createdById");

-- CreateIndex
CREATE INDEX "ticket_teamId_idx" ON "ticket"("teamId");

-- CreateIndex
CREATE INDEX "ticket_assignedToId_idx" ON "ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "ticket_status_idx" ON "ticket"("status");

-- CreateIndex
CREATE INDEX "ticket_priority_idx" ON "ticket"("priority");

-- CreateIndex
CREATE INDEX "ticket_type_idx" ON "ticket"("type");

-- CreateIndex
CREATE INDEX "ticket_ticketNumber_idx" ON "ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ticket_createdAt_idx" ON "ticket"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_status_priority_idx" ON "ticket"("status", "priority");

-- CreateIndex
CREATE INDEX "ticket_teamId_status_idx" ON "ticket"("teamId", "status");

-- CreateIndex
CREATE INDEX "ticket_comment_ticketId_idx" ON "ticket_comment"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_comment_parentId_idx" ON "ticket_comment"("parentId");

-- CreateIndex
CREATE INDEX "ticket_comment_authorId_idx" ON "ticket_comment"("authorId");

-- CreateIndex
CREATE INDEX "ticket_comment_createdAt_idx" ON "ticket_comment"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_comment_ticketId_createdAt_idx" ON "ticket_comment"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "ticket_comment_isInternal_idx" ON "ticket_comment"("isInternal");

-- CreateIndex
CREATE INDEX "ticket_comment_deletedAt_idx" ON "ticket_comment"("deletedAt");

-- CreateIndex
CREATE INDEX "ticket_participant_ticketId_idx" ON "ticket_participant"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_participant_userId_idx" ON "ticket_participant"("userId");

-- CreateIndex
CREATE INDEX "ticket_participant_role_idx" ON "ticket_participant"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_participant_ticketId_userId_role_key" ON "ticket_participant"("ticketId", "userId", "role");

-- CreateIndex
CREATE INDEX "ticket_attachment_ticketId_idx" ON "ticket_attachment"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_attachment_commentId_idx" ON "ticket_attachment"("commentId");

-- CreateIndex
CREATE INDEX "ticket_attachment_uploadedById_idx" ON "ticket_attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "ticket_attachment_createdAt_idx" ON "ticket_attachment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_tag_name_key" ON "ticket_tag"("name");

-- CreateIndex
CREATE INDEX "ticket_tag_name_idx" ON "ticket_tag"("name");

-- CreateIndex
CREATE INDEX "ticket_tag_relation_ticketId_idx" ON "ticket_tag_relation"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_tag_relation_tagId_idx" ON "ticket_tag_relation"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_tag_relation_ticketId_tagId_key" ON "ticket_tag_relation"("ticketId", "tagId");

-- CreateIndex
CREATE INDEX "ticket_activity_log_ticketId_idx" ON "ticket_activity_log"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_activity_log_userId_idx" ON "ticket_activity_log"("userId");

-- CreateIndex
CREATE INDEX "ticket_activity_log_action_idx" ON "ticket_activity_log"("action");

-- CreateIndex
CREATE INDEX "ticket_activity_log_createdAt_idx" ON "ticket_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_activity_log_ticketId_createdAt_idx" ON "ticket_activity_log"("ticketId", "createdAt");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comment" ADD CONSTRAINT "ticket_comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comment" ADD CONSTRAINT "ticket_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comment" ADD CONSTRAINT "ticket_comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ticket_comment"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_participant" ADD CONSTRAINT "ticket_participant_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_participant" ADD CONSTRAINT "ticket_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ticket_comment"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tag_relation" ADD CONSTRAINT "ticket_tag_relation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tag_relation" ADD CONSTRAINT "ticket_tag_relation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ticket_tag"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_activity_log" ADD CONSTRAINT "ticket_activity_log_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
