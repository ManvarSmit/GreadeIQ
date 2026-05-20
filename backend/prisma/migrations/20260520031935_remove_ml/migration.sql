/*
  Warnings:

  - You are about to drop the column `mlConfidence` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `mlLastUpdated` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `mlProbability` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "mlConfidence",
DROP COLUMN "mlLastUpdated",
DROP COLUMN "mlProbability";
