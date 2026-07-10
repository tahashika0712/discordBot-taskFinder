import type { SourceMessage } from "../types.js";

export const taskExtractionSchema = {
  type: "object",
  properties: {
    is_task: {
      type: "boolean",
      description:
        "メッセージが実際のタスク依頼・作業指示であれば true。雑談・相槌・質問のみ等でタスクと呼べない内容なら false。",
    },
    task_name: {
      type: "string",
      description: "簡潔なタスク名（例: 資料の修正）。is_task が false の場合は空文字でよい。",
    },
    task_detail: {
      type: "string",
      description: "具体的な作業内容や補足。is_task が false の場合は空文字でよい。",
    },
    assignee: {
      type: "string",
      description:
        "担当者名。メッセージ内に@メンションや名前があればそれを使う。無ければ発言者名を使う。",
    },
    due_date: {
      type: ["string", "null"],
      description:
        "タスクの期限を YYYY/MM/DD 形式に変換したもの。期限の言及が無ければ null。",
    },
  },
  required: ["is_task", "task_name", "task_detail", "assignee", "due_date"],
  additionalProperties: false,
} as const;

export function buildSystemPrompt(): string {
  return [
    "あなたはDiscordのメッセージからタスク管理用の情報を抽出するアシスタントです。",
    "与えられたメッセージ本文・発言者・投稿日時をもとに、以下のルールでJSONを出力してください。",
    "",
    "1. メッセージが実際の作業依頼・タスクでない（雑談・挨拶・単なる質問への返答など）場合は is_task を false にし、他のフィールドは空文字/nullで構いません。",
    "2. タスクである場合、task_name は短く簡潔なタイトル、task_detail は具体的な作業内容を記述してください。",
    "3. 担当者(assignee)は、メッセージ内に@メンションや名前の指定があればそれを優先し、無ければ発言者自身を担当者としてください。",
    "4. 期限(due_date)は「明日まで」「来週の金曜」「7/15」のような曖昧・省略表現を、投稿日時を基準にYYYY/MM/DD形式の絶対日付に変換してください。期限の言及が無ければ null にしてください。",
    "5. 出力は指定されたJSON Schemaに厳密に従ってください。",
  ].join("\n");
}

export function buildUserPrompt(message: SourceMessage): string {
  const postedAtJst = message.postedAt.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return [
    `投稿日時: ${postedAtJst}`,
    `発言者: ${message.authorName}`,
    "メッセージ本文:",
    message.content,
  ].join("\n");
}
