import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory task storage (replace with DB later)
const tasks: Map<string, {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
}> = new Map();

let taskCounter = 0;

/**
 * Health check endpoint
 * @returns { status: string, name: string }
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'VGrok Agent' });
});

/**
 * Create a new task
 * @param description - Task description
 * @returns { taskId: string, status: string }
 */
app.post('/api/tasks', (req: Request, res: Response) => {
  const { description } = req.body;

  taskCounter++;
  const taskId = `vgrok-task-${String(taskCounter).padStart(3, '0')}`;

  const task = {
    id: taskId,
    description: description || 'No description',
    status: 'pending' as const,
    createdAt: new Date()
  };

  tasks.set(taskId, task);

  console.log(`[VGrok] Task erstellt: ${taskId} - ${description}`);

  res.json({ taskId, status: 'queued' });
});

/**
 * Get all tasks
 * @returns Array of tasks
 */
app.get('/api/tasks', (_req: Request, res: Response) => {
  const allTasks = Array.from(tasks.values());
  res.json(allTasks);
});

/**
 * Get single task by ID
 * @param id - Task ID
 * @returns Task object or 404
 */
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

/**
 * Discovery endpoint - list available capabilities
 * @returns Capabilities object
 */
app.get('/api/discovery', (_req: Request, res: Response) => {
  res.json({
    name: 'VGrok Agent',
    version: '1.0.0',
    capabilities: [
      'task-management',
      'code-generation',
      'code-review',
      'testing',
      'deployment'
    ],
    providers: [
      'anthropic',
      'openai',
      'grok'
    ]
  });
});

/**
 * Proposals endpoint - get improvement proposals
 * @returns Proposals array
 */
app.get('/api/proposals', (_req: Request, res: Response) => {
  res.json({
    proposals: [],
    message: 'No proposals pending'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    VGrok Agent API v1.0.0              ║
║    http://localhost:${PORT}               ║
╚════════════════════════════════════════╝
  `);
});
