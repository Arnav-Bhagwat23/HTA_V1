import { randomUUID } from 'node:crypto';

import {
  JobMode,
  JobStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/hta_v1';

process.env.DATABASE_URL = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
process.env.PBAC_RETRIEVAL_MODE = 'fixture';
process.env.NICE_RETRIEVAL_MODE = 'fixture';
process.env.GBA_RETRIEVAL_MODE = 'fixture';
process.env.HAS_RETRIEVAL_MODE = 'fixture';
process.env.PDF_PARSER_MODE = 'mock';

const prisma = new PrismaClient();

let processSearchJob: typeof import('./process-search.job').processSearchJob;

beforeAll(async () => {
  ({ processSearchJob } = await import('./process-search.job'));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('processSearchJob AU fixture path', () => {
  it('persists a selected document, HTA decision, and downloadable CSV output', async () => {
    const email = `worker-au-${randomUUID()}@hta.local`;
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
          rawQuery: 'Mock drug general indication Australia',
          mode: JobMode.AUTOMATIC,
          status: JobStatus.QUEUED,
        },
        select: {
          id: true,
        },
      });

      await processSearchJob({ data: { searchJobId: job.id } } as never);

      const completedJob = await prisma.searchJob.findUnique({
        where: { id: job.id },
        select: {
          status: true,
          canonicalGeography: true,
          requiresManualUpload: true,
          jobSources: {
            select: {
              sourceKey: true,
              status: true,
            },
          },
          documentsConsidered: {
            select: {
              isSelected: true,
              documentTitle: true,
              documentUrl: true,
            },
          },
          fieldExtractions: {
            orderBy: [
              { fieldName: 'asc' },
              { createdAt: 'asc' },
            ],
            select: {
              fieldName: true,
              value: true,
              sourcePage: true,
              evidenceSnippet: true,
            },
          },
          jobOutputs: {
            where: { isDownloadable: true },
            select: {
              outputType: true,
              isDownloadable: true,
            },
          },
        },
      });

      expect(completedJob).not.toBeNull();
      expect(completedJob?.status).toBe(JobStatus.COMPLETED);
      expect(completedJob?.canonicalGeography).toBe('AU');
      expect(completedJob?.requiresManualUpload).toBe(false);
      expect(completedJob?.jobSources).toEqual([
        {
          sourceKey: 'pbac',
          status: 'COMPLETED',
        },
      ]);
      expect(completedJob?.documentsConsidered).toHaveLength(1);
      expect(completedJob?.documentsConsidered[0]).toMatchObject({
        isSelected: true,
        documentTitle: 'PBAC Public Summary Document - Mock drug - general indication',
      });
      expect(completedJob?.documentsConsidered[0].documentUrl).toContain(
        'mock-pbac-public-summary-document',
      );
      expect(completedJob?.fieldExtractions.map((field) => field.fieldName)).toEqual([
        'document_text_available',
        'hta_decision',
        'source_document_title',
      ]);
      expect(completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision'))
        .toMatchObject({
          value: 'Recommended',
          sourcePage: '1',
        });
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision')
          ?.evidenceSnippet,
      ).toContain('recommended for listing');
      expect(completedJob?.jobOutputs).toEqual([
        {
          outputType: 'csv',
          isDownloadable: true,
        },
      ]);
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});

describe('processSearchJob UK fixture path', () => {
  it('persists a selected document, HTA decision, and downloadable CSV output', async () => {
    const email = `worker-uk-${randomUUID()}@hta.local`;
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
          rawQuery: 'Mock drug general indication United Kingdom',
          mode: JobMode.AUTOMATIC,
          status: JobStatus.QUEUED,
        },
        select: {
          id: true,
        },
      });

      await processSearchJob({ data: { searchJobId: job.id } } as never);

      const completedJob = await prisma.searchJob.findUnique({
        where: { id: job.id },
        select: {
          status: true,
          canonicalGeography: true,
          requiresManualUpload: true,
          jobSources: {
            select: {
              sourceKey: true,
              status: true,
            },
          },
          documentsConsidered: {
            select: {
              isSelected: true,
              documentTitle: true,
              documentUrl: true,
            },
          },
          fieldExtractions: {
            orderBy: [
              { fieldName: 'asc' },
              { createdAt: 'asc' },
            ],
            select: {
              fieldName: true,
              value: true,
              sourcePage: true,
              evidenceSnippet: true,
            },
          },
          jobOutputs: {
            where: { isDownloadable: true },
            select: {
              outputType: true,
              isDownloadable: true,
            },
          },
        },
      });

      expect(completedJob).not.toBeNull();
      expect(completedJob?.status).toBe(JobStatus.COMPLETED);
      expect(completedJob?.canonicalGeography).toBe('UK');
      expect(completedJob?.requiresManualUpload).toBe(false);
      expect(completedJob?.jobSources).toEqual([
        {
          sourceKey: 'nice',
          status: 'COMPLETED',
        },
      ]);
      expect(completedJob?.documentsConsidered).toHaveLength(1);
      expect(completedJob?.documentsConsidered[0]).toMatchObject({
        isSelected: true,
        documentTitle: 'NICE Final Draft Guidance - Mock drug - general indication',
      });
      expect(completedJob?.documentsConsidered[0].documentUrl).toContain(
        'final-draft-guidance.pdf',
      );
      expect(completedJob?.fieldExtractions.map((field) => field.fieldName)).toEqual([
        'document_text_available',
        'hta_decision',
        'source_document_title',
      ]);
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision'),
      ).toMatchObject({
        value: 'Recommended',
        sourcePage: '1',
      });
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision')
          ?.evidenceSnippet,
      ).toContain('recommended for listing');
      expect(completedJob?.jobOutputs).toEqual([
        {
          outputType: 'csv',
          isDownloadable: true,
        },
      ]);
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});

describe('processSearchJob DE fixture path', () => {
  it('persists a selected document, HTA decision, and downloadable CSV output', async () => {
    const email = `worker-de-${randomUUID()}@hta.local`;
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
          rawQuery: 'Mock drug general indication Germany',
          mode: JobMode.AUTOMATIC,
          status: JobStatus.QUEUED,
        },
        select: {
          id: true,
        },
      });

      await processSearchJob({ data: { searchJobId: job.id } } as never);

      const completedJob = await prisma.searchJob.findUnique({
        where: { id: job.id },
        select: {
          status: true,
          canonicalGeography: true,
          requiresManualUpload: true,
          jobSources: {
            select: {
              sourceKey: true,
              status: true,
            },
          },
          documentsConsidered: {
            select: {
              isSelected: true,
              documentTitle: true,
              documentUrl: true,
            },
          },
          fieldExtractions: {
            orderBy: [
              { fieldName: 'asc' },
              { createdAt: 'asc' },
            ],
            select: {
              fieldName: true,
              value: true,
              sourcePage: true,
              evidenceSnippet: true,
            },
          },
          jobOutputs: {
            where: { isDownloadable: true },
            select: {
              outputType: true,
              isDownloadable: true,
            },
          },
        },
      });

      expect(completedJob).not.toBeNull();
      expect(completedJob?.status).toBe(JobStatus.COMPLETED);
      expect(completedJob?.canonicalGeography).toBe('DE');
      expect(completedJob?.requiresManualUpload).toBe(false);
      expect(completedJob?.jobSources).toEqual([
        {
          sourceKey: 'gba',
          status: 'COMPLETED',
        },
      ]);
      expect(completedJob?.documentsConsidered).toHaveLength(1);
      expect(completedJob?.documentsConsidered[0]).toMatchObject({
        isSelected: true,
        documentTitle: 'G-BA Beschluss - Mock drug - general indication',
      });
      expect(completedJob?.documentsConsidered[0].documentUrl).toContain(
        'g-ba-beschluss-mock-drug-general-indication.pdf',
      );
      expect(completedJob?.fieldExtractions.map((field) => field.fieldName)).toEqual([
        'document_text_available',
        'hta_decision',
        'source_document_title',
      ]);
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision'),
      ).toMatchObject({
        value: 'Recommended',
        sourcePage: '1',
      });
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision')
          ?.evidenceSnippet,
      ).toContain('recommended for listing');
      expect(completedJob?.jobOutputs).toEqual([
        {
          outputType: 'csv',
          isDownloadable: true,
        },
      ]);
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});

describe('processSearchJob FR fixture path', () => {
  it('persists a selected document, HTA decision, and downloadable CSV output', async () => {
    const email = `worker-fr-${randomUUID()}@hta.local`;
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
          rawQuery: 'Mock drug general indication France',
          mode: JobMode.AUTOMATIC,
          status: JobStatus.QUEUED,
        },
        select: {
          id: true,
        },
      });

      await processSearchJob({ data: { searchJobId: job.id } } as never);

      const completedJob = await prisma.searchJob.findUnique({
        where: { id: job.id },
        select: {
          status: true,
          canonicalGeography: true,
          requiresManualUpload: true,
          jobSources: {
            select: {
              sourceKey: true,
              status: true,
            },
          },
          documentsConsidered: {
            select: {
              isSelected: true,
              documentTitle: true,
              documentUrl: true,
            },
          },
          fieldExtractions: {
            orderBy: [
              { fieldName: 'asc' },
              { createdAt: 'asc' },
            ],
            select: {
              fieldName: true,
              value: true,
              sourcePage: true,
              evidenceSnippet: true,
            },
          },
          jobOutputs: {
            where: { isDownloadable: true },
            select: {
              outputType: true,
              isDownloadable: true,
            },
          },
        },
      });

      expect(completedJob).not.toBeNull();
      expect(completedJob?.status).toBe(JobStatus.COMPLETED);
      expect(completedJob?.canonicalGeography).toBe('FR');
      expect(completedJob?.requiresManualUpload).toBe(false);
      expect(completedJob?.jobSources).toEqual([
        {
          sourceKey: 'has',
          status: 'COMPLETED',
        },
      ]);
      expect(completedJob?.documentsConsidered).toHaveLength(1);
      expect(completedJob?.documentsConsidered[0]).toMatchObject({
        isSelected: true,
        documentTitle: 'HAS Decision - Mock drug - general indication',
      });
      expect(completedJob?.documentsConsidered[0].documentUrl).toContain(
        'decision-has.pdf',
      );
      expect(completedJob?.fieldExtractions.map((field) => field.fieldName)).toEqual([
        'document_text_available',
        'hta_decision',
        'source_document_title',
      ]);
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision'),
      ).toMatchObject({
        value: 'Recommended',
        sourcePage: '1',
      });
      expect(
        completedJob?.fieldExtractions.find((field) => field.fieldName === 'hta_decision')
          ?.evidenceSnippet,
      ).toContain('recommended for listing');
      expect(completedJob?.jobOutputs).toEqual([
        {
          outputType: 'csv',
          isDownloadable: true,
        },
      ]);
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});
