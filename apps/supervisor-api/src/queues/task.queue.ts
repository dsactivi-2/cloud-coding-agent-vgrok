/**
 * Task Queue - BullMQ Integration
 */

import { Queue, Worker, Job } from 'bullmq';
import { Task, CreateTaskInput } from '../types/index.js';
import { generateCode, reviewCode } from '../services/ai.service.js';
import { notifyTaskStarted, notifyTaskCompleted, notifyTaskFailed } from '../services/slack.service.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL
function getRedisConnection() {
  try {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = getRedisConnection();

// Task storage (in-memory for now, can be replaced with DB)
export const taskStore: Map<string, Task> = new Map();
let taskCounter = 0;

// Create the queue
export const taskQueue = new Queue('vgrok-tasks', { connection });

/**
 * Add a task to the queue
 */
export async function addTask(input: CreateTaskInput): Promise<Task> {
  taskCounter++;
  const taskId = `vgrok-task-${String(taskCounter).padStart(3, '0')}`;

  const task: Task = {
    id: taskId,
    type: input.type || 'custom',
    description: input.description,
    status: 'pending',
    repo: input.repo,
    branch: input.branch,
    logs: [`[${new Date().toISOString()}] Task created`],
    createdAt: new Date()
  };

  taskStore.set(taskId, task);

  // Add to BullMQ queue
  await taskQueue.add('process-task', {
    taskId,
    input
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });

  console.log(`[Queue] Task ${taskId} added to queue`);

  return task;
}

/**
 * Get task by ID
 */
export function getTask(taskId: string): Task | undefined {
  return taskStore.get(taskId);
}

/**
 * Get all tasks
 */
export function getAllTasks(): Task[] {
  return Array.from(taskStore.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

/**
 * Add log entry to task
 */
function addLog(taskId: string, message: string): void {
  const task = taskStore.get(taskId);
  if (task) {
    task.logs.push(`[${new Date().toISOString()}] ${message}`);
    taskStore.set(taskId, task);
  }
}

/**
 * Update task status
 */
function updateTaskStatus(
  taskId: string,
  status: Task['status'],
  updates: Partial<Task> = {}
): void {
  const task = taskStore.get(taskId);
  if (task) {
    taskStore.set(taskId, { ...task, status, ...updates });
  }
}

/**
 * Process a task
 */
async function processTask(job: Job<{ taskId: string; input: CreateTaskInput }>): Promise<void> {
  const { taskId, input } = job.data;
  const task = taskStore.get(taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  console.log(`[Worker] Processing task ${taskId}: ${input.description}`);

  // Update status to running
  updateTaskStatus(taskId, 'running', { startedAt: new Date() });
  addLog(taskId, 'Task started');

  // Notify Slack
  await notifyTaskStarted(task);

  try {
    let result: string;

    switch (input.type || 'custom') {
      case 'code-generation':
        addLog(taskId, 'Generating code with AI...');
        result = await generateCode(input.description, input.context);
        break;

      case 'code-review':
        addLog(taskId, 'Reviewing code with AI...');
        result = await reviewCode(input.context || '');
        break;

      case 'refactor':
        addLog(taskId, 'Refactoring code with AI...');
        result = await generateCode(`Refactor the following code: ${input.description}`, input.context);
        break;

      default:
        addLog(taskId, 'Processing custom task with AI...');
        result = await generateCode(input.description, input.context);
    }

    // Update task with result
    updateTaskStatus(taskId, 'completed', {
      result,
      completedAt: new Date()
    });
    addLog(taskId, 'Task completed successfully');

    // Get updated task for notification
    const completedTask = taskStore.get(taskId)!;
    await notifyTaskCompleted(completedTask);

    console.log(`[Worker] Task ${taskId} completed`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    updateTaskStatus(taskId, 'failed', {
      error: errorMessage,
      completedAt: new Date()
    });
    addLog(taskId, `Task failed: ${errorMessage}`);

    // Get updated task for notification
    const failedTask = taskStore.get(taskId)!;
    await notifyTaskFailed(failedTask);

    console.error(`[Worker] Task ${taskId} failed:`, error);
    throw error;
  }
}

// Create the worker
export const taskWorker = new Worker('vgrok-tasks', processTask, {
  connection,
  concurrency: 2
});

// Worker event handlers
taskWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed for task ${job.data.taskId}`);
});

taskWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

taskWorker.on('error', (err) => {
  console.error('[Worker] Error:', err);
});

console.log('[Queue] Task queue and worker initialized');
