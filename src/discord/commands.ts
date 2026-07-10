import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("set-sheet")
    .setDescription("このサーバーのタスク登録先スプレッドシートを設定します")
    .addStringOption((option) =>
      option.setName("url").setDescription("スプレッドシートのURL、またはID").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("remove-sheet")
    .setDescription("このサーバーのスプレッドシート設定を削除します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("show-sheet")
    .setDescription("現在設定されているスプレッドシートを表示します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];
