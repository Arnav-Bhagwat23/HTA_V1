import { NextRequest, NextResponse } from 'next/server';

import type { JobState } from '@hta/shared';
import { getAuthenticatedUser } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

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

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  const { jobId } = await context.params;

  try {
    const job = await prisma.searchJob.findFirst({
      where: {
        id: jobId,
        userId: auth.userId,
      },
      select: {
        id: true,
        status: true,
        mode: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const response: JobState = {
      jobId: job.id,
      status: jobStatusToApiStatus[job.status],
      mode: jobModeToApiMode[job.mode],
      timestamps: {
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        startedAt: job.startedAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch search job status.', error);

    return NextResponse.json(
      { error: 'Failed to fetch search job status.' },
      { status: 500 },
    );
  }
}
