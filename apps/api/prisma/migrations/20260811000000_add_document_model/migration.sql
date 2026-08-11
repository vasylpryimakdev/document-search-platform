-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'INDEXED', 'ERROR');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userFilename" TEXT NOT NULL,
    "s3Filename" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_s3Filename_key" ON "Document"("s3Filename");

-- CreateIndex
CREATE INDEX "Document_userEmail_uploadedAt_idx" ON "Document"("userEmail", "uploadedAt");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");
