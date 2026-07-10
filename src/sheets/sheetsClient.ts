import { sheets_v4, sheets, auth as authPlus } from "@googleapis/sheets";
import { config } from "../config.js";
import type { TaskExtraction } from "../types.js";

const auth = new authPlus.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetsClient: sheets_v4.Sheets = sheets({ version: "v4", auth });

function todayJst(): string {
  const now = new Date();
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }).replace(/-/g, "/");
}

export async function appendTaskRow(
  spreadsheetId: string,
  task: TaskExtraction,
  sourceUrl: string,
): Promise<void> {
  const row = [
    todayJst(),
    task.task_name,
    task.task_detail,
    task.assignee,
    task.due_date ?? "",
    "未着手",
    sourceUrl,
  ];

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: `${config.sheetName}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });
}

export type SheetAccessResult =
  | { ok: true; hasSheetTab: boolean; spreadsheetTitle: string }
  | { ok: false; error: string };

export async function verifySpreadsheetAccess(spreadsheetId: string): Promise<SheetAccessResult> {
  try {
    const res = await sheetsClient.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });
    const tabTitles = (res.data.sheets ?? []).map((s) => s.properties?.title);
    return {
      ok: true,
      hasSheetTab: tabTitles.includes(config.sheetName),
      spreadsheetTitle: res.data.properties?.title ?? "(不明)",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
