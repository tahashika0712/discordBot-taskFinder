import {
  Client,
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from "discord.js";
import { config } from "../config.js";
import { extractTask } from "../llm/extractTask.js";
import { appendTaskRows } from "../sheets/sheetsClient.js";
import { getSpreadsheetId } from "../store/guildSheetStore.js";
import type { SourceMessage } from "../types.js";

const MENTION_PATTERN = /<@!?(\d+)>/g;

function resolveMentions(message: Message): string {
  return message.content.replace(MENTION_PATTERN, (match, userId: string) => {
    const member = message.mentions.members?.get(userId);
    if (member) return `@${member.displayName}`;
    const user = message.mentions.users.get(userId);
    if (user) return `@${user.username}`;
    return match;
  });
}

async function handleReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
): Promise<void> {
  if (user.bot) return;
  if (reaction.emoji.name !== config.triggerEmoji) return;

  const fullReaction = reaction.partial ? await reaction.fetch() : reaction;
  const message = fullReaction.message.partial
    ? await fullReaction.message.fetch()
    : fullReaction.message;

  if (!message.guildId) {
    await message.react("❌").catch(() => {});
    return;
  }

  const spreadsheetId = getSpreadsheetId(message.guildId);
  if (!spreadsheetId) {
    await message.react("❌").catch(() => {});
    await message
      .reply(
        "⚠️ このサーバーはまだタスク登録先のスプレッドシートが設定されていません。サーバー管理者が `/set-sheet` コマンドで設定してください。",
      )
      .catch(() => {});
    return;
  }

  const sourceMessage: SourceMessage = {
    content: resolveMentions(message),
    authorName: message.member?.displayName ?? message.author.username,
    url: message.url,
    postedAt: message.createdAt,
  };

  try {
    const extraction = await extractTask(sourceMessage);

    if (!extraction.is_task || extraction.tasks.length === 0) {
      console.log(`[スキップ] タスクではないと判断されました: ${message.url}`);
      await message.react("❌").catch(() => {});
      await message
        .reply("⚠️ タスクとして認識できなかったため、登録をスキップしました。")
        .catch(() => {});
      return;
    }

    await appendTaskRows(spreadsheetId, extraction.tasks, message.url);
    await message.react("✅").catch(() => {});

    if (extraction.tasks.length > 1) {
      const list = extraction.tasks.map((t) => `・${t.task_name}`).join("\n");
      await message.reply(`✅ ${extraction.tasks.length}件のタスクを登録しました。\n${list}`).catch(() => {});
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[処理エラー] ${message.url}:`, err);
    await message.react("❌").catch(() => {});
    await message
      .reply(`⚠️ タスク登録に失敗しました。\n\`\`\`\n${reason.slice(0, 500)}\n\`\`\``)
      .catch((replyErr) => console.error("[エラー通知失敗]", replyErr));
  }
}

export function registerReactionHandler(client: Client): void {
  client.on("messageReactionAdd", (reaction, user) => {
    handleReaction(reaction, user).catch((err) => {
      console.error("[リアクションハンドラ致命的エラー]", err);
    });
  });
}
