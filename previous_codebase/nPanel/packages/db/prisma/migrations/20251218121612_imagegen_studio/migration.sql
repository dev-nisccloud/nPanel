-- CreateTable
CREATE TABLE "imagegen_project" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "json" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagegen_project_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "imagegen_template" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "json" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagegen_template_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "imagegen_project_activity_log" (
    "_id" TEXT NOT NULL,
    "imageGenProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagegen_project_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "imagegen_template_activity_log" (
    "_id" TEXT NOT NULL,
    "imageGenTemplateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagegen_template_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "imagegen_project_userId_idx" ON "imagegen_project"("userId");

-- CreateIndex
CREATE INDEX "imagegen_project_teamId_idx" ON "imagegen_project"("teamId");

-- CreateIndex
CREATE INDEX "imagegen_template_userId_idx" ON "imagegen_template"("userId");

-- CreateIndex
CREATE INDEX "imagegen_template_isPublic_idx" ON "imagegen_template"("isPublic");

-- CreateIndex
CREATE INDEX "imagegen_project_activity_log_imageGenProjectId_idx" ON "imagegen_project_activity_log"("imageGenProjectId");

-- CreateIndex
CREATE INDEX "imagegen_project_activity_log_userId_idx" ON "imagegen_project_activity_log"("userId");

-- CreateIndex
CREATE INDEX "imagegen_project_activity_log_action_idx" ON "imagegen_project_activity_log"("action");

-- CreateIndex
CREATE INDEX "imagegen_project_activity_log_createdAt_idx" ON "imagegen_project_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "imagegen_template_activity_log_imageGenTemplateId_idx" ON "imagegen_template_activity_log"("imageGenTemplateId");

-- CreateIndex
CREATE INDEX "imagegen_template_activity_log_userId_idx" ON "imagegen_template_activity_log"("userId");

-- CreateIndex
CREATE INDEX "imagegen_template_activity_log_action_idx" ON "imagegen_template_activity_log"("action");

-- CreateIndex
CREATE INDEX "imagegen_template_activity_log_createdAt_idx" ON "imagegen_template_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "imagegen_project" ADD CONSTRAINT "imagegen_project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagegen_project" ADD CONSTRAINT "imagegen_project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagegen_template" ADD CONSTRAINT "imagegen_template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagegen_project_activity_log" ADD CONSTRAINT "imagegen_project_activity_log_imageGenProjectId_fkey" FOREIGN KEY ("imageGenProjectId") REFERENCES "imagegen_project"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagegen_template_activity_log" ADD CONSTRAINT "imagegen_template_activity_log_imageGenTemplateId_fkey" FOREIGN KEY ("imageGenTemplateId") REFERENCES "imagegen_template"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
