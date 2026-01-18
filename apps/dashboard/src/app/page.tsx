'use client'

import { useState, useEffect, useCallback } from 'react'
import { FuturisticCard } from '@/components/FuturisticCard'
import { TeslaButton } from '@/components/TeslaButton'
import { RocketIcon, BoltIcon, CircuitIcon, TaskIcon, CodeIcon, TerminalIcon, StatusDot } from '@/components/Icons'

interface Task {
  id: string
  type: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
  logs: string[]
  createdAt: string
  startedAt?: string
  completedAt?: string
}

interface HealthStatus {
  status: string
  name: string
  version: string
  queue: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * VGrok Futuristic Dashboard - Tesla/SpaceX Inspired
 */
export default function FuturisticDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({ description: '', type: 'custom' })
  const [loading, setLoading] = useState(false)

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`)
      const data = await res.json()
      setHealth(data)
    } catch {
      setHealth({
        status: 'offline',
        name: 'VGrok Agent',
        version: '?',
        queue: { waiting: 0, active: 0, completed: 0, failed: 0 },
      })
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`)
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    fetchTasks()
    const interval = setInterval(() => {
      fetchHealth()
      fetchTasks()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchHealth, fetchTasks])

  const createTask = async () => {
    if (!newTask.description.trim()) return
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      await res.json()
      setNewTask({ description: '', type: 'custom' })
      fetchTasks()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setLoading(false)
    }
  }

  const taskTypeIcons: Record<string, React.ReactNode> = {
    'code-generation': <CodeIcon className="text-neon-cyan" size={16} />,
    'code-review': <TaskIcon className="text-neon-green" size={16} />,
    'refactor': <CircuitIcon className="text-neon-purple" size={16} />,
    'test': <TerminalIcon className="text-neon-orange" size={16} />,
    'custom': <BoltIcon className="text-neon-pink" size={16} />,
  }

  return (
    <main
      className="min-h-screen bg-spacex-dark text-white"
      data-testid="dashboard_main"
    >
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-spacex-dark via-spacex-steel/20 to-spacex-dark pointer-events-none" />
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

      {/* Header */}
      <header
        className="relative border-b border-neon-cyan/20 bg-spacex-dark/80 backdrop-blur-md"
        data-testid="dashboard_header"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <RocketIcon
                className="text-neon-cyan animate-float"
                size={32}
              />
              <div className="absolute inset-0 blur-lg bg-neon-cyan/30" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-neon-cyan">
                VGROK
              </h1>
              <p className="text-xs text-spacex-accent/60 uppercase tracking-widest">
                Cloud Coding Agent
              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-6">
            {/* Online status */}
            <div className="flex items-center gap-2">
              <StatusDot status={health?.status === 'ok' ? 'running' : 'failed'} />
              <span className="text-sm uppercase tracking-wide">
                {health?.status === 'ok' ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Queue stats */}
            {health?.queue && (
              <div className="flex gap-3 text-xs font-mono">
                <div
                  className="px-3 py-1.5 rounded bg-spacex-steel/30 border border-neon-cyan/20"
                  data-testid="dashboard_queue_waiting"
                >
                  <span className="text-neon-cyan/60">QUEUE</span>
                  <span className="ml-2 text-neon-cyan">{health.queue.waiting}</span>
                </div>
                <div
                  className="px-3 py-1.5 rounded bg-spacex-steel/30 border border-neon-green/20"
                  data-testid="dashboard_queue_active"
                >
                  <span className="text-neon-green/60">ACTIVE</span>
                  <span className="ml-2 text-neon-green">{health.queue.active}</span>
                </div>
                <div
                  className="px-3 py-1.5 rounded bg-spacex-steel/30 border border-neon-purple/20"
                  data-testid="dashboard_queue_completed"
                >
                  <span className="text-neon-purple/60">DONE</span>
                  <span className="ml-2 text-neon-purple">{health.queue.completed}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Task creation & list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create task */}
          <FuturisticCard
            title="New Mission"
            glowColor="cyan"
            testId="dashboard_create_task"
          >
            <div className="space-y-4">
              {/* Task type selector */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  { type: 'custom', label: 'Custom', icon: <BoltIcon size={18} /> },
                  { type: 'code-generation', label: 'Generate', icon: <CodeIcon size={18} /> },
                  { type: 'code-review', label: 'Review', icon: <TaskIcon size={18} /> },
                  { type: 'refactor', label: 'Refactor', icon: <CircuitIcon size={18} /> },
                  { type: 'test', label: 'Test', icon: <TerminalIcon size={18} /> },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setNewTask({ ...newTask, type: item.type })}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-lg
                      border transition-all duration-200
                      ${
                        newTask.type === item.type
                          ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                          : 'bg-spacex-steel/20 border-spacex-steel/30 text-white/60 hover:border-neon-cyan/50'
                      }
                    `}
                    data-testid={`dashboard_type_${item.type}`}
                  >
                    {item.icon}
                    <span className="text-xs uppercase">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Description input */}
              <textarea
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Describe your mission objective..."
                rows={3}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-spacex-dark border border-neon-cyan/30
                  text-white placeholder-white/30
                  focus:outline-none focus:border-neon-cyan
                  transition-colors
                "
                data-testid="dashboard_input_description"
              />

              {/* Submit button */}
              <TeslaButton
                onClick={createTask}
                disabled={loading || !newTask.description.trim()}
                loading={loading}
                glowing={!!newTask.description.trim()}
                className="w-full"
                testId="dashboard_button_create"
              >
                <span className="flex items-center justify-center gap-2">
                  <RocketIcon size={18} />
                  Launch Mission
                </span>
              </TeslaButton>
            </div>
          </FuturisticCard>

          {/* Task list */}
          <FuturisticCard
            title={`Mission Control (${tasks.length})`}
            glowColor="green"
            testId="dashboard_tasks_section"
          >
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div
                  className="py-12 text-center text-white/40"
                  data-testid="dashboard_no_tasks"
                >
                  <RocketIcon className="mx-auto mb-4 opacity-30" size={48} />
                  <p>No missions deployed yet</p>
                  <p className="text-sm mt-1">Create your first mission above</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`
                      p-4 rounded-lg cursor-pointer
                      border transition-all duration-200
                      ${
                        selectedTask?.id === task.id
                          ? 'bg-neon-cyan/10 border-neon-cyan/50'
                          : 'bg-spacex-steel/20 border-spacex-steel/30 hover:border-neon-cyan/30'
                      }
                    `}
                    data-testid={`dashboard_task_${task.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <StatusDot status={task.status} className="mt-1.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-neon-cyan">
                              {task.id}
                            </span>
                            {taskTypeIcons[task.type]}
                          </div>
                          <p className="text-sm text-white/70 line-clamp-1 mt-1">
                            {task.description}
                          </p>
                          <p className="text-xs text-white/30 mt-1 font-mono">
                            {new Date(task.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`
                          text-xs px-2 py-1 rounded uppercase font-semibold
                          ${
                            task.status === 'completed'
                              ? 'bg-neon-green/20 text-neon-green'
                              : task.status === 'running'
                              ? 'bg-neon-cyan/20 text-neon-cyan'
                              : task.status === 'failed'
                              ? 'bg-tesla-red/20 text-tesla-red'
                              : 'bg-spacex-steel/20 text-white/50'
                          }
                        `}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </FuturisticCard>
        </div>

        {/* Right column - Task details */}
        <div className="space-y-6">
          {selectedTask ? (
            <>
              {/* Task info */}
              <FuturisticCard
                title="Mission Details"
                glowColor="purple"
                testId="dashboard_task_details"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/40 uppercase text-xs">ID</span>
                      <p className="font-mono text-neon-cyan">{selectedTask.id}</p>
                    </div>
                    <div>
                      <span className="text-white/40 uppercase text-xs">Type</span>
                      <p className="flex items-center gap-2">
                        {taskTypeIcons[selectedTask.type]}
                        <span className="capitalize">{selectedTask.type}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-white/40 uppercase text-xs">Status</span>
                      <p className="flex items-center gap-2">
                        <StatusDot status={selectedTask.status} />
                        <span className="capitalize">{selectedTask.status}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-white/40 uppercase text-xs">Created</span>
                      <p className="text-xs font-mono">
                        {new Date(selectedTask.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase text-xs">Objective</span>
                    <p className="mt-1 p-3 rounded bg-spacex-dark/50 text-sm">
                      {selectedTask.description}
                    </p>
                  </div>
                </div>
              </FuturisticCard>

              {/* Result */}
              {selectedTask.result && (
                <FuturisticCard
                  title="Mission Result"
                  glowColor="green"
                  testId="dashboard_task_result"
                >
                  <pre className="p-3 bg-spacex-dark rounded text-neon-green text-xs overflow-x-auto max-h-[300px] font-mono">
                    {selectedTask.result}
                  </pre>
                </FuturisticCard>
              )}

              {/* Error */}
              {selectedTask.error && (
                <FuturisticCard
                  title="Mission Error"
                  glowColor="orange"
                  testId="dashboard_task_error"
                >
                  <p className="text-tesla-red text-sm">{selectedTask.error}</p>
                </FuturisticCard>
              )}

              {/* Logs */}
              <FuturisticCard
                title="Mission Logs"
                glowColor="cyan"
                testId="dashboard_task_logs"
              >
                <div className="space-y-1 text-xs font-mono max-h-[200px] overflow-y-auto">
                  {selectedTask.logs?.map((log, i) => (
                    <div key={i} className="text-white/60 flex items-start gap-2">
                      <span className="text-neon-cyan/50">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </FuturisticCard>
            </>
          ) : (
            <FuturisticCard title="Mission Details" glowColor="purple">
              <div className="py-12 text-center text-white/40">
                <CircuitIcon className="mx-auto mb-4 opacity-30" size={48} />
                <p>Select a mission to view details</p>
              </div>
            </FuturisticCard>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-neon-cyan/10 py-4 text-center text-xs text-white/30">
        <p>
          VGROK Cloud Coding Agent v1.0.0 | Powered by AI
        </p>
      </footer>
    </main>
  )
}
