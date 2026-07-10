import { config } from "./config.js";
import { createDiscordClient } from "./discord/client.js";
import { registerReactionHandler } from "./discord/reactionHandler.js";

const client = createDiscordClient();

client.once("clientReady", (readyClient) => {
  console.log(`[起動完了] ${readyClient.user.tag} としてログインしました。`);
  console.log(`[設定] トリガー絵文字: ${config.triggerEmoji} / モデル: ${config.claudeModel}`);
});

registerReactionHandler(client);

client.login(config.discordBotToken).catch((err) => {
  console.error("[ログイン失敗]", err);
  process.exit(1);
});
