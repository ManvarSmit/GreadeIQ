-- AlterTable
ALTER TABLE "students" ADD COLUMN     "mlConfidence" DOUBLE PRECISION,
ADD COLUMN     "mlLastUpdated" TIMESTAMP(3),
ADD COLUMN     "mlProbability" DOUBLE PRECISION;
