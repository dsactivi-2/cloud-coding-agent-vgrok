/**
 * VGrok Agent API - Main Entry Point
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { addTask, getTask, getAllTasks, taskQueue } from './queues/task.queue.js';
import { createPullRequest, createBranch, getRepoContents } from './services/github.service.js';
import { sendSlackMessage } from './services/slack.service.js';
import { CreateTaskInput } from './types/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Health & Discovery
// ============================================

/**
 * Health check endpoint
 */
app.get('/api/health', async (_req: Request, res: Response) => {
  const queueStatus = await taskQueue.getJobCounts();

  res.json({
    status: 'ok',
    name: 'VGrok Agent',
    version: '1.0.0',
    queue: {
      waiting: queueStatus.waiting,
      active: queueStatus.active,
      completed: queueStatus.completed,
      failed: queueStatus.failed
    }
  });
});

/**
 * Discovery endpoint - list available capabilities
 */
app.get('/api/discovery', (_req: Request, res: Response) => {
  res.json({
    name: 'VGrok Agent',
    version: '1.0.0',
    capabilities: [
      'task-management',
      'code-generation',
      'code-review',
      'refactoring',
      'testing',
      'github-integration',
      'slack-notifications'
    ],
    providers: ['anthropic', 'openai', 'grok'],
    taskTypes: ['code-generation', 'code-review', 'refactor', 'test', 'custom']
  });
});

// ============================================
// Task Management
// ============================================

/**
 * Create a new task
 */
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const input: CreateTaskInput = {
      type: req.body.type || 'custom',
      description: req.body.description || 'No description',
      repo: req.body.repo,
      branch: req.body.branch,
      context: req.body.context
    };

    const task = await addTask(input);

    res.status(201).json({
      taskId: task.id,
      status: task.status,
      message: 'Task queued for processing'
    });
  } catch (error) {
    console.error('[API] Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * Get all tasks
 */
app.get('/api/tasks', (_req: Request, res: Response) => {
  const tasks = getAllTasks();
  res.json(tasks);
});

/**
 * Get single task by ID
 */
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = getTask(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

/**
 * Get task logs
 */
app.get('/api/tasks/:id/logs', (req: Request, res: Response) => {
  const task = getTask(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ logs: task.logs });
});

// ============================================
// GitHub Integration
// ============================================

/**
 * Create a Pull Request
 */
app.post('/api/github/pr', async (req: Request, res: Response) => {
  try {
    const { owner, repo, title, body, head, base } = req.body;

    if (!owner || !repo || !title || !head || !base) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pr = await createPullRequest({ owner, repo, title, body, head, base });

    res.json(pr);
  } catch (error) {
    console.error('[API] Error creating PR:', error);
    res.status(500).json({ error: 'Failed to create PR' });
  }
});

/**
 * Create a branch
 */
app.post('/api/github/branch', async (req: Request, res: Response) => {
  try {
    const { owner, repo, branchName, fromBranch } = req.body;

    if (!owner || !repo || !branchName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const branch = await createBranch(owner, repo, branchName, fromBranch);

    res.json(branch);
  } catch (error) {
    console.error('[API] Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

/**
 * Get repository contents
 */
app.get('/api/github/contents/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const path = req.query.path as string || '';

    const contents = await getRepoContents(owner, repo, path);

    res.json(contents);
  } catch (error) {
    console.error('[API] Error getting repo contents:', error);
    res.status(500).json({ error: 'Failed to get repo contents' });
  }
});

// ============================================
// Slack Integration
// ============================================

/**
 * Send a Slack notification
 */
app.post('/api/slack/notify', async (req: Request, res: Response) => {
  try {
    const { text, channel, attachments } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text field' });
    }

    const success = await sendSlackMessage({ text, channel, attachments });

    res.json({ success });
  } catch (error) {
    console.error('[API] Error sending Slack notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ============================================
// Queue Stats
// ============================================

/**
 * Get queue statistics
 */
app.get('/api/queue/stats', async (_req: Request, res: Response) => {
  try {
    const counts = await taskQueue.getJobCounts();
    const waiting = await taskQueue.getWaiting(0, 10);
    const active = await taskQueue.getActive(0, 10);
    const completed = await taskQueue.getCompleted(0, 10);
    const failed = await taskQueue.getFailed(0, 10);

    res.json({
      counts,
      recent: {
        waiting: waiting.map(j => ({ id: j.id, taskId: j.data.taskId })),
        active: active.map(j => ({ id: j.id, taskId: j.data.taskId })),
        completed: completed.map(j => ({ id: j.id, taskId: j.data.taskId })),
        failed: failed.map(j => ({ id: j.id, taskId: j.data.taskId, error: j.failedReason }))
      }
    });
  } catch (error) {
    console.error('[API] Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

// ============================================
// Error Handler
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║    ██╗   ██╗ ██████╗ ██████╗  ██████╗ ██╗  ██╗            ║
║    ██║   ██║██╔════╝ ██╔══██╗██╔═══██╗██║ ██╔╝            ║
║    ██║   ██║██║  ███╗██████╔╝██║   ██║█████╔╝             ║
║    ╚██╗ ██╔╝██║   ██║██╔══██╗██║   ██║██╔═██╗             ║
║     ╚████╔╝ ╚██████╔╝██║  ██║╚██████╔╝██║  ██╗            ║
║      ╚═══╝   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝            ║
║                                                            ║
║    Cloud Coding Agent API v1.0.0                          ║
║    http://localhost:${PORT}                                   ║
║                                                            ║
║    Endpoints:                                              ║
║    • GET  /api/health        - Health check               ║
║    • GET  /api/discovery     - Capabilities               ║
║    • POST /api/tasks         - Create task                ║
║    • GET  /api/tasks         - List tasks                 ║
║    • GET  /api/tasks/:id     - Get task                   ║
║    • GET  /api/queue/stats   - Queue statistics           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
