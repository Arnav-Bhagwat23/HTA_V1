import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { HtaResultsRow } from '../schema/hta-results.schema';
import type { TrialResultsRow } from '../schema/trial-results.schema';

export interface StructuredExtractionOutput {
  htaResults: HtaResultsRow[];
  trialResults: TrialResultsRow[];
}

const EMPTY_STRUCTURED_EXTRACTION_OUTPUT: StructuredExtractionOutput = {
  htaResults: [],
  trialResults: [],
};

const getOutputDirectory = (searchJobId: string): string =>
  path.join(process.cwd(), '.local', 'outputs', searchJobId);

export const getStructuredExtractionArtifactPath = (
  searchJobId: string,
): string => path.join(getOutputDirectory(searchJobId), 'structured-extraction.json');

export const loadStructuredExtractionArtifact = async (
  searchJobId: string,
): Promise<StructuredExtractionOutput | null> => {
  try {
    const fileContents = await readFile(
      getStructuredExtractionArtifactPath(searchJobId),
      'utf8',
    );
    const parsed = JSON.parse(fileContents) as Partial<StructuredExtractionOutput>;

    return {
      htaResults: Array.isArray(parsed.htaResults) ? parsed.htaResults : [],
      trialResults: Array.isArray(parsed.trialResults) ? parsed.trialResults : [],
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null;
    }

    throw error;
  }
};

export const persistStructuredExtractionArtifact = async (
  searchJobId: string,
  output: StructuredExtractionOutput,
): Promise<string> => {
  const existingOutput =
    (await loadStructuredExtractionArtifact(searchJobId)) ??
    EMPTY_STRUCTURED_EXTRACTION_OUTPUT;
  const mergedOutput: StructuredExtractionOutput = {
    htaResults:
      output.htaResults.length > 0
        ? output.htaResults
        : existingOutput.htaResults,
    trialResults: [...existingOutput.trialResults, ...output.trialResults],
  };
  const outputDirectory = getOutputDirectory(searchJobId);
  const artifactPath = getStructuredExtractionArtifactPath(searchJobId);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(artifactPath, JSON.stringify(mergedOutput, null, 2), 'utf8');

  return artifactPath;
};
