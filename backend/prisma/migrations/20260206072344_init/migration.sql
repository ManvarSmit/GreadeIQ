-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MENTOR', 'COUNSELOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MENTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "department" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "currentCGPA" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "attendancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "familyIncome" DOUBLE PRECISION,
    "parentEducation" TEXT,
    "distanceFromHome" DOUBLE PRECISION,
    "libraryVisits" INTEGER NOT NULL DEFAULT 0,
    "extracurricular" BOOLEAN NOT NULL DEFAULT false,
    "disciplinaryIssues" INTEGER NOT NULL DEFAULT 0,
    "dropoutRisk" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "lastAssessment" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentId_key" ON "students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");
