/*
  Warnings:

  - You are about to drop the column `bio` on the `user_profile` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `user_profile` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `user_profile` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `user_profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_profile" DROP COLUMN "bio",
DROP COLUMN "language",
DROP COLUMN "timezone",
DROP COLUMN "website";
