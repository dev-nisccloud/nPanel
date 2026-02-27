-- CreateTable
CREATE TABLE "email_builder_library" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_builder_library_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "email_builder_library_userId_idx" ON "email_builder_library"("userId");

-- CreateIndex
CREATE INDEX "email_builder_library_teamId_idx" ON "email_builder_library"("teamId");

-- CreateIndex
CREATE INDEX "email_builder_library_createdAt_idx" ON "email_builder_library"("createdAt");

-- AddForeignKey
ALTER TABLE "email_builder_library" ADD CONSTRAINT "email_builder_library_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_builder_library" ADD CONSTRAINT "email_builder_library_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
