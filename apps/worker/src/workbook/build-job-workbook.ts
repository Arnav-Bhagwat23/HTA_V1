import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '../lib/prisma';
import type { DocumentsConsideredRow } from '../schema/documents-considered.schema';
import type { ExtractionAuditLogRow } from '../schema/extraction-audit-log.schema';
import type { FieldProvenanceRow } from '../schema/field-provenance.schema';
import type { HtaResultsRow } from '../schema/hta-results.schema';
import { buildWorkbookBuffer } from './workbook-builder';

export interface JobWorkbookResult {
  storagePath: string;
  mimeType: string;
}

const OUTPUT_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const mapJobToHtaResultsRow = (job: {
  canonicalDrug: string | null;
  canonicalIndication: string | null;
  canonicalGeography: string | null;
  fieldExtractions: Array<{
    fieldName: string;
    value: string | null;
  }>;
}): HtaResultsRow => {
  const fieldValueByName = new Map(
    job.fieldExtractions.map((field) => [field.fieldName, field.value]),
  );

  return {
    drugName: job.canonicalDrug,
    indication: job.canonicalIndication,
    country: job.canonicalGeography,
    htaDecision: fieldValueByName.get('hta_decision') ?? null,
    decisionDate: null,
    restrictionDetails: null,
  };
};

const mapJobToFieldProvenanceRows = (job: {
  fieldExtractions: Array<{
    fieldName: string;
    fieldLabel: string;
    value: string | null;
    confidence: number | null;
    warningCode: string | null;
    sourcePage: string | null;
    evidenceSnippet: string | null;
    documentConsidered: {
      documentTitle: string;
      documentUrl: string | null;
      publishedAt: Date | null;
    } | null;
    uploadedDocument: {
      originalFilename: string;
      createdAt: Date;
    } | null;
  }>;
}): FieldProvenanceRow[] =>
  job.fieldExtractions.map((field) => ({
    fieldName: field.fieldName,
    fieldLabel: field.fieldLabel,
    value: field.value,
    confidence: field.confidence,
    warningCode: field.warningCode,
    documentTitle:
      field.documentConsidered?.documentTitle ??
      field.uploadedDocument?.originalFilename ??
      null,
    documentUrl: field.documentConsidered?.documentUrl ?? null,
    sourcePage: field.sourcePage,
    evidenceSnippet: field.evidenceSnippet,
    publishedAt:
      field.documentConsidered?.publishedAt?.toISOString() ??
      field.uploadedDocument?.createdAt.toISOString() ??
      null,
  }));

const mapJobToDocumentsConsideredRows = (job: {
  documentsConsidered: Array<{
    id: string;
    documentTitle: string;
    jobSource: {
      sourceLabel: string;
    } | null;
    sourceType: string;
    sourceCountry: string | null;
    documentUrl: string | null;
    publishedAt: Date | null;
    isSelected: boolean;
    parseStatus: string;
    warningCode: string | null;
    warningMessage: string | null;
  }>;
  uploadedDocuments: Array<{
    id: string;
    originalFilename: string;
    parseStatus: string;
    warningCode: string | null;
    warningMessage: string | null;
    createdAt: Date;
  }>;
}): DocumentsConsideredRow[] => [
  ...job.documentsConsidered.map((document) => ({
    documentId: document.id,
    documentTitle: document.documentTitle,
    sourceName: document.jobSource?.sourceLabel ?? null,
    sourceType: document.sourceType.toLowerCase(),
    sourceCountry: document.sourceCountry,
    documentUrl: document.documentUrl,
    publishedAt: document.publishedAt?.toISOString() ?? null,
    isSelected: document.isSelected,
    parseStatus: document.parseStatus,
    warningCode: document.warningCode,
    warningMessage: document.warningMessage,
  })),
  ...job.uploadedDocuments.map((document) => ({
    documentId: document.id,
    documentTitle: document.originalFilename,
    sourceName: 'User Upload',
    sourceType: 'upload',
    sourceCountry: null,
    documentUrl: null,
    publishedAt: document.createdAt.toISOString(),
    isSelected: true,
    parseStatus: document.parseStatus,
    warningCode: document.warningCode,
    warningMessage: document.warningMessage,
  })),
];

const mapJobToExtractionAuditLogRows = (job: {
  auditEvents: Array<{
    eventType: string;
    eventPayload: unknown;
    createdAt: Date;
  }>;
}): ExtractionAuditLogRow[] =>
  job.auditEvents.map((event) => ({
    eventType: event.eventType,
    eventPayload:
      event.eventPayload === null || event.eventPayload === undefined
        ? null
        : JSON.stringify(event.eventPayload),
    createdAt: event.createdAt.toISOString(),
  }));

export const buildJobWorkbook = async (
  searchJobId: string,
): Promise<JobWorkbookResult> => {
  const job = await prisma.searchJob.findUnique({
    where: { id: searchJobId },
    select: {
      id: true,
      canonicalDrug: true,
      canonicalIndication: true,
      canonicalGeography: true,
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
              documentTitle: true,
              documentUrl: true,
              publishedAt: true,
            },
          },
          uploadedDocument: {
            select: {
              originalFilename: true,
              createdAt: true,
            },
          },
        },
      },
      documentsConsidered: {
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        select: {
          id: true,
          documentTitle: true,
          jobSource: {
            select: {
              sourceLabel: true,
            },
          },
          sourceType: true,
          sourceCountry: true,
          documentUrl: true,
          publishedAt: true,
          isSelected: true,
          parseStatus: true,
          warningCode: true,
          warningMessage: true,
        },
      },
      uploadedDocuments: {
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        select: {
          id: true,
          originalFilename: true,
          parseStatus: true,
          warningCode: true,
          warningMessage: true,
          createdAt: true,
        },
      },
      auditEvents: {
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        select: {
          eventType: true,
          eventPayload: true,
          createdAt: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error(`SearchJob ${searchJobId} was not found.`);
  }

  const outputDirectory = path.join(
    process.cwd(),
    '.local',
    'outputs',
    searchJobId,
  );
  const storagePath = path.join(outputDirectory, 'hta-output.xlsx');
  const workbookBuffer = await buildWorkbookBuffer({
    documentsConsidered: mapJobToDocumentsConsideredRows(job),
    economicEvaluation: [],
    extractionAuditLog: mapJobToExtractionAuditLogRows(job),
    fieldProvenance: mapJobToFieldProvenanceRows(job),
    guidelineResults: [],
    htaResults: [mapJobToHtaResultsRow(job)],
    nmaResults: [],
    trialResults: [],
  });

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(storagePath, workbookBuffer);

  return {
    storagePath,
    mimeType: OUTPUT_MIME_TYPE,
  };
};
