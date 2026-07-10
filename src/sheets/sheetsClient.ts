import { google } from "googleapis";
import { config } from "../config.js";
import type { TaskExtraction } from "../types.js";

const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

function todayJst(): string {
  const now = new Date();
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }).replace(/-/g, "/");
}

export async function appendTaskRow(task: TaskExtraction, sourceUrl: string): Promise<void> {
  const row = [
    todayJst(),
    task.task_name,
    task.task_detail,
    task.assignee,
    task.due_date ?? "",
    "未着手",
    sourceUrl,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });
}
