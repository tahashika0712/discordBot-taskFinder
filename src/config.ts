import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません。.env を確認してください。`);
  }
  return value;
}

export const config = {
  discordBotToken: required("DISCORD_BOT_TOKEN"),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  claudeModel: process.env.CLAUDE_MODEL || "claude-opus-4-8",
  triggerEmoji: process.env.TRIGGER_EMOJI || "📋",
  // 各Discordサーバーの登録先スプレッドシートIDは /set-sheet コマンドで個別に設定する
  sheetName: process.env.SHEET_NAME || "TaskData",
  guildSheetStorePath: process.env.GUILD_SHEET_STORE_PATH || "./data/guildSheets.json",
};
