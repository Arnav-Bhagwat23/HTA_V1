import ExcelJS from 'exceljs';

import { WORKBOOK_COLUMNS, WORKBOOK_SHEETS } from './workbook-schema';

export const buildWorkbookBuffer = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();

  for (const sheetName of WORKBOOK_SHEETS) {
    const worksheet = workbook.addWorksheet(sheetName);
    const columns = WORKBOOK_COLUMNS[sheetName];

    worksheet.columns = columns.map((column) => ({
      key: column.key,
      header: column.header,
    }));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
