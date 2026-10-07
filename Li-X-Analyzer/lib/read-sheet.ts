import { parseCsv, type Sheet } from "./import-parse";

/** Read every sheet of an uploaded .xlsx, or the single sheet of a .csv. exceljs is heavy, so it loads only when an xlsx arrives. */
export async function readSheets(file: File): Promise<Sheet[]> {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return [{ name: file.name, rows: parseCsv((await file.text()).replace(/^﻿/, "")) }];
  }
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  return wb.worksheets.map((ws) => {
    const rows: unknown[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      rows.push(
        (row.values as unknown[]).slice(1).map((v) =>
          v && typeof v === "object" && !(v instanceof Date)
            ? ((v as { text?: string; result?: unknown }).text ?? (v as { result?: unknown }).result ?? "")
            : v,
        ),
      );
    });
    return { name: ws.name, rows };
  });
}
