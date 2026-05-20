-- CreateTable
CREATE TABLE "counseling_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "actionsTaken" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "riskBefore" TEXT NOT NULL,
    "riskScoreBefore" INTEGER NOT NULL,
    "riskAfter" TEXT,
    "riskScoreAfter" INTEGER,
    "attendanceImprovement" DOUBLE PRECISION,
    "cgpaImprovement" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "counseling_logs" ADD CONSTRAINT "counseling_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
