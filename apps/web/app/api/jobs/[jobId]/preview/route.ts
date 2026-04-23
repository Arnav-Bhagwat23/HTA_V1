import { NextRequest, NextResponse } from 'next/server';

import type { PreviewResponse } from '../../../../../../../packages/shared/src';
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
        failureCode: true,
        fieldExtractions: {
          orderBy: [
            { fieldName: 'asc' },
            { createdAt: 'asc' },
          ],
          select: {
            fieldName: true,
            fieldLabel: true,
            value: true,
            confidence: true,
            warningCode: true,
            sourcePage: true,
            evidenceSnippet: true,
            documentConsidered: {
              select: {
                id: true,
                documentTitle: true,
                documentUrl: true,
                publishedAt: true,
              },
            },
            uploadedDocument: {
              select: {
                id: true,
                originalFilename: true,
                createdAt: true,
              },
            },
          },
        },
        jobOutputs: {
          where: {
            isDownloadable: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const warnings = new Set<string>();

    if (job.failureCode) {
      warnings.add(job.failureCode);
    }

    const fields = job.fieldExtractions.map((field) => {
      const fieldWarningCodes = field.warningCode ? [field.warningCode] : [];

      for (const warningCode of fieldWarningCodes) {
        warnings.add(warningCode);
      }

      const evidence =
        field.documentConsidered
          ? [
              {
                documentId: field.documentConsidered.id,
                documentTitle: field.documentConsidered.documentTitle,
                documentUrl: field.documentConsidered.documentUrl,
                sourcePage: field.sourcePage,
                snippet: field.evidenceSnippet,
                publishedAt:
                  field.documentConsidered.publishedAt?.toISOString() ?? null,
              },
            ]
          : field.uploadedDocument
            ? [
                {
                  documentId: field.uploadedDocument.id,
                  documentTitle: field.uploadedDocument.originalFilename,
                  documentUrl: null,
                  sourcePage: field.sourcePage,
                  snippet: field.evidenceSnippet,
                  publishedAt: field.uploadedDocument.createdAt.toISOString(),
                },
              ]
            : [];

      return {
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        value: field.value,
        confidence: field.confidence,
        warningCodes: fieldWarningCodes,
        evidence,
      };
    });

    const response: PreviewResponse = {
      jobId: job.id,
      status: jobStatusToApiStatus[job.status],
      mode: jobModeToApiMode[job.mode],
      fields,
      warnings: [...warnings] as PreviewResponse['warnings'],
      downloadable: job.jobOutputs.length > 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch job preview.', error);

    return NextResponse.json(
      { error: 'Failed to fetch job preview.' },
      { status: 500 },
    );
  }
}
