-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeVersion_userId_jobId_idx" ON "ResumeVersion"("userId", "jobId");

-- CreateIndex
CREATE INDEX "ResumeVersion_createdAt_idx" ON "ResumeVersion"("createdAt");
