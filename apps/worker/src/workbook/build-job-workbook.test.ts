import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import ExcelJS from 'exceljs';
import {
  JobMode,
  JobStatus,
  ParseStatus,
  PrismaClient,
  SourceType,
  UserRole,
  WarningCode,
} from '@prisma/client';
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
          completedAt: new Date('2026-04-25T00:05:00.000Z'),
          canonicalDrug: 'Mock drug',
          canonicalIndication: 'General indication',
          canonicalGeography: 'AU',
          requiresManualUpload: false,
          failureCode: WarningCode.UNKNOWN_ERROR,
          failureMessage: 'Mock job-level failure for workbook coverage.',
          auditEvents: {
            create: [
              {
                eventType: 'job_created',
                eventPayload: {
                  mode: 'AUTOMATIC',
                },
              },
            ],
          },
          documentsConsidered: {
            create: [
              {
                documentTitle:
                  'PBAC Public Summary Document - Mock drug - general indication',
                sourceType: SourceType.PDF,
                sourceCountry: 'AU',
                documentUrl:
                  'https://example.com/mock-pbac-public-summary-document.pdf',
                publishedAt: new Date('2026-04-25T00:00:00.000Z'),
                isSelected: true,
                parseStatus: ParseStatus.PARSED,
                warningCode: WarningCode.SOURCE_PARSE_FAILED,
                warningMessage: 'Mock parser warning on selected document.',
              },
            ],
          },
          jobSources: {
            create: [
              {
                sourceKey: 'pbac',
                sourceLabel: 'PBAC',
                sourceCountry: 'AU',
                sourceType: SourceType.PDF,
                status: 'FAILED',
                errorCode: WarningCode.NO_RESULT_FOUND,
                errorMessage: 'No alternative result was found.',
              },
            ],
          },
          uploadedDocuments: {
            create: [
              {
                originalFilename: 'manual-upload.pdf',
                mimeType: 'application/pdf',
                localTempPath: 'pending://manual-upload.pdf',
                uploadSize: 123,
                parseStatus: ParseStatus.PENDING,
                warningCode: WarningCode.UPLOAD_PARSE_FAILED,
                warningMessage: 'Upload bytes not available yet.',
              },
            ],
          },
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
                warningCode: WarningCode.FIELD_NOT_PRESENT_IN_LATEST_DOCUMENT,
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

      const documentsConsideredSheet = workbook.getWorksheet(
        'Documents Considered',
      );
      expect(documentsConsideredSheet?.getRow(2).getCell(2).value).toBe(
        'PBAC Public Summary Document - Mock drug - general indication',
      );
      expect(documentsConsideredSheet?.getRow(2).getCell(4).value).toBe('pdf');
      expect(documentsConsideredSheet?.getRow(2).getCell(5).value).toBe('AU');
      expect(documentsConsideredSheet?.getRow(2).getCell(8).value).toBe(true);
      expect(documentsConsideredSheet?.getRow(3).getCell(2).value).toBe(
        'manual-upload.pdf',
      );
      expect(documentsConsideredSheet?.getRow(3).getCell(3).value).toBe(
        'User Upload',
      );
      expect(documentsConsideredSheet?.getRow(3).getCell(4).value).toBe(
        'upload',
      );

      const extractionAuditLogSheet = workbook.getWorksheet(
        'Extraction Audit Log',
      );
      expect(extractionAuditLogSheet?.getRow(2).getCell(1).value).toBe(
        'job_created',
      );
      expect(extractionAuditLogSheet?.getRow(2).getCell(2).value).toBe(
        '{"mode":"AUTOMATIC"}',
      );
      expect(typeof extractionAuditLogSheet?.getRow(2).getCell(3).value).toBe(
        'string',
      );

      const missingFieldsWarningsSheet = workbook.getWorksheet(
        'Missing Fields & Warnings',
      );
      expect(missingFieldsWarningsSheet?.getRow(2).getCell(3).value).toBe(
        'UNKNOWN_ERROR',
      );
      expect(missingFieldsWarningsSheet?.getRow(2).getCell(5).value).toBe(
        'search_job',
      );
      expect(missingFieldsWarningsSheet?.getRow(3).getCell(1).value).toBe(
        'hta_decision',
      );
      expect(missingFieldsWarningsSheet?.getRow(3).getCell(3).value).toBe(
        'FIELD_NOT_PRESENT_IN_LATEST_DOCUMENT',
      );
      expect(missingFieldsWarningsSheet?.getRow(3).getCell(5).value).toBe(
        'field_extraction',
      );
      expect(missingFieldsWarningsSheet?.getRow(4).getCell(3).value).toBe(
        'SOURCE_PARSE_FAILED',
      );
      expect(missingFieldsWarningsSheet?.getRow(4).getCell(5).value).toBe(
        'document_considered',
      );
      expect(missingFieldsWarningsSheet?.getRow(5).getCell(3).value).toBe(
        'UPLOAD_PARSE_FAILED',
      );
      expect(missingFieldsWarningsSheet?.getRow(5).getCell(5).value).toBe(
        'uploaded_document',
      );
      expect(missingFieldsWarningsSheet?.getRow(6).getCell(3).value).toBe(
        'NO_RESULT_FOUND',
      );
      expect(missingFieldsWarningsSheet?.getRow(6).getCell(5).value).toBe(
        'job_source',
      );

      const runMetadataSheet = workbook.getWorksheet('Run Metadata');
      expect(runMetadataSheet?.getRow(2).getCell(1).value).toBe(job.id);
      expect(runMetadataSheet?.getRow(2).getCell(2).value).toBe('AUTOMATIC');
      expect(runMetadataSheet?.getRow(2).getCell(3).value).toBe('COMPLETED');
      expect(runMetadataSheet?.getRow(2).getCell(4).value).toBe(
        'Mock drug general indication Australia',
      );
      expect(runMetadataSheet?.getRow(2).getCell(5).value).toBe('Mock drug');
      expect(runMetadataSheet?.getRow(2).getCell(6).value).toBe(
        'General indication',
      );
      expect(runMetadataSheet?.getRow(2).getCell(7).value).toBe('AU');
      expect(runMetadataSheet?.getRow(2).getCell(8).value).toBe(false);
      expect(typeof runMetadataSheet?.getRow(2).getCell(9).value).toBe(
        'string',
      );
      expect(runMetadataSheet?.getRow(2).getCell(10).value).not.toBeNull();
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
