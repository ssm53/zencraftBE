/*
  Warnings:

  - You are about to drop the column `ownerID` on the `Image` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_ownerID_fkey";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "ownerID";
