import type { SourceMessage } from "../types.js";

export const taskExtractionSchema = {
  type: "object",
  properties: {
    is_task: {
      type: "boolean",
      description:
        "メッセージに1件以上の実際のタスク依頼・作業指示が含まれていれば true。雑談・相槌・質問のみ等でタスクと呼べる内容が無ければ false。",
    },
    tasks: {
      type: "array",
      description:
        "抽出されたタスクの一覧。is_task が false の場合は空配列。メッセージ内に複数の異なる作業が含まれる場合は、それぞれ独立したタスクとして分解すること。",
      items: {
        type: "object",
        properties: {
          task_name: {
            type: "string",
            description: "簡潔なタスク名（例: 資料の修正）。",
          },
          task_detail: {
            type: "string",
            description: "具体的な作業内容や補足。",
          },
          assignee: {
            type: "string",
            description:
              "そのタスクの担当者名。そのタスクについて個別に@メンションや名前の指定があればそれを使う。無ければ発言者名を使う。",
          },
          due_date: {
            type: ["string", "null"],
            description:
              "そのタスク固有の期限を YYYY/MM/DD 形式に変換したもの。個別の言及が無ければ null。",
          },
        },
        required: ["task_name", "task_detail", "assignee", "due_date"],
        additionalProperties: false,
      },
    },
  },
  required: ["is_task", "tasks"],
  additionalProperties: false,
} as const;

export function buildSystemPrompt(): string {
  return [
    "あなたはDiscordのメッセージからタスク管理用の情報を抽出するアシスタントです。",
    "与えられたメッセージ本文・発言者・投稿日時をもとに、以下のルールでJSONを出力してください。",
    "",
    "1. メッセージが実際の作業依頼・タスクでない（雑談・挨拶・単なる質問への返答など）場合は is_task を false にし、tasks は空配列にしてください。",
    "2. メッセージ内に複数の異なる作業（タスク）が含まれている場合は、1つにまとめず、それぞれ独立したタスクとして tasks 配列に分解してください。",
    "3. 各タスクの task_name は短く簡潔なタイトル、task_detail は具体的な作業内容を記述してください。",
    "4. 各タスクの担当者(assignee)は、そのタスクについて個別に@メンションや名前の指定があればそれを優先してください。個別の指定が無いタスクは、メッセージ全体で共通の指定（あれば）か、発言者自身を担当者としてください。",
    "5. 各タスクの期限(due_date)は、そのタスクについて個別に「明日まで」「来週の金曜」「7/15」のような期限の言及があれば、投稿日時を基準にYYYY/MM/DD形式の絶対日付に変換してください。個別の言及が無いタスクは、メッセージ全体で共通の期限（あれば）を適用し、それも無ければ null にしてください。",
    "6. 出力は指定されたJSON Schemaに厳密に従ってください。",
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
