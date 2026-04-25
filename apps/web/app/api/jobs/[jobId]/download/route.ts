import { readFile } from 'node:fs/promises';

import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

const CSV_COLUMNS = [
  'fieldName',
  'fieldLabel',
  'value',
  'confidence',
  'warningCode',
  'documentId',
  'documentTitle',
  'documentUrl',
  'publishedAt',
  'sourcePage',
  'evidenceSnippet',
] as const;

const escapeCsvCell = (value: string | number | null): string => {
  if (value === null) {
    return '';
  }

  const stringValue = String(value);

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
};

const buildCsv = (
  fields: Array<{
    fieldName: string;
    fieldLabel: string;
    value: string | null;
    confidence: number | null;
    warningCode: string | null;
    sourcePage: string | null;
    evidenceSnippet: string | null;
    documentConsidered: {
      id: string;
      documentTitle: string;
      documentUrl: string | null;
      publishedAt: Date | null;
    } | null;
    uploadedDocument: {
      id: string;
      originalFilename: string;
      createdAt: Date;
    } | null;
  }>,
): string => {
  const header = CSV_COLUMNS.join(',');

  const rows = fields.map((field) => {
    const documentId =
      field.documentConsidered?.id ??
      field.uploadedDocument?.id ??
      null;
    const documentTitle =
      field.documentConsidered?.documentTitle ??
      field.uploadedDocument?.originalFilename ??
      null;
    const documentUrl = field.documentConsidered?.documentUrl ?? null;
    const publishedAt =
      field.documentConsidered?.publishedAt?.toISOString() ??
      field.uploadedDocument?.createdAt.toISOString() ??
      null;
    const warningCode = field.warningCode ? field.warningCode : null;

    const values = [
      field.fieldName,
      field.fieldLabel,
      field.value,
      field.confidence,
      warningCode,
      documentId,
      documentTitle,
      documentUrl,
      publishedAt,
      field.sourcePage,
      field.evidenceSnippet,
    ];

    return values.map(escapeCsvCell).join(',');
  });

  return [header, ...rows].join('\n');
};

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

const WORKBOOK_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  const { jobId } = await context.params;
  const requestedFormat = request.nextUrl.searchParams.get('format');
  const format = requestedFormat === 'csv' ? 'csv' : requestedFormat === 'xlsx' || requestedFormat === null
    ? 'xlsx'
    : null;

  if (!format) {
    return NextResponse.json(
      { error: 'Unsupported download format.' },
      { status: 400 },
    );
  }

  try {
    const job = await prisma.searchJob.findFirst({
      where: {
        id: jobId,
        userId: auth.userId,
      },
      select: {
        id: true,
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
            outputType: true,
            storagePath: true,
            mimeType: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    if (format === 'xlsx') {
      const workbookOutput = job.jobOutputs.find(
        (jobOutput) => jobOutput.outputType === 'xlsx',
      );

      if (!workbookOutput?.storagePath) {
        return NextResponse.json(
          { error: 'Download is not ready yet.' },
          { status: 409 },
        );
      }

      const workbookBytes = await readFile(workbookOutput.storagePath);

      await prisma.auditEvent.create({
        data: {
          userId: auth.userId,
          jobId: job.id,
          eventType: 'xlsx_downloaded',
          eventPayload: {
            outputType: 'xlsx',
            storagePath: workbookOutput.storagePath,
          },
        },
      });

      return new NextResponse(workbookBytes, {
        status: 200,
        headers: {
          'Content-Type': workbookOutput.mimeType ?? WORKBOOK_MIME_TYPE,
          'Content-Disposition': `attachment; filename="job-${job.id}.xlsx"`,
        },
      });
    }

    const csvOutput = job.jobOutputs.find(
      (jobOutput) => jobOutput.outputType === 'csv',
    );

    if (!csvOutput) {
      return NextResponse.json(
        { error: 'Download is not ready yet.' },
        { status: 409 },
      );
    }

    const csv = buildCsv(job.fieldExtractions);

    await prisma.auditEvent.create({
      data: {
        userId: auth.userId,
        jobId: job.id,
        eventType: 'csv_downloaded',
        eventPayload: {
          outputType: 'csv',
          fieldCount: job.fieldExtractions.length,
        },
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="job-${job.id}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to download job CSV.', error);

    return NextResponse.json(
      { error: 'Failed to download job CSV.' },
      { status: 500 },
    );
  }
}
