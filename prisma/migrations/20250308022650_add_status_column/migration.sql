/*
  Warnings:

  - You are about to drop the column `processed` on the `processed_images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "processed_images" DROP COLUMN "processed",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
