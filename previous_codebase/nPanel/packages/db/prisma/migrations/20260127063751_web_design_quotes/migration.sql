-- CreateEnum
CREATE TYPE "WebDesignProjectType" AS ENUM ('NEW_WEBSITE', 'REDESIGN', 'ECOMMERCE', 'LANDING_PAGE', 'WEB_APP', 'OTHER');

-- CreateEnum
CREATE TYPE "WebDesignQuoteStatus" AS ENUM ('PENDING', 'CONTACTED', 'QUOTED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "web_design_quote_request" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "domain" TEXT,
    "projectType" "WebDesignProjectType" NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "targetLaunchDate" TIMESTAMP(3),
    "status" "WebDesignQuoteStatus" NOT NULL DEFAULT 'PENDING',
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_design_quote_request_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "web_design_quote_request_status_idx" ON "web_design_quote_request"("status");

-- CreateIndex
CREATE INDEX "web_design_quote_request_submittedById_idx" ON "web_design_quote_request"("submittedById");

-- CreateIndex
CREATE INDEX "web_design_quote_request_createdAt_idx" ON "web_design_quote_request"("createdAt");

-- CreateIndex
CREATE INDEX "web_design_quote_request_email_idx" ON "web_design_quote_request"("email");

-- AddForeignKey
ALTER TABLE "web_design_quote_request" ADD CONSTRAINT "web_design_quote_request_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
