export interface TaskExtraction {
  is_task: boolean;
  task_name: string;
  task_detail: string;
  assignee: string;
  due_date: string | null;
}

export interface SourceMessage {
  content: string;
  authorName: string;
  url: string;
  postedAt: Date;
}
