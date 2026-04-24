import { PDFParse } from 'pdf-parse';

export const extractPdfText = async (
  pdfBuffer: Uint8Array,
): Promise<string> => {
  const parser = new PDFParse({ data: Buffer.from(pdfBuffer) });

  try {
    const parsed = await parser.getText();
    return parsed.text;
  } finally {
    await parser.destroy();
  }
};
