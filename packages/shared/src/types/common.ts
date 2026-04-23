export type UUID = string;
export type ISODateString = string;
export type ConfidenceScore = number;

export interface ConfidenceBreakdown {
  drug: ConfidenceScore;
  indication: ConfidenceScore;
  geography: ConfidenceScore;
}
