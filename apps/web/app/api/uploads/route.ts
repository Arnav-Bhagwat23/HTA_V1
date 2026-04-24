import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { JobMode } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { uploadRequestSchema } from '@hta/shared';
import { getAuthenticatedUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

const MAX_UPLOAD_FILES = 10;
const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), '.local', 'uploads');

interface UploadFileInput {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  fileBytes?: Uint8Array;
}

const sanitizeFilename = (filename: string): string =>
  filename
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128) || 'upload.bin';

const buildPendingMetadataPath = (
  jobId: string,
  filename: string,
): string =>
  `pending://upload/${jobId}/${sanitizeFilename(filename)}`;

const persistMultipartUpload = async (
  jobId: string,
  file: UploadFileInput,
): Promise<string> => {
  const uploadDirectory = path.join(LOCAL_UPLOAD_ROOT, jobId);
  await mkdir(uploadDirectory, { recursive: true });

  const storedFilename = `${randomUUID()}-${sanitizeFilename(file.originalFilename)}`;
  const storedPath = path.join(uploadDirectory, storedFilename);

  await writeFile(storedPath, Buffer.from(file.fileBytes ?? new Uint8Array()));

  return storedPath;
};

const parseMultipartRequest = async (
  request: NextRequest,
): Promise<{
  jobId: string;
  files: UploadFileInput[];
}> => {
  const formData = await request.formData();
  const jobIdValue = formData.get('jobId');

  if (typeof jobIdValue !== 'string' || jobIdValue.trim().length === 0) {
    throw new Error('Multipart uploads require a jobId field.');
  }

  const files = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    throw new Error('Multipart uploads require at least one file.');
  }

  if (files.length > MAX_UPLOAD_FILES) {
    throw new Error(`Multipart uploads support at most ${MAX_UPLOAD_FILES} files.`);
  }

  const parsedFiles = await Promise.all(
    files.map(async (file) => ({
      originalFilename: file.name.trim(),
      mimeType: file.type.trim() || 'application/octet-stream',
      sizeBytes: file.size,
      fileBytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );

  const parsed = uploadRequestSchema.safeParse({
    jobId: jobIdValue.trim(),
    files: parsedFiles.map((file) => ({
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })),
  });

  if (!parsed.success) {
    throw new Error('Invalid multipart upload request.');
  }

  return {
    jobId: parsed.data.jobId,
    files: parsedFiles,
  };
};

const parseJsonRequest = async (
  request: NextRequest,
): Promise<{
  jobId: string;
  files: UploadFileInput[];
}> => {
  const body = await request.json().catch(() => null);
  const parsed = uploadRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new Error('Invalid upload request.');
  }

  return {
    jobId: parsed.data.jobId,
    files: parsed.data.files.map((file) => ({
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })),
  };
};

const parseUploadRequest = async (
  request: NextRequest,
): Promise<{
  jobId: string;
  files: UploadFileInput[];
}> => {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('multipart/form-data')) {
    return parseMultipartRequest(request);
  }

  return parseJsonRequest(request);
};

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  let parsedRequest: {
    jobId: string;
    files: UploadFileInput[];
  };

  try {
    parsedRequest = await parseUploadRequest(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid upload request.';

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }

  try {
    const job = await prisma.searchJob.findFirst({
      where: {
        id: parsedRequest.jobId,
        userId: auth.userId,
      },
      select: {
        id: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const uploadedDocumentIds: string[] = [];

    await prisma.$transaction(async (transaction) => {
      const createdDocuments = await Promise.all(
        parsedRequest.files.map(async (file) => {
          const localTempPath =
            file.fileBytes
              ? await persistMultipartUpload(job.id, file)
              : buildPendingMetadataPath(job.id, file.originalFilename);

          return transaction.uploadedDocument.create({
            data: {
              jobId: job.id,
              originalFilename: file.originalFilename,
              mimeType: file.mimeType,
              localTempPath,
              uploadSize: file.sizeBytes,
            },
            select: {
              id: true,
            },
          });
        }),
      );

      uploadedDocumentIds.push(...createdDocuments.map((document) => document.id));

      await transaction.searchJob.update({
        where: { id: job.id },
        data: {
          mode: JobMode.MANUAL_UPLOAD,
          requiresManualUpload: true,
          auditEvents: {
            create: {
              userId: auth.userId,
              eventType: 'uploads_attached',
              eventPayload: {
                searchJobId: job.id,
                uploadedDocumentIds,
                fileCount: uploadedDocumentIds.length,
                uploadMode:
                  parsedRequest.files.some((file) => file.fileBytes)
                    ? 'multipart'
                    : 'metadata',
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        jobId: job.id,
        uploadedDocumentIds,
        status: 'pending',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create uploaded documents.', error);

    return NextResponse.json(
      { error: 'Failed to create uploaded documents.' },
      { status: 500 },
    );
  }
}
