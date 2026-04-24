import { readFile } from 'node:fs/promises';

import { JobStatus, ParseStatus, WarningCode } from '@prisma/client';
import type { ParsedDocument } from '@hta/shared';
import { Job } from 'bullmq';

import { extractFieldsFromParsedDocument } from '../extraction/extract-fields';
import { prisma } from '../lib/prisma';
import { parsePdfBuffer } from '../parsing/pdf-parser';

export interface ProcessUploadJobData {
  searchJobId: string;
}

type JobCompletionStatus = 'COMPLETED' | 'PARTIAL';

const markUploadJobStarted = async (
  searchJobId: string,
): Promise<void> => {
  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      auditEvents: {
        create: {
          eventType: 'upload_processing_started',
          eventPayload: {
            searchJobId,
          },
        },
      },
    },
  });
};

const markUploadJobCompleted = async (
  searchJobId: string,
  status: JobCompletionStatus,
  eventPayload?: Record<string, unknown>,
): Promise<void> => {
  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status,
      completedAt: new Date(),
      auditEvents: {
        create: {
          eventType: 'upload_processing_completed',
          eventPayload: {
            searchJobId,
            status,
            ...(eventPayload ?? {}),
          },
        },
      },
    },
  });
};

const markUploadJobFailed = async (
  searchJobId: string,
  failureCode: WarningCode,
  failureMessage: string,
): Promise<void> => {
  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status: JobStatus.FAILED,
      failureCode,
      failureMessage,
      failedAt: new Date(),
      completedAt: new Date(),
      auditEvents: {
        create: {
          eventType: 'upload_processing_failed',
          eventPayload: {
            searchJobId,
            failureCode,
            failureMessage,
          },
        },
      },
    },
  });
};

const markCsvOutputReady = async (
  searchJobId: string,
): Promise<void> => {
  const existingOutput = await prisma.jobOutput.findFirst({
    where: {
      jobId: searchJobId,
      outputType: 'csv',
    },
    select: {
      id: true,
    },
  });

  if (existingOutput) {
    await prisma.jobOutput.update({
      where: { id: existingOutput.id },
      data: {
        mimeType: 'text/csv; charset=utf-8',
        isDownloadable: true,
      },
    });
    return;
  }

  await prisma.jobOutput.create({
    data: {
      jobId: searchJobId,
      outputType: 'csv',
      mimeType: 'text/csv; charset=utf-8',
      isDownloadable: true,
    },
  });
};

const buildParsedUploadedDocument = async (
  uploadedDocument: {
    id: string;
    originalFilename: string;
    mimeType: string;
    localTempPath: string;
    createdAt: Date;
  },
): Promise<ParsedDocument> => {
  if (uploadedDocument.localTempPath.startsWith('pending://')) {
    throw new Error(
      'Uploaded document bytes are not available yet for processing.',
    );
  }

  const fileBytes = await readFile(uploadedDocument.localTempPath);

  return parsePdfBuffer(fileBytes, {
    documentId: uploadedDocument.id,
    title: uploadedDocument.originalFilename,
    sourceName: 'User Upload',
    sourceType: 'upload',
    sourceCountry: null,
    sourceUrl: null,
    publishedAt: uploadedDocument.createdAt.toISOString(),
  });
};

const processUploadedDocument = async (
  searchJobId: string,
  uploadedDocument: {
    id: string;
    originalFilename: string;
    mimeType: string;
    localTempPath: string;
    createdAt: Date;
  },
): Promise<boolean> => {
  try {
    const parsedDocument = await buildParsedUploadedDocument(uploadedDocument);
    const extractionResult = await extractFieldsFromParsedDocument(parsedDocument);

    await prisma.$transaction([
      prisma.uploadedDocument.update({
        where: { id: uploadedDocument.id },
        data: {
          parseStatus: ParseStatus.PARSED,
          warningCode: null,
          warningMessage: null,
        },
      }),
      prisma.fieldExtraction.createMany({
        data: extractionResult.fields.map((field) => {
          const primaryEvidence = field.evidence[0];

          return {
            jobId: searchJobId,
            uploadedDocumentId: uploadedDocument.id,
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            value: field.value,
            confidence: field.confidence,
            warningCode: field.warningCodes[0] ?? null,
            sourcePage: primaryEvidence?.sourcePage ?? null,
            evidenceSnippet: primaryEvidence?.snippet ?? null,
          };
        }),
      }),
      prisma.auditEvent.create({
        data: {
          jobId: searchJobId,
          eventType: 'uploaded_document_processed',
          eventPayload: {
            searchJobId,
            uploadedDocumentId: uploadedDocument.id,
            fieldCount: extractionResult.fields.length,
          },
        },
      }),
    ]);

    return extractionResult.fields.length > 0;
  } catch (error) {
    const warningMessage =
      error instanceof Error ? error.message : 'Unknown upload processing error.';

    await prisma.$transaction([
      prisma.uploadedDocument.update({
        where: { id: uploadedDocument.id },
        data: {
          parseStatus: ParseStatus.FAILED,
          warningCode: WarningCode.UPLOAD_PARSE_FAILED,
          warningMessage,
        },
      }),
      prisma.auditEvent.create({
        data: {
          jobId: searchJobId,
          eventType: 'uploaded_document_failed',
          eventPayload: {
            searchJobId,
            uploadedDocumentId: uploadedDocument.id,
            warningCode: WarningCode.UPLOAD_PARSE_FAILED,
            warningMessage,
          },
        },
      }),
    ]);

    return false;
  }
};

export const processUploadJob = async (
  job: Job<ProcessUploadJobData>,
): Promise<void> => {
  const searchJobId = job.data.searchJobId;

  const searchJob = await prisma.searchJob.findUnique({
    where: { id: searchJobId },
    select: {
      id: true,
      uploadedDocuments: {
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        select: {
          id: true,
          originalFilename: true,
          mimeType: true,
          localTempPath: true,
          createdAt: true,
        },
      },
    },
  });

  if (!searchJob) {
    throw new Error(`SearchJob ${searchJobId} was not found.`);
  }

  try {
    await markUploadJobStarted(searchJobId);

    let successfulUploadCount = 0;

    for (const uploadedDocument of searchJob.uploadedDocuments) {
      const processed = await processUploadedDocument(
        searchJobId,
        uploadedDocument,
      );

      if (processed) {
        successfulUploadCount += 1;
      }
    }

    if (successfulUploadCount > 0) {
      await markCsvOutputReady(searchJobId);
    }

    await markUploadJobCompleted(
      searchJobId,
      successfulUploadCount > 0 ? JobStatus.COMPLETED : JobStatus.PARTIAL,
      {
        successfulUploadCount,
        uploadedDocumentCount: searchJob.uploadedDocuments.length,
      },
    );
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : 'Unknown upload worker failure.';

    await markUploadJobFailed(
      searchJobId,
      WarningCode.UPLOAD_PARSE_FAILED,
      failureMessage,
    );

    throw error;
  }
};
