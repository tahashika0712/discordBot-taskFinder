import { ChatInputCommandInteraction, Client, Interaction } from "discord.js";
import { config } from "../config.js";
import { verifySpreadsheetAccess } from "../sheets/sheetsClient.js";
import {
  extractSpreadsheetId,
  getSpreadsheetId,
  removeSpreadsheetId,
  setSpreadsheetId,
} from "../store/guildSheetStore.js";

async function handleSetSheet(interaction: ChatInputCommandInteraction): Promise<void> {
  const input = interaction.options.getString("url", true);
  const spreadsheetId = extractSpreadsheetId(input);

  await interaction.deferReply({ ephemeral: true });

  const result = await verifySpreadsheetAccess(spreadsheetId);
  if (!result.ok) {
    await interaction.editReply(
      `⚠️ スプレッドシートにアクセスできませんでした。URLと共有設定（サービスアカウントへの編集者権限）を確認してください。\n\`\`\`\n${result.error}\n\`\`\``,
    );
    return;
  }

  setSpreadsheetId(interaction.guildId!, spreadsheetId);

  if (!result.hasSheetTab) {
    await interaction.editReply(
      `✅ 「${result.spreadsheetTitle}」を登録しました。\n⚠️ ただし「${config.sheetName}」という名前のシート（タブ）が見つかりませんでした。作成しておいてください。`,
    );
    return;
  }

  await interaction.editReply(`✅ このサーバーのタスク登録先を「${result.spreadsheetTitle}」に設定しました。`);
}

async function handleRemoveSheet(interaction: ChatInputCommandInteraction): Promise<void> {
  const removed = removeSpreadsheetId(interaction.guildId!);
  await interaction.reply({
    content: removed
      ? "✅ このサーバーのスプレッドシート設定を削除しました。"
      : "このサーバーにはまだ設定がありません。",
    ephemeral: true,
  });
}

async function handleShowSheet(interaction: ChatInputCommandInteraction): Promise<void> {
  const spreadsheetId = getSpreadsheetId(interaction.guildId!);
  if (!spreadsheetId) {
    await interaction.reply({
      content: "このサーバーにはまだスプレッドシートが設定されていません。`/set-sheet` で設定してください。",
      ephemeral: true,
    });
    return;
  }

  const result = await verifySpreadsheetAccess(spreadsheetId);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  await interaction.reply({
    content: result.ok
      ? `現在の登録先: 「${result.spreadsheetTitle}」\n${url}`
      : `現在の登録先ID: ${spreadsheetId}\n⚠️ アクセス確認でエラーが発生しました: ${result.error}`,
    ephemeral: true,
  });
}

function pickHandler(
  commandName: string,
): ((interaction: ChatInputCommandInteraction) => Promise<void>) | null {
  switch (commandName) {
    case "set-sheet":
      return handleSetSheet;
    case "remove-sheet":
      return handleRemoveSheet;
    case "show-sheet":
      return handleShowSheet;
    default:
      return null;
  }
}

export function registerCommandHandler(client: Client): void {
  client.on("interactionCreate", (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild()) {
      interaction
        .reply({ content: "このコマンドはサーバー内でのみ使用できます。", ephemeral: true })
        .catch(() => {});
      return;
    }

    const handler = pickHandler(interaction.commandName);
    if (!handler) return;

    handler(interaction).catch((err) => {
      console.error(`[コマンドエラー] ${interaction.commandName}:`, err);
      const content = "⚠️ コマンドの処理中にエラーが発生しました。";
      if (interaction.deferred || interaction.replied) {
        interaction.editReply(content).catch(() => {});
      } else {
        interaction.reply({ content, ephemeral: true }).catch(() => {});
      }
    });
  });
}
