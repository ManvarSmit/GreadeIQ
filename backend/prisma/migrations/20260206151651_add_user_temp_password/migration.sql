-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isTemporaryPassword" BOOLEAN NOT NULL DEFAULT false;
