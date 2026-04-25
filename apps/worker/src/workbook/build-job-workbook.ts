import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '../lib/prisma';
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
        where: {
          fieldName: {
            in: ['hta_decision'],
          },
        },
        orderBy: [
          { fieldName: 'asc' },
          { createdAt: 'asc' },
        ],
        select: {
          fieldName: true,
          value: true,
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
    economicEvaluation: [],
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
