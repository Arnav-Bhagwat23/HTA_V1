import { JobStatus, WarningCode } from '@prisma/client';
import type { NormalizedQuery } from '@hta/shared';
import { Job } from 'bullmq';

import { prisma } from '../lib/prisma';
import { normalizeQuery } from '../normalizer/normalize-query';

export interface ProcessSearchJobData {
  searchJobId: string;
}

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
  status: JobStatus.COMPLETED | JobStatus.PARTIAL,
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
          },
        },
      },
    },
  });
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

    await markJobCompleted(searchJobId, JobStatus.COMPLETED);
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
