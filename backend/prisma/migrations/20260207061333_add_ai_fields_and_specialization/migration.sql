-- AlterTable
ALTER TABLE "mentors" ADD COLUMN     "specialization" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "aiAnalysis" TEXT,
ADD COLUMN     "aiAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "problemCategories" TEXT;
