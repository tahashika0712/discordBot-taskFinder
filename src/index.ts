import { config } from "./config.js";
import { commands } from "./discord/commands.js";
import { registerCommandHandler } from "./discord/commandHandler.js";
import { createDiscordClient } from "./discord/client.js";
import { registerReactionHandler } from "./discord/reactionHandler.js";

const client = createDiscordClient();

client.once("clientReady", async (readyClient) => {
  console.log(`[起動完了] ${readyClient.user.tag} としてログインしました。`);
  console.log(`[設定] トリガー絵文字: ${config.triggerEmoji} / モデル: ${config.claudeModel}`);

  try {
    await readyClient.application.commands.set(commands);
    console.log("[スラッシュコマンド] 登録完了");
  } catch (err) {
    console.error("[スラッシュコマンド] 登録失敗", err);
  }
});

registerReactionHandler(client);
registerCommandHandler(client);

client.login(config.discordBotToken).catch((err) => {
  console.error("[ログイン失敗]", err);
  process.exit(1);
});
