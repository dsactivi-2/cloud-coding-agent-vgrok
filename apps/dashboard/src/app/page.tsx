'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface QueueStats {
  counts: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
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

export default function Dashboard() {
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
      setHealth({ status: 'offline', name: 'VGrok Agent', version: '?', queue: { waiting: 0, active: 0, completed: 0, failed: 0 } })
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
        body: JSON.stringify(newTask)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500 animate-pulse'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="dashboard_main">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow" data-testid="dashboard_header">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">VGrok</div>
            <span className="text-sm text-gray-500">Cloud Coding Agent</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {health?.status === 'ok' ? 'Online' : 'Offline'}
              </span>
            </div>
            {health?.queue && (
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 rounded" data-testid="dashboard_queue_waiting">
                  Waiting: {health.queue.waiting}
                </span>
                <span className="px-2 py-1 bg-blue-100 rounded" data-testid="dashboard_queue_active">
                  Active: {health.queue.active}
                </span>
                <span className="px-2 py-1 bg-green-100 rounded" data-testid="dashboard_queue_completed">
                  Done: {health.queue.completed}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Create Task + Task List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Task */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4" data-testid="dashboard_create_task">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">New Task</h2>
            <div className="space-y-3">
              <select
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                data-testid="dashboard_select_type"
              >
                <option value="custom">Custom Task</option>
                <option value="code-generation">Code Generation</option>
                <option value="code-review">Code Review</option>
                <option value="refactor">Refactor</option>
                <option value="test">Generate Tests</option>
              </select>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe your task..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                data-testid="dashboard_input_description"
              />
              <button
                onClick={createTask}
                disabled={loading || !newTask.description.trim()}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="dashboard_button_create"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow" data-testid="dashboard_tasks_section">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks ({tasks.length})</h2>
            </div>
            <div className="divide-y dark:divide-gray-700 max-h-[500px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500" data-testid="dashboard_no_tasks">
                  No tasks yet. Create one above!
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                      selectedTask?.id === task.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                    }`}
                    data-testid={`dashboard_task_${task.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full ${getStatusColor(task.status)}`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{task.id}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                            {task.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(task.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                          {task.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Task Details */}
        <div className="space-y-6">
          {selectedTask ? (
            <>
              {/* Task Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4" data-testid="dashboard_task_details">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Task Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 font-mono">{selectedTask.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2">{selectedTask.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getStatusBadge(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(selectedTask.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedTask.completedAt && (
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-2">{new Date(selectedTask.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-gray-500 text-sm mb-1">Description:</div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    {selectedTask.description}
                  </div>
                </div>
              </div>

              {/* Result */}
              {selectedTask.result && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4" data-testid="dashboard_task_result">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Result</h2>
                  <pre className="p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto max-h-[300px]">
                    {selectedTask.result}
                  </pre>
                </div>
              )}

              {/* Error */}
              {selectedTask.error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-4" data-testid="dashboard_task_error">
                  <h2 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-400">Error</h2>
                  <div className="text-red-600 dark:text-red-300 text-sm">{selectedTask.error}</div>
                </div>
              )}

              {/* Logs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4" data-testid="dashboard_task_logs">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Logs</h2>
                <div className="space-y-1 text-xs font-mono max-h-[200px] overflow-y-auto">
                  {selectedTask.logs?.map((log, i) => (
                    <div key={i} className="text-gray-600 dark:text-gray-400">{log}</div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500">
              Select a task to view details
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
