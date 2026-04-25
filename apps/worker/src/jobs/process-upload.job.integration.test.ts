import path from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  JobMode,
  JobStatus,
  ParseStatus,
  PrismaClient,
  UserRole,
  WarningCode,
} from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/hta_v1';

process.env.DATABASE_URL = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
process.env.PDF_PARSER_MODE = 'live';

const prisma = new PrismaClient();
const minimalPdfPath = path.join(
  process.cwd(),
  'apps/worker/src/parsing/fixtures/minimal.pdf',
);

let processUploadJob: typeof import('./process-upload.job').processUploadJob;

beforeAll(async () => {
  ({ processUploadJob } = await import('./process-upload.job'));
}, 20000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe('processUploadJob', () => {
  it('processes a local fixture PDF upload into fields and downloadable output', async () => {
    const email = `worker-upload-${randomUUID()}@hta.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'scrypt:test:test',
        role: UserRole.STANDARD,
      },
      select: {
        id: true,
      },
    });

    try {
      const job = await prisma.searchJob.create({
        data: {
          userId: user.id,
          mode: JobMode.MANUAL_UPLOAD,
          status: JobStatus.QUEUED,
          requiresManualUpload: true,
        },
        select: {
          id: true,
        },
      });

      const uploadedDocument = await prisma.uploadedDocument.create({
        data: {
          jobId: job.id,
          originalFilename: 'minimal.pdf',
          mimeType: 'application/pdf',
          localTempPath: minimalPdfPath,
          uploadSize: 587,
        },
        select: {
          id: true,
        },
      });

      await processUploadJob({ data: { searchJobId: job.id } } as never);

      const completedJob = await prisma.searchJob.findUnique({
        where: { id: job.id },
        select: {
          status: true,
          fieldExtractions: {
            orderBy: [
              { fieldName: 'asc' },
              { createdAt: 'asc' },
            ],
            select: {
              fieldName: true,
              value: true,
              uploadedDocumentId: true,
            },
          },
          jobOutputs: {
            where: { isDownloadable: true },
            select: {
              outputType: true,
              isDownloadable: true,
            },
          },
          auditEvents: {
            orderBy: { createdAt: 'asc' },
            select: {
              eventType: true,
            },
          },
        },
      });

      const refreshedUpload = await prisma.uploadedDocument.findUnique({
        where: { id: uploadedDocument.id },
        select: {
          parseStatus: true,
          warningCode: true,
        },
      });

      expect(completedJob?.status).toBe(JobStatus.COMPLETED);
      expect(refreshedUpload).toEqual({
        parseStatus: ParseStatus.PARSED,
        warningCode: null,
      });
      expect(completedJob?.fieldExtractions.length).toBeGreaterThan(0);
      expect(completedJob?.fieldExtractions.every((field) => field.uploadedDocumentId === uploadedDocument.id))
        .toBe(true);
      expect(completedJob?.jobOutputs).toEqual(
        expect.arrayContaining([
          {
            outputType: 'csv',
            isDownloadable: true,
          },
          {
            outputType: 'xlsx',
            isDownloadable: true,
          },
        ]),
      );
      expect(completedJob?.auditEvents.map((event) => event.eventType)).toEqual(
        expect.arrayContaining([
          'upload_processing_started',
          'uploaded_document_processed',
          'upload_processing_completed',
        ]),
      );
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  }, 15000);

  it('marks pending uploads as failed and leaves the job partial', async () => {
    const email = `worker-upload-fail-${randomUUID()}@hta.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'scrypt:test:test',
        role: UserRole.STANDARD,
      },
      select: {
        id: true,
      },
    });

    try {
      const job = await prisma.searchJob.create({
        data: {
          userId: user.id,
          mode: JobMode.MANUAL_UPLOAD,
          status: JobStatus.QUEUED,
          requiresManualUpload: true,
        },
        select: {
          id: true,
        },
      });

      const uploadedDocument = await prisma.uploadedDocument.create({
        data: {
          jobId: job.id,
          originalFilename: 'pending.pdf',
          mimeType: 'application/pdf',
          localTempPath: 'pending://upload/test/pending.pdf',
          uploadSize: 123,
        },
        select: {
          id: true,
        },
      });

      await processUploadJob({ data: { searchJobId: job.id } } as never);

      const partialJob = await prisma.searchJob.findUnique({
        where: { id: job.id },
        select: {
          status: true,
          fieldExtractions: {
            select: {
              id: true,
            },
          },
        },
      });

      const failedUpload = await prisma.uploadedDocument.findUnique({
        where: { id: uploadedDocument.id },
        select: {
          parseStatus: true,
          warningCode: true,
          warningMessage: true,
        },
      });

      expect(partialJob?.status).toBe(JobStatus.PARTIAL);
      expect(partialJob?.fieldExtractions).toHaveLength(0);
      expect(failedUpload?.parseStatus).toBe(ParseStatus.FAILED);
      expect(failedUpload?.warningCode).toBe(WarningCode.UPLOAD_PARSE_FAILED);
      expect(failedUpload?.warningMessage).toContain('bytes are not available');
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});
