import { JobMode, JobStatus, WarningCode } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import type { SearchResponse } from '@hta/shared';
import { searchRequestSchema } from '@hta/shared';
import { getAuthenticatedUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { searchJobsQueue } from '../../../lib/queues/search-jobs';

const jobStatusToApiStatus = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

const jobModeToApiMode = {
  AUTOMATIC: 'automatic',
  MANUAL_UPLOAD: 'manual_upload',
} as const;

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = searchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid search request.',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const job = await prisma.searchJob.create({
      data: {
        userId: auth.userId,
        rawQuery: parsed.data.query,
        mode: JobMode.AUTOMATIC,
        status: JobStatus.QUEUED,
        canonicalDrug: null,
        canonicalIndication: null,
        canonicalGeography: null,
        requiresManualUpload: false,
        auditEvents: {
          create: {
            userId: auth.userId,
            eventType: 'job_created',
            eventPayload: {
              sessionId: auth.sessionId,
              mode: JobMode.AUTOMATIC,
              rawQuery: parsed.data.query,
            },
          },
        },
      },
      select: {
        id: true,
        status: true,
        mode: true,
      },
    });

    const response: SearchResponse = {
      jobId: job.id,
      status: jobStatusToApiStatus[job.status],
      mode: jobModeToApiMode[job.mode],
      normalizedQuery: null,
    };

    try {
      await searchJobsQueue.add(
        `search-job:${job.id}`,
        {
          searchJobId: job.id,
        },
        {
          jobId: job.id,
        },
      );
    } catch (error) {
      await prisma.searchJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          failureCode: WarningCode.UNKNOWN_ERROR,
          failureMessage: 'Failed to enqueue search job.',
          failedAt: new Date(),
          completedAt: new Date(),
          auditEvents: {
            create: {
              userId: auth.userId,
              eventType: 'job_failed',
              eventPayload: {
                searchJobId: job.id,
                failureCode: WarningCode.UNKNOWN_ERROR,
                failureMessage: 'Failed to enqueue search job.',
                stage: 'enqueue',
              },
            },
          },
        },
      });

      console.error('Failed to enqueue search job.', error);

      return NextResponse.json(
        { error: 'Failed to create search job.' },
        { status: 500 },
      );
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Failed to create search job.', error);

    return NextResponse.json(
      { error: 'Failed to create search job.' },
      { status: 500 },
    );
  }
}
