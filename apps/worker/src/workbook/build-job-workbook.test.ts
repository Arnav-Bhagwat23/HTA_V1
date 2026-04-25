import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import ExcelJS from 'exceljs';
import { JobMode, JobStatus, PrismaClient, UserRole } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

import { buildJobWorkbook } from './build-job-workbook';

const prisma = new PrismaClient();

describe('buildJobWorkbook', () => {
  it('writes an xlsx file for one job with one HTA Results row', async () => {
    const email = `workbook-${randomUUID()}@hta.local`;
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
          status: JobStatus.COMPLETED,
          canonicalDrug: 'Mock drug',
          canonicalIndication: 'General indication',
          canonicalGeography: 'AU',
          fieldExtractions: {
            create: [
              {
                fieldName: 'document_text_available',
                fieldLabel: 'Document Text Available',
                value: 'Yes',
                confidence: 1,
                sourcePage: '1',
                evidenceSnippet: 'Mock parsed PDF text for the selected document.',
              },
              {
                fieldName: 'hta_decision',
                fieldLabel: 'HTA Decision',
                value: 'Recommended',
                confidence: 0.7,
                sourcePage: '1',
                evidenceSnippet: 'The medicine is recommended for listing.',
              },
            ],
          },
        },
        select: {
          id: true,
        },
      });

      const result = await buildJobWorkbook(job.id);

      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.storagePath).toContain(`${job.id}`);
      expect(result.storagePath).toContain('hta-output.xlsx');

      const buffer = await readFile(result.storagePath);
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(buffer);

      const htaResultsSheet = workbook.getWorksheet('HTA Results');
      const row = htaResultsSheet?.getRow(2);

      expect(row?.getCell(1).value).toBe('Mock drug');
      expect(row?.getCell(2).value).toBe('General indication');
      expect(row?.getCell(3).value).toBe('AU');
      expect(row?.getCell(4).value).toBe('Recommended');
      expect(row?.getCell(5).value).toBeNull();
      expect(row?.getCell(6).value).toBeNull();

      const fieldProvenanceSheet = workbook.getWorksheet('Field Provenance');
      expect(fieldProvenanceSheet?.getRow(2).getCell(1).value).toBe(
        'document_text_available',
      );
      expect(fieldProvenanceSheet?.getRow(2).getCell(2).value).toBe(
        'Document Text Available',
      );
      expect(fieldProvenanceSheet?.getRow(2).getCell(3).value).toBe('Yes');
      expect(fieldProvenanceSheet?.getRow(2).getCell(4).value).toBe(1);
      expect(fieldProvenanceSheet?.getRow(2).getCell(8).value).toBe('1');
      expect(fieldProvenanceSheet?.getRow(3).getCell(1).value).toBe(
        'hta_decision',
      );
      expect(fieldProvenanceSheet?.getRow(3).getCell(3).value).toBe(
        'Recommended',
      );
    } finally {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
