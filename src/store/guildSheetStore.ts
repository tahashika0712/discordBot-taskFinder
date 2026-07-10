import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

type GuildSheetMap = Record<string, string>;

function readStore(): GuildSheetMap {
  try {
    const raw = fs.readFileSync(config.guildSheetStorePath, "utf-8");
    return JSON.parse(raw) as GuildSheetMap;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[guildSheetStore] 設定ファイルの読み込みに失敗しました。空として扱います。", err);
    }
    return {};
  }
}

function writeStore(map: GuildSheetMap): void {
  const dir = path.dirname(config.guildSheetStorePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.guildSheetStorePath, JSON.stringify(map, null, 2), "utf-8");
}

export function getSpreadsheetId(guildId: string): string | undefined {
  return readStore()[guildId];
}

export function setSpreadsheetId(guildId: string, spreadsheetId: string): void {
  const map = readStore();
  map[guildId] = spreadsheetId;
  writeStore(map);
}

export function removeSpreadsheetId(guildId: string): boolean {
  const map = readStore();
  if (!(guildId in map)) return false;
  delete map[guildId];
  writeStore(map);
  return true;
}

const SPREADSHEET_URL_PATTERN = /\/d\/([a-zA-Z0-9_-]+)/;

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(SPREADSHEET_URL_PATTERN);
  return match ? match[1] : trimmed;
}
