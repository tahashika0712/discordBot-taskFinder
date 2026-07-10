export interface Task {
  task_name: string;
  task_detail: string;
  assignee: string;
  due_date: string | null;
}

export interface TaskExtractionResult {
  is_task: boolean;
  tasks: Task[];
}

export interface SourceMessage {
  content: string;
  authorName: string;
  url: string;
  postedAt: Date;
}
