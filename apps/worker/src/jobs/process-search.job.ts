import { JobSourceStatus, JobStatus, ParseStatus, SourceType, WarningCode } from '@prisma/client';
import type { NormalizedQuery, SourceType as SharedSourceType } from '@hta/shared';
import { Job } from 'bullmq';

import { getAdapterBySourceKey } from '../adapters/registry';
import { prisma } from '../lib/prisma';
import { normalizeQuery } from '../normalizer/normalize-query';
import { routeSourcePlans } from '../routing/source-router';

export interface ProcessSearchJobData {
  searchJobId: string;
}

type JobCompletionStatus = 'COMPLETED' | 'PARTIAL';

const sharedSourceTypeToPrismaSourceType = (
  sourceType: SharedSourceType,
): SourceType => {
  switch (sourceType) {
    case 'pdf':
      return SourceType.PDF;
    case 'html':
      return SourceType.HTML;
    case 'upload':
      return SourceType.UPLOAD;
  }
};

const markJobStarted = async (searchJobId: string): Promise<void> => {
  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      auditEvents: {
        create: {
          eventType: 'job_started',
          eventPayload: {
            searchJobId,
          },
        },
      },
    },
  });
};

const markJobCompleted = async (
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
          eventType: 'job_completed',
          eventPayload: {
            searchJobId,
            status,
            stage: 'normalized',
            ...(eventPayload ?? {}),
          },
        },
      },
    },
  });
};

const createJobSources = async (
  searchJobId: string,
  normalizedQuery: NormalizedQuery,
): Promise<void> => {
  const sourcePlans = routeSourcePlans(normalizedQuery.canonicalGeography);

  if (sourcePlans.length === 0) {
    return;
  }

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      jobSources: {
        create: sourcePlans.map((source) => ({
          sourceKey: source.sourceKey,
          sourceLabel: source.sourceLabel,
          sourceCountry: source.sourceCountry,
          sourceType: source.sourceType,
        })),
      },
      auditEvents: {
        create: {
          eventType: 'source_routed',
          eventPayload: {
            searchJobId,
            canonicalGeography: normalizedQuery.canonicalGeography,
            sourceKeys: sourcePlans.map((source) => source.sourceKey),
          },
        },
      },
    },
  });
};

const markJobSourceSkipped = async (
  jobSourceId: string,
  errorMessage: string,
): Promise<void> => {
  await prisma.jobSource.update({
    where: { id: jobSourceId },
    data: {
      status: JobSourceStatus.SKIPPED,
      errorMessage,
      completedAt: new Date(),
    },
  });
};

const markJobSourceCompleted = async (
  jobSourceId: string,
): Promise<void> => {
  await prisma.jobSource.update({
    where: { id: jobSourceId },
    data: {
      status: JobSourceStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
};

const markJobSourceNoResult = async (
  jobSourceId: string,
): Promise<void> => {
  await prisma.jobSource.update({
    where: { id: jobSourceId },
    data: {
      status: JobSourceStatus.COMPLETED,
      errorCode: WarningCode.NO_RESULT_FOUND,
      errorMessage: 'No relevant document was found for this source.',
      completedAt: new Date(),
    },
  });
};

const executeRoutedSources = async (
  searchJobId: string,
  normalizedQuery: NormalizedQuery,
): Promise<boolean> => {
  const jobSources = await prisma.jobSource.findMany({
    where: { jobId: searchJobId },
    orderBy: [
      { createdAt: 'asc' },
      { sourceKey: 'asc' },
    ],
  });

  let hasSelectedDocument = false;

  for (const jobSource of jobSources) {
    const adapter = getAdapterBySourceKey(jobSource.sourceKey);

    if (!adapter) {
      await markJobSourceSkipped(
        jobSource.id,
        `No adapter is registered for source "${jobSource.sourceKey}".`,
      );
      continue;
    }

    await prisma.jobSource.update({
      where: { id: jobSource.id },
      data: {
        status: JobSourceStatus.RUNNING,
        startedAt: jobSource.startedAt ?? new Date(),
        searchedAt: new Date(),
      },
    });

    const selectedDocument = await adapter.searchLatestRelevantDocument(
      normalizedQuery,
    );

    if (!selectedDocument) {
      await markJobSourceNoResult(jobSource.id);
      continue;
    }

    await prisma.documentConsidered.create({
      data: {
        jobId: searchJobId,
        jobSourceId: jobSource.id,
        documentTitle: selectedDocument.title,
        documentUrl: selectedDocument.sourceUrl,
        sourceType: sharedSourceTypeToPrismaSourceType(selectedDocument.sourceType),
        sourceCountry: selectedDocument.sourceCountry,
        publishedAt: selectedDocument.publishedAt
          ? new Date(selectedDocument.publishedAt)
          : null,
        isSelected: true,
        selectionRank: 1,
        parseStatus: ParseStatus.PENDING,
      },
    });

    await markJobSourceCompleted(jobSource.id);
    hasSelectedDocument = true;
  }

  return hasSelectedDocument;
};

const persistNormalizedQuery = async (
  searchJobId: string,
  normalizedQuery: NormalizedQuery,
): Promise<void> => {
  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      rawQuery: normalizedQuery.rawQuery,
      canonicalDrug: normalizedQuery.canonicalDrug,
      canonicalIndication: normalizedQuery.canonicalIndication,
      canonicalGeography:
        normalizedQuery.canonicalGeography
          ? normalizedQuery.canonicalGeography
          : null,
      requiresManualUpload: normalizedQuery.requiresManualUpload,
    },
  });
};

const markJobFailed = async (
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
          eventType: 'job_failed',
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

export const processSearchJob = async (
  job: Job<ProcessSearchJobData>,
): Promise<void> => {
  const searchJobId = job.data.searchJobId;

  const searchJob = await prisma.searchJob.findUnique({
    where: { id: searchJobId },
    select: {
      id: true,
      rawQuery: true,
      status: true,
    },
  });

  if (!searchJob) {
    throw new Error(`SearchJob ${searchJobId} was not found.`);
  }

  try {
    await markJobStarted(searchJobId);

    const normalizedQuery = normalizeQuery(searchJob.rawQuery ?? '');

    await persistNormalizedQuery(searchJobId, normalizedQuery);

    if (normalizedQuery.rawQuery.length === 0) {
      await markJobCompleted(searchJobId, JobStatus.PARTIAL);
      return;
    }

    if (normalizedQuery.requiresManualUpload) {
      await markJobCompleted(searchJobId, JobStatus.PARTIAL, {
        warningCode: WarningCode.MANUAL_UPLOAD_REQUIRED,
        warningMessage: 'Manual upload is required for the detected geography.',
      });
      return;
    }

    await createJobSources(searchJobId, normalizedQuery);

    const hasSelectedDocument = await executeRoutedSources(
      searchJobId,
      normalizedQuery,
    );

    await markJobCompleted(
      searchJobId,
      hasSelectedDocument ? JobStatus.COMPLETED : JobStatus.PARTIAL,
      {
        hasSelectedDocument,
      },
    );
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : 'Unknown worker failure.';

    await markJobFailed(
      searchJobId,
      WarningCode.UNKNOWN_ERROR,
      failureMessage,
    );

    throw error;
  }
};
