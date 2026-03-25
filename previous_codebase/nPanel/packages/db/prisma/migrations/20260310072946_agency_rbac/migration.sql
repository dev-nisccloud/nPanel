-- AlterTable
ALTER TABLE "user" ADD COLUMN     "agencyRoleId" TEXT;

-- CreateTable
CREATE TABLE "agency_role" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_role_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "agency_permission" (
    "_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_permission_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "agency_role_permission" (
    "_id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_role_permission_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agency_role_name_key" ON "agency_role"("name");

-- CreateIndex
CREATE INDEX "agency_role_name_idx" ON "agency_role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "agency_permission_key_key" ON "agency_permission"("key");

-- CreateIndex
CREATE INDEX "agency_permission_key_idx" ON "agency_permission"("key");

-- CreateIndex
CREATE INDEX "agency_role_permission_roleId_idx" ON "agency_role_permission"("roleId");

-- CreateIndex
CREATE INDEX "agency_role_permission_permissionId_idx" ON "agency_role_permission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "agency_role_permission_roleId_permissionId_key" ON "agency_role_permission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_agencyRoleId_idx" ON "user"("agencyRoleId");

-- AddForeignKey
ALTER TABLE "agency_role_permission" ADD CONSTRAINT "agency_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "agency_role"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_role_permission" ADD CONSTRAINT "agency_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "agency_permission"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_agencyRoleId_fkey" FOREIGN KEY ("agencyRoleId") REFERENCES "agency_role"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
