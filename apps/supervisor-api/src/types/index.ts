/**
 * Task types and interfaces
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskType = 'code-generation' | 'code-review' | 'refactor' | 'test' | 'custom';

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  repo?: string;
  branch?: string;
  result?: string;
  error?: string;
  logs: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CreateTaskInput {
  type?: TaskType;
  description: string;
  repo?: string;
  branch?: string;
  context?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface GitHubPRInput {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface SlackMessage {
  text: string;
  channel?: string;
  attachments?: Array<{
    color: string;
    title: string;
    text: string;
  }>;
}
