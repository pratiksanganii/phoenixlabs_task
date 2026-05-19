-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "savedAnswers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionHistory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "savedAnswers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_id_idx" ON "Session"("id");

-- CreateIndex
CREATE INDEX "SessionHistory_sessionId_idx" ON "SessionHistory"("sessionId");

-- AddForeignKey
ALTER TABLE "SessionHistory" ADD CONSTRAINT "SessionHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
