/*
  Warnings:

  - You are about to drop the `seo_report_top_page` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."seo_report_top_page" DROP CONSTRAINT "seo_report_top_page_seoReportId_fkey";

-- DropTable
DROP TABLE "public"."seo_report_top_page";
