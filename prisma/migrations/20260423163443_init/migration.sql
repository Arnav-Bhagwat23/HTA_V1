-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STANDARD', 'ADMIN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "JobMode" AS ENUM ('AUTOMATIC', 'MANUAL_UPLOAD');

-- CreateEnum
CREATE TYPE "JobSourceStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "GeographyCode" AS ENUM ('DE', 'FR', 'UK', 'IT', 'AU', 'ES', 'JP', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PDF', 'HTML', 'UPLOAD');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WarningCode" AS ENUM ('NO_RESULT_FOUND', 'SOURCE_UNAVAILABLE', 'SOURCE_PARSE_FAILED', 'PDF_CORRUPT', 'MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PARSE_FAILED', 'FIELD_NOT_PRESENT_IN_LATEST_DOCUMENT', 'CSV_GENERATION_FAILED', 'AUTH_REQUIRED', 'ACCESS_DENIED', 'UNKNOWN_ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawQuery" TEXT,
    "mode" "JobMode" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "canonicalDrug" TEXT,
    "canonicalIndication" TEXT,
    "canonicalGeography" "GeographyCode",
    "requiresManualUpload" BOOLEAN NOT NULL DEFAULT false,
    "failureCode" "WarningCode",
    "failureMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSource" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceCountry" "GeographyCode",
    "sourceType" "SourceType" NOT NULL,
    "status" "JobSourceStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" "WarningCode",
    "errorMessage" TEXT,
    "searchedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentConsidered" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobSourceId" TEXT,
    "documentTitle" TEXT NOT NULL,
    "documentUrl" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "sourceCountry" "GeographyCode",
    "publishedAt" TIMESTAMP(3),
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "selectionRank" INTEGER,
    "parseStatus" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "warningCode" "WarningCode",
    "warningMessage" TEXT,
    "rawTextPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentConsidered_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedDocument" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "localTempPath" TEXT NOT NULL,
    "uploadSize" INTEGER NOT NULL,
    "parseStatus" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "warningCode" "WarningCode",
    "warningMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldExtraction" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "documentConsideredId" TEXT,
    "uploadedDocumentId" TEXT,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "value" TEXT,
    "confidence" DOUBLE PRECISION,
    "warningCode" "WarningCode",
    "sourcePage" TEXT,
    "evidenceSnippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOutput" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "outputType" TEXT NOT NULL,
    "storagePath" TEXT,
    "mimeType" TEXT,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "jobId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealthEvent" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "warningCode" "WarningCode",
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceHealthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_status_expiresAt_idx" ON "Session"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "SearchJob_userId_createdAt_idx" ON "SearchJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchJob_status_createdAt_idx" ON "SearchJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SearchJob_mode_createdAt_idx" ON "SearchJob"("mode", "createdAt");

-- CreateIndex
CREATE INDEX "SearchJob_canonicalGeography_createdAt_idx" ON "SearchJob"("canonicalGeography", "createdAt");

-- CreateIndex
CREATE INDEX "JobSource_jobId_idx" ON "JobSource"("jobId");

-- CreateIndex
CREATE INDEX "JobSource_sourceKey_idx" ON "JobSource"("sourceKey");

-- CreateIndex
CREATE INDEX "JobSource_status_createdAt_idx" ON "JobSource"("status", "createdAt");

-- CreateIndex
CREATE INDEX "JobSource_sourceCountry_createdAt_idx" ON "JobSource"("sourceCountry", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentConsidered_jobId_idx" ON "DocumentConsidered"("jobId");

-- CreateIndex
CREATE INDEX "DocumentConsidered_jobSourceId_idx" ON "DocumentConsidered"("jobSourceId");

-- CreateIndex
CREATE INDEX "DocumentConsidered_isSelected_createdAt_idx" ON "DocumentConsidered"("isSelected", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentConsidered_sourceCountry_createdAt_idx" ON "DocumentConsidered"("sourceCountry", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentConsidered_parseStatus_createdAt_idx" ON "DocumentConsidered"("parseStatus", "createdAt");

-- CreateIndex
CREATE INDEX "UploadedDocument_jobId_idx" ON "UploadedDocument"("jobId");

-- CreateIndex
CREATE INDEX "UploadedDocument_jobId_createdAt_idx" ON "UploadedDocument"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "UploadedDocument_parseStatus_createdAt_idx" ON "UploadedDocument"("parseStatus", "createdAt");

-- CreateIndex
CREATE INDEX "FieldExtraction_jobId_fieldName_idx" ON "FieldExtraction"("jobId", "fieldName");

-- CreateIndex
CREATE INDEX "FieldExtraction_documentConsideredId_idx" ON "FieldExtraction"("documentConsideredId");

-- CreateIndex
CREATE INDEX "FieldExtraction_uploadedDocumentId_idx" ON "FieldExtraction"("uploadedDocumentId");

-- CreateIndex
CREATE INDEX "JobOutput_jobId_outputType_idx" ON "JobOutput"("jobId", "outputType");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_jobId_createdAt_idx" ON "AuditEvent"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_createdAt_idx" ON "AuditEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SourceHealthEvent_sourceKey_createdAt_idx" ON "SourceHealthEvent"("sourceKey", "createdAt");

-- CreateIndex
CREATE INDEX "SourceHealthEvent_status_createdAt_idx" ON "SourceHealthEvent"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchJob" ADD CONSTRAINT "SearchJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSource" ADD CONSTRAINT "JobSource_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentConsidered" ADD CONSTRAINT "DocumentConsidered_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentConsidered" ADD CONSTRAINT "DocumentConsidered_jobSourceId_fkey" FOREIGN KEY ("jobSourceId") REFERENCES "JobSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldExtraction" ADD CONSTRAINT "FieldExtraction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldExtraction" ADD CONSTRAINT "FieldExtraction_documentConsideredId_fkey" FOREIGN KEY ("documentConsideredId") REFERENCES "DocumentConsidered"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldExtraction" ADD CONSTRAINT "FieldExtraction_uploadedDocumentId_fkey" FOREIGN KEY ("uploadedDocumentId") REFERENCES "UploadedDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOutput" ADD CONSTRAINT "JobOutput_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SearchJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
