import { JobMode, JobStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import type { SearchResponse } from '../../../../../packages/shared/src';
import { searchRequestSchema } from '../../../../../packages/shared/src';
import { getAuthenticatedUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

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

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Failed to create search job.', error);

    return NextResponse.json(
      { error: 'Failed to create search job.' },
      { status: 500 },
    );
  }
}
