import pdfParse from 'pdf-parse';

export const extractPdfText = async (
  pdfBuffer: Uint8Array,
): Promise<string> => {
  const parsed = await pdfParse(Buffer.from(pdfBuffer));
  return parsed.text;
};
