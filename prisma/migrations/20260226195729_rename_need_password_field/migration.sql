/*
  Warnings:

  - You are about to drop the column `needPasswordReset` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "needPasswordReset",
ADD COLUMN     "needPasswordChange" BOOLEAN NOT NULL DEFAULT false;
